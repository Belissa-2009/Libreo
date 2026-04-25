# Fase 07 — Mayor y reportes financieros

## Goal
Implementar las tres vistas contables principales:
1. **Libro Mayor** por cuenta (con saldo corriente).
2. **Balance de Comprobación** (suma de débitos/créditos por cuenta).
3. **Estado de Resultados** (P&L) y **Balance General**.

Todos parametrizados por rango de fechas. Datos calculados en SQL, frontend solo muestra.

## Prerequisites
- Fase 06 completada con asientos de prueba.

## Steps

### 1. Vistas / RPCs en Postgres

Genera con `supabase migration new reports_functions`. Las vistas básicas (`v_ledger`, `v_trial_balance`) ya existen de la fase 02; aquí agregamos reportes con rango de fechas como funciones RPC.

```sql
-- Mayor de una cuenta con saldo corriente
CREATE OR REPLACE FUNCTION report_ledger(
  p_book_id UUID, p_account_id UUID,
  p_from DATE, p_to DATE
) RETURNS TABLE (
  line_id UUID, entry_date DATE, description TEXT, reference TEXT,
  debit NUMERIC, credit NUMERIC, balance NUMERIC
) LANGUAGE plpgsql STABLE AS $$
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
) LANGUAGE sql STABLE AS $$
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
) LANGUAGE sql STABLE AS $$
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
) LANGUAGE sql STABLE AS $$
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
```

> **Nota multimoneda**: estas funciones suman en moneda nominal de los asientos. La conversión a moneda base se agrega en la Fase 08.

### 2. API y hooks

`src/features/reports/api.ts`:
- `getLedger(bookId, accountId, from, to)`
- `getTrialBalance(bookId, to)`
- `getIncomeStatement(bookId, from, to)`
- `getBalanceSheet(bookId, to)`

Cada uno llama el RPC correspondiente con `supabase.rpc(...)`. Hooks con TanStack Query.

### 3. Páginas

#### `src/pages/reports/LedgerPage.tsx`
- Selector de cuenta (combobox).
- Rango de fechas (default: mes actual).
- Tabla: Fecha · Descripción · Ref · Débito · Crédito · Saldo.
- Totales abajo.

#### `src/pages/reports/TrialBalancePage.tsx`
- Selector de fecha "al cierre".
- Tabla agrupada por tipo de cuenta:
  - Código · Nombre · Total Débito · Total Crédito · Saldo
- Totales finales: deben coincidir débito = crédito (validación visual: si no cuadra, mostrar warning).

#### `src/pages/reports/IncomeStatementPage.tsx`
- Rango de fechas (default: mes actual).
- Sección **Ingresos** con líneas y subtotal.
- Sección **Gastos** con líneas y subtotal.
- **Utilidad / Pérdida neta** = Ingresos - Gastos (resaltado).

#### `src/pages/reports/BalanceSheetPage.tsx`
- Selector de fecha.
- Dos columnas (desktop) o secciones apiladas (mobile):
  - Izquierda: **Activos** (Corriente, No Corriente) con totales.
  - Derecha: **Pasivos + Patrimonio**.
- Incluir "Utilidad del periodo" en patrimonio (calcular = `report_income_statement` desde inicio del año fiscal hasta `p_to`).
- Validación: `Total Activo == Total Pasivo + Patrimonio`. Si no cuadra (caso raro), warning rojo.

### 4. Layout y navegación

Sidebar/bottom nav agrega entrada "Reportes" con sub-items o tabs:
- Mayor
- Balance de Comprobación
- Estado de Resultados
- Balance General

### 5. Componentes reutilizables

- `src/features/reports/components/DateRangePicker.tsx`
- `src/features/reports/components/AccountTypeSection.tsx` (encabezado + filas + subtotal)

### 6. Considera agregar Dashboard al Home

Reemplaza `HomePage` por un dashboard simple con KPIs:
- Saldo de Caja + Banco
- Ingresos del mes
- Gastos del mes
- Utilidad del mes
- Próximo vencimiento de préstamo (cuando exista la fase 09)

Usa `Recharts` para un gráfico simple de ingresos vs gastos por mes (últimos 6 meses).

## Files created/modified

- `supabase/migrations/<timestamp>_reports_functions.sql`
- `src/features/reports/api.ts`
- `src/features/reports/hooks/*.ts`
- `src/features/reports/components/{DateRangePicker,AccountTypeSection,KpiCard}.tsx`
- `src/pages/reports/{Ledger,TrialBalance,IncomeStatement,BalanceSheet}Page.tsx`
- `src/pages/HomePage.tsx` (dashboard)
- `src/routes/index.tsx`

## Verification

Datos de prueba (insértalos manualmente):
1. Aporte inicial: Caja 5000 / Capital 5000.
2. Servicio prestado: Banco 2000 / Ingresos por servicios 2000.
3. Pago renta: Gastos operativos 800 / Caja 800.

Verifica:
1. **Mayor de Caja**: 2 movimientos, saldo = 4200.
2. **Balance de Comprobación al final**: total débito = total crédito = 7800.
3. **Estado de Resultados** (mismo periodo): Ingresos 2000, Gastos 800, Utilidad 1200.
4. **Balance General**: Activo (Caja 4200 + Banco 2000) = 6200; Patrimonio (Capital 5000 + Utilidad 1200) = 6200; Pasivo 0. **Cuadra**.
5. Cambiar el rango de fechas y ver que los números cambian.
6. Mobile: las tablas son legibles; usa `overflow-x-auto` solo cuando sea inevitable.

## Definition of Done

- [ ] Los 4 reportes funcionan y los números cuadran.
- [ ] El Balance General respeta la ecuación contable: Activo = Pasivo + Patrimonio.
- [ ] El Dashboard del home muestra KPIs reales.
- [ ] Commit: `feat(phase-07): mayor + balance de comprobación + P&L + balance general`.

## Notas

- Si las funciones RPC son lentas con muchos asientos, se pueden materializar como vistas materializadas refrescadas en background. No optimizar prematuramente.
- "Utilidad del periodo" en Balance General: por simplicidad usa el rango "desde 1 enero del año del `p_to` hasta `p_to`". En la fase 12 se hará cierre formal.
