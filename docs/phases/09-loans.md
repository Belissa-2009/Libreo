# Fase 09 — Préstamos y abonos

## Goal
Gestionar préstamos (recibidos y otorgados) con tabla de amortización francesa. Permitir pagar cuotas regulares (genera asiento contable automático) y registrar abonos extraordinarios con dos estrategias: **reducir plazo** o **reducir cuota** (recálculo automático).

## Prerequisites
- Fase 08 completada (los préstamos pueden tener moneda distinta a la base).

## Steps

### 1. Función de cálculo de amortización

Genera con `supabase migration new loan_functions` y agrega:

```sql
-- Calcula la cuota fija con método francés
CREATE OR REPLACE FUNCTION french_installment(
  p_principal NUMERIC, p_annual_rate NUMERIC, p_term_months INT
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  i NUMERIC := p_annual_rate / 12 / 100;
BEGIN
  IF i = 0 THEN RETURN ROUND(p_principal / p_term_months, 4); END IF;
  RETURN ROUND(p_principal * i / (1 - POWER(1 + i, -p_term_months)), 4);
END;
$$;

-- Genera la tabla de amortización completa para un préstamo
CREATE OR REPLACE FUNCTION generate_loan_schedule(p_loan_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
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
    -- ajuste de la última cuota para que el saldo cierre en 0
    IF v_n = v_loan.term_months THEN
      v_principal := v_balance;
    END IF;
    v_balance := v_balance - v_principal;

    INSERT INTO loan_schedule (loan_id, installment_number, due_date, principal_portion, interest_portion, balance_after, version)
    VALUES (p_loan_id, v_n, v_due, v_principal, v_interest, v_balance, 1);
  END LOOP;
END;
$$;
```

> Para `frequency` distinta de `monthly`, ajustar el intervalo y dividir tasa anual por 26 (biweekly) o 52 (weekly). MVP: solo monthly.

### 2. Pagar cuota regular

```sql
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

  -- Préstamo recibido (debemos): debit pasivo (capital) + debit gasto (interés), credit caja
  -- Préstamo otorgado (nos deben): debit caja, credit cuenta por cobrar (capital) + credit ingreso (interés)
  IF v_loan.type = 'received' THEN
    v_entry_id := create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Cuota ' || v_inst.installment_number || ' préstamo ' || v_loan.counterparty,
      NULL, 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.liability_account_id, 'debit', v_inst.principal_portion, 'credit', 0),
        jsonb_build_object('account_id', v_loan.interest_account_id, 'debit', v_inst.interest_portion, 'credit', 0),
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', 0, 'credit', v_total)
      )
    );
  ELSE
    v_entry_id := create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Cobro cuota ' || v_inst.installment_number || ' préstamo ' || v_loan.counterparty,
      NULL, 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', v_total, 'credit', 0),
        jsonb_build_object('account_id', v_loan.asset_account_id, 'debit', 0, 'credit', v_inst.principal_portion),
        jsonb_build_object('account_id', v_loan.interest_account_id, 'debit', 0, 'credit', v_inst.interest_portion)
      )
    );
  END IF;

  UPDATE loan_schedule SET status = 'paid', journal_entry_id = v_entry_id WHERE id = p_installment_id;
  INSERT INTO loan_payments (loan_id, payment_date, amount, type, applied_to_installment_id, journal_entry_id, created_by)
  VALUES (v_loan.id, p_payment_date, v_total, 'regular', p_installment_id, v_entry_id, auth.uid());

  RETURN v_entry_id;
END;
$$;
```

> Nota: la moneda y tasa del asiento generado deberían tomarse del préstamo si se quiere multimoneda en préstamos. Para MVP usamos la moneda base. Mejorar después.

### 3. Aplicar abono extraordinario (recálculo)

