# Arquitectura

## Multi-tenancy

La unidad de aislamiento es el **libro contable** (`books`). Un usuario puede pertenecer a múltiples libros con diferentes roles. Toda tabla de dominio incluye `book_id` y aplica RLS en función del usuario autenticado.

```
auth.users (Supabase)
    └── profiles (1:1)
         └── book_members (N:N) ──→ books
                                      ├── accounts
                                      ├── journal_entries
                                      │    └── journal_lines
                                      ├── periods
                                      ├── templates → recurring_schedules
                                      ├── loans
                                      │    ├── loan_schedule
                                      │    └── loan_payments
                                      └── exchange_rates
```

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Todo: editar libro, invitar/quitar miembros, cerrar periodos, eliminar |
| `editor` | Crear/editar asientos, cuentas, préstamos. No invita miembros ni cierra periodos |
| `viewer` | Solo lectura de asientos y reportes |

## Schema completo

```sql
-- ============================================================
-- TIPOS
-- ============================================================
CREATE TYPE account_type AS ENUM ('asset','liability','equity','income','expense');
CREATE TYPE member_role AS ENUM ('admin','editor','viewer');
CREATE TYPE period_status AS ENUM ('open','closed');
CREATE TYPE loan_type AS ENUM ('received','given');
CREATE TYPE loan_method AS ENUM ('french','german','american');
CREATE TYPE loan_frequency AS ENUM ('monthly','biweekly','weekly');
CREATE TYPE schedule_status AS ENUM ('pending','paid','cancelled');
CREATE TYPE payment_type AS ENUM ('regular','extra');
CREATE TYPE payment_strategy AS ENUM ('reduce_term','reduce_installment');
CREATE TYPE recurring_frequency AS ENUM ('weekly','monthly','quarterly','yearly');

-- ============================================================
-- USUARIOS Y LIBROS
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  owner_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE book_members (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, user_id)
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MONEDAS
-- ============================================================
CREATE TABLE currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL
);

CREATE TABLE exchange_rates (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  from_currency TEXT NOT NULL REFERENCES currencies(code),
  to_currency TEXT NOT NULL REFERENCES currencies(code),
  rate NUMERIC(18,8) NOT NULL,
  rate_date DATE NOT NULL,
  PRIMARY KEY (book_id, from_currency, to_currency, rate_date)
);

-- ============================================================
-- PLAN DE CUENTAS
-- ============================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type account_type NOT NULL,
  parent_id UUID REFERENCES accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, code)
);

-- ============================================================
-- PERIODOS
-- ============================================================
CREATE TABLE periods (
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  status period_status NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  PRIMARY KEY (book_id, year, month)
);

-- ============================================================
-- DIARIO
-- ============================================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  currency_code TEXT NOT NULL REFERENCES currencies(code),
  exchange_rate NUMERIC(18,8) NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  debit NUMERIC(18,4) NOT NULL DEFAULT 0,
  credit NUMERIC(18,4) NOT NULL DEFAULT 0,
  memo TEXT,
  position INT NOT NULL,
  CHECK (debit >= 0 AND credit >= 0),
  CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0))
);

-- ============================================================
-- ASIENTOS RECURRENTES
-- ============================================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  currency_code TEXT NOT NULL REFERENCES currencies(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE template_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id),
  debit NUMERIC(18,4) NOT NULL DEFAULT 0,
  credit NUMERIC(18,4) NOT NULL DEFAULT 0,
  memo TEXT,
  position INT NOT NULL
);

CREATE TABLE recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  frequency recurring_frequency NOT NULL,
  next_run_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRÉSTAMOS
-- ============================================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  type loan_type NOT NULL,
  counterparty TEXT NOT NULL,
  principal NUMERIC(18,4) NOT NULL,
  annual_rate NUMERIC(8,4) NOT NULL,
  term_months INT NOT NULL,
  start_date DATE NOT NULL,
  frequency loan_frequency NOT NULL DEFAULT 'monthly',
  method loan_method NOT NULL DEFAULT 'french',
  asset_account_id UUID REFERENCES accounts(id),
  liability_account_id UUID REFERENCES accounts(id),
  interest_account_id UUID NOT NULL REFERENCES accounts(id),
  cash_account_id UUID NOT NULL REFERENCES accounts(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE loan_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  principal_portion NUMERIC(18,4) NOT NULL,
  interest_portion NUMERIC(18,4) NOT NULL,
  balance_after NUMERIC(18,4) NOT NULL,
  status schedule_status NOT NULL DEFAULT 'pending',
  journal_entry_id UUID REFERENCES journal_entries(id),
  version INT NOT NULL DEFAULT 1
);

CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(18,4) NOT NULL,
  type payment_type NOT NULL,
  strategy payment_strategy,
  applied_to_installment_id UUID REFERENCES loan_schedule(id),
  journal_entry_id UUID REFERENCES journal_entries(id),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## RLS — patrón estándar

Todas las tablas con `book_id` tienen RLS habilitado y políticas como esta:

```sql
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier miembro del libro puede leer
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (book_id IN (SELECT book_id FROM book_members WHERE user_id = auth.uid()));

