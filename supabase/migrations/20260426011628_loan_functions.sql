-- Calcula la cuota fija con método francés
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

-- Genera la tabla de amortización completa para un préstamo
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
  v_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months);
  v_balance := v_loan.principal;
  v_i := v_loan.annual_rate / 12 / 100;

  FOR v_n IN 1..v_loan.term_months LOOP
    v_due := v_loan.start_date + (v_n * INTERVAL '1 month');
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

-- Previsualizar abono extraordinario (sin persistir)
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

  SELECT COUNT(*) INTO v_remaining_term
  FROM loan_schedule
  WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

  SELECT COALESCE(
    (SELECT balance_after FROM loan_schedule
     WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'paid'
     ORDER BY installment_number DESC LIMIT 1),
    v_loan.principal
  ) INTO v_remaining_balance;

  v_remaining_balance := v_remaining_balance - p_amount;
  IF v_remaining_balance <= 0 THEN
    RETURN QUERY SELECT 0, 0::NUMERIC, v_remaining_term;
    RETURN;
  END IF;

  v_i := v_loan.annual_rate / 12 / 100;

  IF p_strategy = 'reduce_installment' THEN
    v_new_installment := french_installment(v_remaining_balance, v_loan.annual_rate, v_remaining_term);
    RETURN QUERY SELECT v_remaining_term, v_new_installment, 0;
  ELSE
    v_new_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months);
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

-- Pagar cuota regular
CREATE OR REPLACE FUNCTION pay_loan_installment(
  p_installment_id UUID, p_payment_date DATE
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inst loan_schedule%ROWTYPE;
  v_loan loans%ROWTYPE;
  v_entry_id UUID;
  v_total NUMERIC;
BEGIN
  SELECT * INTO v_inst FROM loan_schedule WHERE id = p_installment_id;
  SELECT * INTO v_loan FROM loans WHERE id = v_inst.loan_id;
  v_total := v_inst.principal_portion + v_inst.interest_portion;

  IF v_loan.type = 'received' THEN
    PERFORM create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Cuota ' || v_inst.installment_number || ' préstamo ' || v_loan.counterparty,
      '', 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.liability_account_id, 'debit', v_inst.principal_portion, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.interest_account_id, 'debit', v_inst.interest_portion, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', 0, 'credit', v_total, 'memo', '')
      )
    );
    SELECT id INTO v_entry_id FROM journal_entries
      WHERE book_id = v_loan.book_id
      ORDER BY created_at DESC LIMIT 1;
  ELSE
    PERFORM create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Cobro cuota ' || v_inst.installment_number || ' préstamo ' || v_loan.counterparty,
      '', 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', v_total, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.asset_account_id, 'debit', 0, 'credit', v_inst.principal_portion, 'memo', ''),
        jsonb_build_object('account_id', v_loan.interest_account_id, 'debit', 0, 'credit', v_inst.interest_portion, 'memo', '')
      )
    );
    SELECT id INTO v_entry_id FROM journal_entries
      WHERE book_id = v_loan.book_id
      ORDER BY created_at DESC LIMIT 1;
  END IF;

  UPDATE loan_schedule SET status = 'paid', journal_entry_id = v_entry_id WHERE id = p_installment_id;
  INSERT INTO loan_payments (loan_id, payment_date, amount, type, applied_to_installment_id, journal_entry_id, created_by)
  VALUES (v_loan.id, p_payment_date, v_total, 'regular', p_installment_id, v_entry_id, auth.uid());

  RETURN v_entry_id;
END;
$$;

-- Aplicar abono extraordinario
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

  SELECT COALESCE(
    (SELECT balance_after FROM loan_schedule
     WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'paid'
     ORDER BY installment_number DESC LIMIT 1),
    v_loan.principal
  ) INTO v_remaining_balance;

  SELECT COUNT(*) INTO v_remaining_term
  FROM loan_schedule
  WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

  SELECT MIN(installment_number), MIN(due_date) INTO v_first_pending_number, v_first_pending_due
  FROM loan_schedule
  WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

  v_remaining_balance := v_remaining_balance - p_amount;

  -- Cancel all pending in current version
  UPDATE loan_schedule SET status = 'cancelled'
  WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

  IF v_remaining_balance > 0.01 THEN
    v_i := v_loan.annual_rate / 12 / 100;

    IF p_strategy = 'reduce_installment' THEN
      v_new_installment := french_installment(v_remaining_balance, v_loan.annual_rate, v_remaining_term);
    ELSE
      v_new_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months);
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
      v_due := v_due + INTERVAL '1 month';
    END LOOP;
  END IF;

  -- Journal entry for the extra payment
  IF v_loan.type = 'received' THEN
    PERFORM create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Abono extraordinario préstamo ' || v_loan.counterparty,
      '', 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.liability_account_id, 'debit', p_amount, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', 0, 'credit', p_amount, 'memo', '')
      )
    );
  ELSE
    PERFORM create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Abono recibido préstamo ' || v_loan.counterparty,
      '', 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', p_amount, 'credit', 0, 'memo', ''),
        jsonb_build_object('account_id', v_loan.asset_account_id, 'debit', 0, 'credit', p_amount, 'memo', '')
      )
    );
  END IF;

  SELECT id INTO v_entry_id FROM journal_entries
    WHERE book_id = v_loan.book_id
    ORDER BY created_at DESC LIMIT 1;

  INSERT INTO loan_payments (loan_id, payment_date, amount, type, strategy, journal_entry_id, created_by)
  VALUES (p_loan_id, p_payment_date, p_amount, 'extra', p_strategy, v_entry_id, auth.uid());

  RETURN v_entry_id;
END;
$$;