```sql
CREATE OR REPLACE FUNCTION apply_extra_payment(
  p_loan_id UUID, p_payment_date DATE, p_amount NUMERIC, p_strategy payment_strategy
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_loan loans%ROWTYPE;
  v_current_version INT;
  v_remaining_balance NUMERIC;
  v_remaining_term INT;
  v_new_installment NUMERIC;
  v_balance NUMERIC; v_i NUMERIC; v_principal NUMERIC; v_interest NUMERIC; v_due DATE; v_n INT;
  v_entry_id UUID;
  v_first_pending loan_schedule%ROWTYPE;
BEGIN
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  SELECT MAX(version) INTO v_current_version FROM loan_schedule WHERE loan_id = p_loan_id;

  -- saldo actual: balance_after de la última cuota pagada en la versión actual,
  -- o principal si no hay pagadas
  SELECT COALESCE(MIN(balance_after), v_loan.principal) INTO v_remaining_balance
  FROM loan_schedule
  WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'paid';

  IF v_remaining_balance IS NULL OR v_remaining_balance = v_loan.principal THEN
    v_remaining_balance := v_loan.principal;
  END IF;

  -- Aplicar abono al saldo
  v_remaining_balance := v_remaining_balance - p_amount;
  IF v_remaining_balance <= 0 THEN
    -- abono cancela el préstamo: marcar todas las pendientes como cancelled
    UPDATE loan_schedule SET status = 'cancelled'
      WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';
  ELSE
    -- Cancelar pendientes de la versión actual
    UPDATE loan_schedule SET status = 'cancelled'
      WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'pending';

    -- cuotas restantes según estrategia
    v_remaining_term := (
      SELECT COUNT(*) FROM loan_schedule
      WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'cancelled'
    );

    v_i := v_loan.annual_rate / 12 / 100;

    IF p_strategy = 'reduce_installment' THEN
      v_new_installment := french_installment(v_remaining_balance, v_loan.annual_rate, v_remaining_term);
    ELSE -- reduce_term: mantener cuota original
      v_new_installment := french_installment(v_loan.principal, v_loan.annual_rate, v_loan.term_months);
    END IF;

    -- Generar nuevas cuotas (versión + 1)
    SELECT * INTO v_first_pending FROM loan_schedule
      WHERE loan_id = p_loan_id AND version = v_current_version AND status = 'cancelled'
      ORDER BY installment_number LIMIT 1;

    v_balance := v_remaining_balance;
    v_n := 0;
    v_due := v_first_pending.due_date;

    WHILE v_balance > 0.01 LOOP
      v_n := v_n + 1;
      v_interest := ROUND(v_balance * v_i, 4);
      v_principal := ROUND(LEAST(v_new_installment - v_interest, v_balance), 4);
      IF v_principal <= 0 THEN
        RAISE EXCEPTION 'Cuota insuficiente para cubrir intereses; ajustar estrategia';
      END IF;
      v_balance := v_balance - v_principal;
      INSERT INTO loan_schedule (loan_id, installment_number, due_date, principal_portion, interest_portion, balance_after, version)
      VALUES (p_loan_id, v_first_pending.installment_number + v_n - 1, v_due, v_principal, v_interest, v_balance, v_current_version + 1);
      v_due := v_due + INTERVAL '1 month';
    END LOOP;
  END IF;

  -- Asiento contable del abono (solo capital, sin intereses)
  IF v_loan.type = 'received' THEN
    v_entry_id := create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Abono extraordinario préstamo ' || v_loan.counterparty,
      NULL, 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.liability_account_id, 'debit', p_amount, 'credit', 0),
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', 0, 'credit', p_amount)
      )
    );
  ELSE
    v_entry_id := create_journal_entry(
      v_loan.book_id, p_payment_date,
      'Abono recibido préstamo ' || v_loan.counterparty,
      NULL, 'USD', 1,
      jsonb_build_array(
        jsonb_build_object('account_id', v_loan.cash_account_id, 'debit', p_amount, 'credit', 0),
        jsonb_build_object('account_id', v_loan.asset_account_id, 'debit', 0, 'credit', p_amount)
      )
    );
  END IF;

  INSERT INTO loan_payments (loan_id, payment_date, amount, type, strategy, journal_entry_id, created_by)
  VALUES (p_loan_id, p_payment_date, p_amount, 'extra', p_strategy, v_entry_id, auth.uid());

  RETURN v_entry_id;
END;
$$;
```

### 4. Función de previsualización (sin persistir)

`preview_extra_payment(p_loan_id, p_amount, p_strategy)` → devuelve cuántas cuotas se ahorrarán o cuánto bajaría la cuota. Útil para mostrar antes de confirmar el abono. Implementación: misma lógica que `apply_extra_payment` pero solo `RETURN` los números, sin INSERTs.

### 5. API frontend

`src/features/loans/api.ts`:
- `listLoans(bookId)`
- `getLoan(id)` → préstamo + schedule (versión activa) + payments.
- `createLoan(input)` → inserta loan, llama `generate_loan_schedule(id)`, opcionalmente genera asiento de "alta del préstamo" (recibido: debit cash, credit liability; otorgado: debit asset, credit cash).
- `payInstallment(installmentId, paymentDate)` → RPC.
- `previewExtraPayment(loanId, amount, strategy)` → RPC.
- `applyExtraPayment(loanId, paymentDate, amount, strategy)` → RPC.