-- INSERT/UPDATE/DELETE: solo admin o editor
CREATE POLICY accounts_write ON accounts FOR ALL
  USING (book_id IN (
    SELECT book_id FROM book_members
    WHERE user_id = auth.uid() AND role IN ('admin','editor')
  ))
  WITH CHECK (book_id IN (
    SELECT book_id FROM book_members
    WHERE user_id = auth.uid() AND role IN ('admin','editor')
  ));
```

`books` y `book_members` tienen políticas especiales (ver fase 02).

## Triggers críticos

### Validación de partida doble

```sql
CREATE OR REPLACE FUNCTION validate_balanced_entry() RETURNS TRIGGER AS $$
DECLARE
  total_debit NUMERIC(18,4);
  total_credit NUMERIC(18,4);
  v_entry_id UUID;
BEGIN
  v_entry_id := COALESCE(NEW.entry_id, OLD.entry_id);
  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO total_debit, total_credit
    FROM journal_lines WHERE entry_id = v_entry_id;
  IF total_debit <> total_credit THEN
    RAISE EXCEPTION 'Asiento desbalanceado: débito % != crédito %', total_debit, total_credit;
  END IF;
  IF total_debit = 0 THEN
    RAISE EXCEPTION 'Asiento debe tener al menos una línea con monto';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER journal_lines_balance_check
  AFTER INSERT OR UPDATE OR DELETE ON journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION validate_balanced_entry();
```

El trigger es **DEFERRABLE INITIALLY DEFERRED** para permitir insertar todas las líneas en una transacción y validar al final.

### Bloqueo de periodos cerrados

```sql
CREATE OR REPLACE FUNCTION check_period_open() RETURNS TRIGGER AS $$
DECLARE
  status period_status;
BEGIN
  SELECT p.status INTO status
    FROM periods p
    WHERE p.book_id = NEW.book_id
      AND p.year = EXTRACT(YEAR FROM NEW.entry_date)::INT
      AND p.month = EXTRACT(MONTH FROM NEW.entry_date)::INT;
  IF status = 'closed' THEN
    RAISE EXCEPTION 'No se puede modificar asientos en un periodo cerrado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_period_check
  BEFORE INSERT OR UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION check_period_open();
```

## Vistas / RPC para reportes

Los reportes son **vistas SQL** o funciones `RPC`. El frontend hace `select * from view_xxx` o `rpc('fn_xxx', { ... })`.

### Mayor por cuenta

```sql
CREATE VIEW v_ledger AS
SELECT
  jl.id AS line_id,
  je.book_id,
  jl.account_id,
  je.entry_date,
  je.description,
  je.reference,
  jl.debit,
  jl.credit,
  jl.memo
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.entry_id;
```

### Balance de comprobación

```sql
CREATE VIEW v_trial_balance AS
SELECT
  a.book_id,
  a.id AS account_id,
  a.code,
  a.name,
  a.type,
  COALESCE(SUM(jl.debit), 0) AS total_debit,
  COALESCE(SUM(jl.credit), 0) AS total_credit,
  COALESCE(SUM(jl.debit) - SUM(jl.credit), 0) AS balance
FROM accounts a
LEFT JOIN journal_lines jl ON jl.account_id = a.id
LEFT JOIN journal_entries je ON je.id = jl.entry_id
GROUP BY a.book_id, a.id, a.code, a.name, a.type;
```

P&L y Balance General similares; ver fase 07.

## Manejo de dinero

### Postgres
- Todos los montos: `NUMERIC(18,4)`. Hasta 4 decimales para soportar conversiones de divisas exóticas.
- Las tasas de cambio: `NUMERIC(18,8)`.

### TypeScript
- Usa `dinero.js` v2. Crea helpers en `src/lib/money.ts`:
  ```ts
  import { dinero, add, subtract, multiply, toDecimal, type Dinero } from 'dinero.js';
  import { USD, VES, EUR } from '@dinero.js/currencies';
  ```
- **Nunca** uses `Number(x) + Number(y)` para montos.
- Para mostrar en UI: convierte solo en el render, no en la lógica.

### Conversión de monedas
- Cada `journal_entry` lleva `currency_code` y `exchange_rate` (al momento del asiento, congelado).
- Los reportes consultan `exchange_rate` del propio asiento. No se reescriben asientos históricos.

## Cálculo de amortización francesa

Cuota fija = `P × i / (1 - (1 + i)^-n)`, donde:
- `P` = principal
- `i` = tasa periódica = `annual_rate / 12 / 100`
- `n` = número de cuotas

En cada cuota:
- `interest = balance × i`
- `principal_portion = installment - interest`
- `balance = balance - principal_portion`

Implementar como función SQL `calculate_french_schedule(principal, annual_rate, term_months, start_date, frequency)` que devuelve un set de filas. Ver fase 09.

## Convenciones de nombres

| Capa | Convención |
|------|------------|
| Tablas SQL | snake_case plural (`journal_entries`) |
| Columnas SQL | snake_case (`entry_date`) |
| Vistas SQL | prefijo `v_` (`v_trial_balance`) |
| Funciones SQL | snake_case verbo_objeto (`apply_extra_payment`) |
| Tipos enum SQL | snake_case singular (`account_type`) |
| Componentes React | PascalCase (`JournalEntryForm`) |
| Hooks | camelCase prefijo `use` (`useJournalEntry`) |
| Tipos TS | PascalCase (`JournalEntry`) |
| Variables/funciones TS | camelCase |
