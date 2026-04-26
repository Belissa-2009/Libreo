-- Update report functions to convert amounts to book base currency
-- using exchange_rate stored on each journal entry (frozen at creation time)

-- Drop report_ledger first since we're changing its return type
DROP FUNCTION IF EXISTS report_ledger(UUID, UUID, DATE, DATE);

-- Mayor de una cuenta con saldo corriente (en moneda base)
CREATE OR REPLACE FUNCTION report_ledger(
  p_book_id UUID, p_account_id UUID,
  p_from DATE, p_to DATE
) RETURNS TABLE (
  line_id UUID, entry_date DATE, description TEXT, reference TEXT,
  debit NUMERIC, credit NUMERIC, balance NUMERIC,
  currency_code TEXT, exchange_rate NUMERIC, orig_debit NUMERIC, orig_credit NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH lines AS (
    SELECT
      jl.id,
      je.entry_date,
      je.description,
      je.reference,
      jl.debit * je.exchange_rate AS debit,
      jl.credit * je.exchange_rate AS credit,
      je.currency_code,
      je.exchange_rate,
      jl.debit AS orig_debit,
      jl.credit AS orig_credit
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.entry_id
    WHERE je.book_id = p_book_id
      AND jl.account_id = p_account_id
      AND je.entry_date BETWEEN p_from AND p_to
    ORDER BY je.entry_date, je.created_at
  )
  SELECT
    id, entry_date, description, reference,
    debit, credit,
    SUM(debit - credit) OVER (ORDER BY entry_date, id) AS balance,
    currency_code, exchange_rate, orig_debit, orig_credit
  FROM lines;
END;
$$;

-- Balance de comprobación a una fecha (en moneda base)
CREATE OR REPLACE FUNCTION report_trial_balance(
  p_book_id UUID, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type,
  total_debit NUMERIC, total_credit NUMERIC, balance NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.id, a.code, a.name, a.type,
    COALESCE(SUM(jl.debit  * je.exchange_rate), 0),
    COALESCE(SUM(jl.credit * je.exchange_rate), 0),
    COALESCE(SUM((jl.debit - jl.credit) * je.exchange_rate), 0)
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.entry_id
    AND je.entry_date <= p_to
    AND je.book_id = p_book_id
  WHERE a.book_id = p_book_id AND a.is_active
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.code;
$$;

-- Estado de Resultados en moneda base
CREATE OR REPLACE FUNCTION report_income_statement(
  p_book_id UUID, p_from DATE, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type, amount NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.id, a.code, a.name, a.type,
    CASE
      WHEN a.type = 'income'  THEN COALESCE(SUM((jl.credit - jl.debit) * je.exchange_rate), 0)
      WHEN a.type = 'expense' THEN COALESCE(SUM((jl.debit - jl.credit) * je.exchange_rate), 0)
    END
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.entry_id
    AND je.book_id = p_book_id
    AND je.entry_date BETWEEN p_from AND p_to
  WHERE a.book_id = p_book_id AND a.type IN ('income','expense') AND a.is_active
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.code;
$$;

-- Balance General en moneda base
CREATE OR REPLACE FUNCTION report_balance_sheet(
  p_book_id UUID, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type, balance NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.id, a.code, a.name, a.type,
    CASE
      WHEN a.type = 'asset'      THEN COALESCE(SUM((jl.debit - jl.credit) * je.exchange_rate), 0)
      WHEN a.type = 'liability'  THEN COALESCE(SUM((jl.credit - jl.debit) * je.exchange_rate), 0)
      WHEN a.type = 'equity'     THEN COALESCE(SUM((jl.credit - jl.debit) * je.exchange_rate), 0)
    END
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.entry_id
    AND je.book_id = p_book_id
    AND je.entry_date <= p_to
  WHERE a.book_id = p_book_id AND a.type IN ('asset','liability','equity') AND a.is_active
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.code;
$$;

-- Función RPC: obtener tasa de cambio más reciente <= date
CREATE OR REPLACE FUNCTION get_exchange_rate(
  p_book_id UUID, p_from TEXT, p_to TEXT, p_date DATE
) RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT rate FROM exchange_rates
     WHERE book_id = p_book_id AND from_currency = p_from AND to_currency = p_to
       AND rate_date <= p_date
     ORDER BY rate_date DESC LIMIT 1),
    CASE WHEN p_from = p_to THEN 1 ELSE NULL END
  );
$$;