### 6. UI

#### Lista `src/pages/loans/LoansPage.tsx`
- Cards por préstamo: tipo (recibido/otorgado), contraparte, principal, saldo actual, próxima cuota, % completado.
- Botón "Nuevo préstamo".

#### Form `src/pages/loans/NewLoanPage.tsx`
- `type` (radio: Recibido / Otorgado).
- `counterparty` (text).
- `principal`, `annual_rate`, `term_months`, `start_date`.
- Selectores de cuentas:
  - Recibido: `liability_account` (Préstamos por pagar), `interest_account` (Gastos por intereses), `cash_account` (Caja/Banco).
  - Otorgado: `asset_account` (Cuentas por cobrar), `interest_account` (Otros ingresos / Ingresos por intereses), `cash_account`.
- Notas (textarea).
- Botón "Crear" → genera el préstamo y la tabla; muestra preview antes de confirmar.

#### Detalle `src/pages/loans/LoanDetailPage.tsx`
- Resumen: principal, tasa, plazo, saldo actual, cuotas pagadas / totales, próxima cuota.
- Tabs:
  - **Tabla de amortización** (versión activa, con `cancelled` ocultas o en pestaña "Historial").
    - Columnas: # · Vencimiento · Capital · Interés · Cuota · Saldo · Estado · Acción.
    - Botón "Marcar pagada" en la próxima cuota.
  - **Pagos** — listado cronológico (regulares + extraordinarios), con link al asiento.
  - **Historial de versiones** — cada versión del schedule (cuando hubo abonos). Muestra qué cambió.
- Botón flotante "Registrar abono extraordinario".

#### Modal abono `src/features/loans/components/ExtraPaymentDialog.tsx`
- Monto + fecha.
- Radio: **Reducir plazo** | **Reducir cuota** (con descripción corta de cada uno).
- **Previsualización** (llama `preview_extra_payment` al cambiar inputs):
  - Reducir plazo: "Te ahorrarás N cuotas. Nuevo final: DD/MM/AAAA."
  - Reducir cuota: "Tu nueva cuota será $X.XX (antes $Y.YY)."
- Botones: Cancelar / Confirmar abono.

## Files created/modified

- `supabase/migrations/<timestamp>_loan_functions.sql`
- `src/features/loans/api.ts`
- `src/features/loans/schemas.ts`
- `src/features/loans/hooks/{useLoans,useLoan}.ts`
- `src/features/loans/components/{LoanCard,ScheduleTable,PaymentList,ExtraPaymentDialog,VersionHistory}.tsx`
- `src/pages/loans/{Loans,NewLoan,LoanDetail}Page.tsx`
- `src/routes/index.tsx`

## Verification

1. **Crear préstamo recibido**: 5000 USD, 12% anual, 12 meses → tabla de 12 cuotas, cuota fija ~444.24.
2. Asiento alta: Caja 5000 / Préstamos por pagar 5000.
3. **Pagar cuota 1**: asiento generado: Préstamos por pagar 394.24 + Gastos intereses 50 / Caja 444.24.
4. Saldo del préstamo después de cuota 1: 4605.76.
5. **Abono — reducir plazo**: abonar 500 → previsualización dice "ahorras ~2 cuotas". Confirmar. Versión 2 del schedule: cuotas restantes < 11, cuota mensual sigue siendo ~444.24.
6. **Abono — reducir cuota**: abonar otros 300 → previsualización dice "nueva cuota será $X". Confirmar. Versión 3: mismas cuotas restantes que antes, pero cuota menor.
7. Asiento del abono: Préstamos por pagar 300 / Caja 300 (sin intereses).
8. **Préstamo otorgado**: análogo, espejo en débito/crédito.
9. **Histórico**: las versiones anteriores quedan visibles con sus cuotas `cancelled`.
10. Mobile: el detalle es navegable; el modal de abono es usable.

## Definition of Done

- [ ] Los 10 escenarios pasan.
- [ ] La cuota se calcula correctamente con método francés.
- [ ] El versionado del schedule funciona (no se pierde historial).
- [ ] La previsualización es instantánea (debounced).
- [ ] Commit: `feat(phase-09): préstamos con amortización francesa y abonos extraordinarios`.

## Notas

- Multimoneda en préstamos: por simplicidad MVP usa moneda base. Si urge, agrega `currency_code` y `exchange_rate` a `loans` y propaga al `create_journal_entry`.
- Frecuencias no-mensuales: post-MVP.
- Si la cuenta de intereses se omite (préstamo a tasa 0%), `v_interest = 0` y todo funciona igual.
