# Fase 08 — Multimoneda

## Goal
Permitir registrar asientos en moneda distinta a la base del libro, con tasa de cambio por asiento. Reportes muestran montos convertidos a moneda base. Mantener historial de tasas por libro y fecha.

## Prerequisites
- Fase 07 completada.

## Steps

### 1. Gestión de tasas de cambio

`src/features/currencies/api.ts`:
- `listExchangeRates(bookId, options?)` — opcional filtro por moneda y rango.
- `upsertExchangeRate({ book_id, from_currency, to_currency, rate, rate_date })`.
- `getRateForDate(bookId, from, to, date)` — busca la tasa más reciente <= date. Si no hay y `from == to`, devuelve 1.

Página `src/pages/currencies/ExchangeRatesPage.tsx`:
- Tabla con tasas existentes; filtros por moneda.
- Form para agregar/editar (modal): `from`, `to`, `rate`, `date`.
- Tip: agregar siempre tasas hacia la moneda base del libro (ej: USD→VES).

### 2. Integrar en el form de asiento

`JournalEntryForm` (de fase 06):
- El select de moneda lista todas las monedas disponibles.
- Si la moneda elegida es distinta de `book.base_currency`:
  - Mostrar campo "Tasa de cambio" precargado con la tasa más reciente para esa fecha.
  - Mostrar texto pequeño: "1 USD = X.XX VES (tasa al DD/MM/AAAA)".
  - Permitir override manual.
- Si es igual a base, ocultar el campo y forzar `exchange_rate = 1`.

### 3. Actualizar reportes para convertir

Modifica las funciones RPC de la fase 07 para sumar en moneda base. La conversión es directa porque cada asiento ya tiene `exchange_rate` (congelado al momento del asiento) y `currency_code`.

Ejemplo, modifica `report_trial_balance`:

```sql
CREATE OR REPLACE FUNCTION report_trial_balance(
  p_book_id UUID, p_to DATE
) RETURNS TABLE (
  account_id UUID, code TEXT, name TEXT, type account_type,
  total_debit NUMERIC, total_credit NUMERIC, balance NUMERIC
) LANGUAGE sql STABLE AS $$
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
```

Aplica el mismo patrón (multiplicar débito/crédito por `je.exchange_rate`) en:
- `report_ledger`
- `report_income_statement`
- `report_balance_sheet`

### 4. Mostrar moneda original en mayor

`report_ledger` debe devolver también `currency_code` y `exchange_rate` para que la UI muestre, opcionalmente, el monto original junto al convertido. Ejemplo: `100 USD (5000 VES @ 50)`.

### 5. Validación

- `exchange_rate > 0` siempre.
- Si el usuario selecciona moneda extranjera y no hay tasa cargada, sugerir crearla (link al modal).
- Si edita la tasa después, los reportes se recalculan al vuelo.

### 6. Convención de tasa

`exchange_rate` significa: "cuántas unidades de moneda base equivalen a 1 unidad de la moneda del asiento".
- Ejemplo: libro base = VES, asiento en USD con `exchange_rate = 50` → cada USD vale 50 VES.
- Cuando se calcula reporte en base: `monto_base = monto_asiento × exchange_rate`.

Documenta esto explícitamente en un tooltip del campo.

## Files created/modified

- `supabase/migrations/<timestamp>_reports_multicurrency.sql` (CREATE OR REPLACE de las 4 funciones de fase 07; nueva migration generada con `supabase migration new reports_multicurrency`)
- `src/features/currencies/api.ts`
- `src/features/currencies/components/ExchangeRateForm.tsx`
- `src/pages/currencies/ExchangeRatesPage.tsx`
- `src/features/journal/components/JournalEntryForm.tsx` (lógica de moneda)
- `src/components/layout/AppLayout.tsx` (link "Tasas de cambio")

## Verification

Setup: libro con base = VES. Crear tasa USD→VES = 50 al 1 enero.

1. Crear asiento "Compra equipo USD 100" en USD: Mobiliario 100 / Caja 100. Tasa autocompletada en 50.
2. **Mayor de Caja**: muestra movimiento como `100 USD (5000 VES)`.
3. **Balance de Comprobación**: Caja muestra saldo en VES (multiplicado).
4. Crear segundo asiento "Pago consultor USD 50": Gastos 50 / Caja 50.
5. **Estado de Resultados** en VES: Gastos = 2500.
6. Editar tasa para 2 enero a USD→VES = 60. Crear asiento de USD 100 ese día → debería usar 60.
7. Reportes muestran totales en VES sumando ambas tasas.

## Definition of Done

- [ ] Tasas se gestionan correctamente.
- [ ] Asientos en moneda extranjera convierten en reportes.
- [ ] El `exchange_rate` es por asiento (congelado), no global.
- [ ] UI muestra moneda original opcionalmente.
- [ ] Commit: `feat(phase-08): multimoneda con tasa por asiento`.

## Notas

- Para MVP: tasas manuales. Post-MVP: integración con API gratis (exchangerate.host, BCV, etc.) para autocompletar.
- Si el usuario quiere reportes en moneda distinta a la base, eso es una feature post-MVP (requiere doble conversión).
- Cuidado con redondeo: usa siempre `NUMERIC` en SQL y `dinero.js` en frontend.
