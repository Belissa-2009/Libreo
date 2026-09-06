ALTER TYPE loan_frequency ADD VALUE IF NOT EXISTS 'daily';

CREATE OR REPLACE FUNCTION loan_period_rate(
  p_annual_rate NUMERIC, p_frequency loan_frequency
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE p_frequency::TEXT
    WHEN 'daily' THEN p_annual_rate / 365 / 100
    WHEN 'weekly' THEN p_annual_rate / 52 / 100
    WHEN 'biweekly' THEN p_annual_rate / 26 / 100
    ELSE p_annual_rate / 12 / 100
  END;
END;
$$;

CREATE OR REPLACE FUNCTION loan_period_date(
  p_start_date DATE, p_period INT, p_frequency loan_frequency
) RETURNS DATE LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN CASE p_frequency::TEXT
    WHEN 'daily' THEN p_start_date + p_period
    WHEN 'weekly' THEN p_start_date + (p_period * 7)
    WHEN 'biweekly' THEN p_start_date + (p_period * 14)
    ELSE (p_start_date + (p_period * INTERVAL '1 month'))::DATE
  END;
END;
$$;

CREATE OR REPLACE FUNCTION french_installment(
  p_principal NUMERIC, p_annual_rate NUMERIC, p_term_months INT
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER AS $$
DECLARE
  i NUMERIC := p_annual_rate / 12 / 100;
BEGIN
  IF i = 0 THEN RETURN ROUND(p_principal / p_term_months, 4); END IF;
  RETURN ROUND(p_principal * i / (1 - POWER(1 + i, -p_term_months)), 4);
END;
$$;

CREATE OR REPLACE FUNCTION french_installment(
  p_principal NUMERIC, p_annual_rate NUMERIC, p_term_periods INT, p_frequency loan_frequency
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER AS $$
DECLARE
  i NUMERIC := loan_period_rate(p_annual_rate, p_frequency);
BEGIN
  IF i = 0 THEN RETURN ROUND(p_principal / p_term_periods, 4); END IF;
  RETURN ROUND(p_principal * i / (1 - POWER(1 + i, -p_term_periods)), 4);
END;
$$;

CREATE OR REPLACE FUNCTION generate_loan_schedule(p_loan_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan loans%ROWTYPE;
  v_installment NUMERIC;
  v_balance NUMERIC;
  v_i NUMERIC;
  v_principal NUMERIC;
  v_interest NUMERIC;
  v_due DATE;
  v_n INT;
BEGIN
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  v_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months, v_loan.frequency);
  v_balance := v_loan.principal;
  v_i := loan_period_rate(v_loan.annual_rate, v_loan.frequency);

  FOR v_n IN 1..v_loan.term_months LOOP
    v_due := loan_period_date(v_loan.start_date, v_n, v_loan.frequency);
    v_interest := ROUND(v_balance * v_i, 4);
    v_principal := ROUND(v_installment - v_interest, 4);
    IF v_n = v_loan.term_months THEN
      v_principal := v_balance;
    END IF;
    v_balance := ROUND(v_balance - v_principal, 4);

    INSERT INTO loan_schedule (loan_id, installment_number, due_date, principal_portion, interest_portion, balance_after, version)
    VALUES (p_loan_id, v_n, v_due, v_principal, v_interest, v_balance, 1);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION preview_extra_payment(
  p_loan_id UUID, p_amount NUMERIC, p_strategy payment_strategy
) RETURNS TABLE(
  new_term INT, new_installment NUMERIC, saved_installments INT
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_loan loans%ROWTYPE;
  v_current_version INT;
  v_remaining_balance NUMERIC;
  v_remaining_term INT;
  v_new_installment NUMERIC;
  v_i NUMERIC;
  v_balance NUMERIC;
  v_new_term INT;
BEGIN
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  SELECT COALESCE(MAX(version), 1) INTO v_current_version FROM loan_schedule WHERE loan_id = p_loan_id;
  SELECT COUNT(*) INTO v_remaining_term FROM loan_schedule
    WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';
  SELECT COALESCE((SELECT balance_after FROM loan_schedule
    WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'paid'
    ORDER BY installment_number DESC LIMIT 1), v_loan.principal) INTO v_remaining_balance;

  v_remaining_balance := v_remaining_balance - p_amount;
  IF v_remaining_balance <= 0 THEN
    RETURN QUERY SELECT 0, 0::NUMERIC, v_remaining_term;
    RETURN;
  END IF;

  v_i := loan_period_rate(v_loan.annual_rate, v_loan.frequency);
  IF p_strategy = 'reduce_installment' THEN
    v_new_installment := french_installment(v_remaining_balance, v_loan.annual_rate, v_remaining_term, v_loan.frequency);
    RETURN QUERY SELECT v_remaining_term, v_new_installment, 0;
  ELSE
    v_new_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months, v_loan.frequency);
    v_balance := v_remaining_balance;
    v_new_term := 0;
    WHILE v_balance > 0.01 LOOP
      v_balance := v_balance - GREATEST(v_new_installment - ROUND(v_balance * v_i, 4), 0.01);
      v_new_term := v_new_term + 1;
    END LOOP;
    RETURN QUERY SELECT v_new_term, v_new_installment, v_remaining_term - v_new_term;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION apply_extra_payment(
  p_loan_id UUID, p_payment_date DATE, p_amount NUMERIC, p_strategy payment_strategy
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan loans%ROWTYPE;
  v_current_version INT;
  v_remaining_balance NUMERIC;
  v_remaining_term INT;
  v_new_installment NUMERIC;
  v_balance NUMERIC;
  v_i NUMERIC;
  v_principal NUMERIC;
  v_interest NUMERIC;
  v_due DATE;
  v_n INT;
  v_entry_id UUID;
  v_first_pending_number INT;
  v_first_pending_due DATE;
BEGIN
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  SELECT COALESCE(MAX(version), 1) INTO v_current_version FROM loan_schedule WHERE loan_id = p_loan_id;
  SELECT COALESCE((SELECT balance_after FROM loan_schedule
    WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'paid'
    ORDER BY installment_number DESC LIMIT 1), v_loan.principal) INTO v_remaining_balance;
  SELECT COUNT(*) INTO v_remaining_term FROM loan_schedule
    WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';
  SELECT MIN(installment_number), MIN(due_date) INTO v_first_pending_number, v_first_pending_due
    FROM loan_schedule WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

  v_remaining_balance := v_remaining_balance - p_amount;
  UPDATE loan_schedule SET status = 'cancelled'
    WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

  IF v_remaining_balance > 0.01 THEN
    v_i := loan_period_rate(v_loan.annual_rate, v_loan.frequency);
    IF p_strategy = 'reduce_installment' THEN
      v_new_installment := french_installment(v_remaining_balance, v_loan.annual_rate, v_remaining_term, v_loan.frequency);
    ELSE
      v_new_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months, v_loan.frequency);
    END IF;

    v_balance := v_remaining_balance;
    v_n := 0;
    v_due := v_first_pending_due;
    WHILE v_balance > 0.01 LOOP
      v_n := v_n + 1;
      v_interest := ROUND(v_balance * v_i, 4);
      v_principal := ROUND(LEAST(v_new_installment - v_interest, v_balance), 4);
      IF v_principal <= 0 THEN v_principal := v_balance; END IF;
      v_balance := ROUND(v_balance - v_principal, 4);
      INSERT INTO loan_schedule (loan_id, installment_number, due_date, principal_portion, interest_portion, balance_after, version)
      VALUES (p_loan_id, v_first_pending_number + v_n - 1, v_due, v_principal, v_interest, v_balance, v_current_version + 1);
      v_due := loan_period_date(v_due, 1, v_loan.frequency);
    END LOOP;
  END IF;

  IF v_loan.type = 'received' THEN
    PERFORM create_journal_entry(v_loan.book_id, p_payment_date,
      'Abono extraordinario préstamo ' || v_loan.counterparty, '', 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.liability_account_id, 'debit', p_amount, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', 0, 'credit', p_amount, 'memo', '')
      ));
  ELSE
    PERFORM create_journal_entry(v_loan.book_id, p_payment_date,
      'Abono recibido préstamo ' || v_loan.counterparty, '', 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', p_amount, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.asset_account_id, 'debit', 0, 'credit', p_amount, 'memo', '')
      ));
  END IF;

  SELECT id INTO v_entry_id FROM journal_entries WHERE book_id = v_loan.book_id ORDER BY created_at DESC LIMIT 1;
  INSERT INTO loan_payments (loan_id, payment_date, amount, type, strategy, journal_entry_id, created_by)
    VALUES (p_loan_id, p_payment_date, p_amount, 'extra', p_strategy, v_entry_id, auth.uid());
  RETURN v_entry_id;
END;
$$;
