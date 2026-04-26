-- Mayor de una cuenta con saldo corriente
CREATE OR REPLACE FUNCTION report_ledger(
  p_book_id UUID, p_account_id UUID,
  p_from DATE, p_to DATE
) RETURNS TABLE (
  line_id UUID, entry_date DATE, description TEXT, reference TEXT,
  debit NUMERIC, credit NUMERIC, balance NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH lines AS (
    SELECT jl.id, je.entry_date, je.description, je.reference, jl.debit, jl.credit
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.entry_id
    WHERE je.book_id = p_book_id
      AND jl.account_id = p_account_id
      AND je.entry_date BETWEEN p_from AND p_to
    ORDER BY je.entry_date, je.created_at
  )
  SELECT id, entry_date, description, reference, debit, credit,
         SUM(debit - credit) OVER (ORDER BY entry_date, id) AS balance
  FROM lines;
END;
$$;

-- Balance de comprobación a una fecha
CREATE OR REPLACE FUNCTION report_trial_balance(
  p_book_id UUID, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type,
  total_debit NUMERIC, total_credit NUMERIC, balance NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    a.id, a.code, a.name, a.type,
    COALESCE(SUM(jl.debit), 0),
    COALESCE(SUM(jl.credit), 0),
    COALESCE(SUM(jl.debit) - SUM(jl.credit), 0)
  FROM accounts a
  LEFT JOIN journal_lines jl ON jl.account_id = a.id
  LEFT JOIN journal_entries je ON je.id = jl.entry_id
    AND je.entry_date <= p_to
    AND je.book_id = p_book_id
  WHERE a.book_id = p_book_id AND a.is_active
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.code;
$$;

-- Estado de Resultados (entre dos fechas)
CREATE OR REPLACE FUNCTION report_income_statement(
  p_book_id UUID, p_from DATE, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type, amount NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.id, a.code, a.name, a.type,
    CASE
      WHEN a.type = 'income'  THEN COALESCE(SUM(jl.credit - jl.debit), 0)
      WHEN a.type = 'expense' THEN COALESCE(SUM(jl.debit - jl.credit), 0)
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

-- Balance General a una fecha
CREATE OR REPLACE FUNCTION report_balance_sheet(
  p_book_id UUID, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type, balance NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT a.id, a.code, a.name, a.type,
    CASE
      WHEN a.type = 'asset'      THEN COALESCE(SUM(jl.debit - jl.credit), 0)
      WHEN a.type = 'liability'  THEN COALESCE(SUM(jl.credit - jl.debit), 0)
      WHEN a.type = 'equity'     THEN COALESCE(SUM(jl.credit - jl.debit), 0)
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

-- Ingresos vs gastos por mes (últimos N meses) para dashboard
CREATE OR REPLACE FUNCTION report_monthly_summary(
  p_book_id UUID, p_months INT DEFAULT 6
) RETURNS TABLE (
  month TEXT, income NUMERIC, expense NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', je.entry_date), 'YYYY-MM') AS month,
    COALESCE(SUM(CASE WHEN a.type = 'income'  THEN jl.credit - jl.debit ELSE 0 END), 0) AS income,
    COALESCE(SUM(CASE WHEN a.type = 'expense' THEN jl.debit - jl.credit ELSE 0 END), 0) AS expense
  FROM journal_entries je
  JOIN journal_lines jl ON jl.entry_id = je.id
  JOIN accounts a ON a.id = jl.account_id
  WHERE je.book_id = p_book_id
    AND je.entry_date >= DATE_TRUNC('month', CURRENT_DATE) - ((p_months - 1) * INTERVAL '1 month')
  GROUP BY DATE_TRUNC('month', je.entry_date)
  ORDER BY month;
$$;
