-- FIX: "column reference entry_date is ambiguous" en report_ledger
--
-- En PL/pgSQL, los nombres de columna del RETURNS TABLE se registran
-- como variables locales. Si el CTE usa los mismos nombres, Postgres
-- no puede distinguir entre variable y columna → error 42702.
--
-- Solución: reescribir como LANGUAGE sql (sin variables locales).

DROP FUNCTION IF EXISTS report_ledger(UUID, UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION report_ledger(
  p_book_id    UUID,
  p_account_id UUID,
  p_from       DATE,
  p_to         DATE
) RETURNS TABLE (
  line_id       UUID,
  entry_date    DATE,
  description   TEXT,
  reference     TEXT,
  debit         NUMERIC,
  credit        NUMERIC,
  balance       NUMERIC,
  currency_code TEXT,
  exchange_rate NUMERIC,
  orig_debit    NUMERIC,
  orig_credit   NUMERIC
) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  WITH lines AS (
    SELECT
      jl.id                            AS line_id,
      je.entry_date                    AS entry_date,
      je.description                   AS description,
      je.reference                     AS reference,
      jl.debit  * je.exchange_rate     AS debit,
      jl.credit * je.exchange_rate     AS credit,
      je.currency_code                 AS currency_code,
      je.exchange_rate                 AS exchange_rate,
      jl.debit                         AS orig_debit,
      jl.credit                        AS orig_credit
    FROM journal_lines jl
    JOIN journal_entries je ON je.id = jl.entry_id
    WHERE je.book_id    = p_book_id
      AND jl.account_id = p_account_id
      AND je.entry_date BETWEEN p_from AND p_to
    ORDER BY je.entry_date, je.created_at
  )
  SELECT
    line_id,
    entry_date,
    description,
    reference,
    debit,
    credit,
    SUM(debit - credit) OVER (ORDER BY entry_date, line_id) AS balance,
    currency_code,
    exchange_rate,
    orig_debit,
    orig_credit
  FROM lines;
$$;
