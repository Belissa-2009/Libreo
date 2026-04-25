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

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_journal_entries_book_date ON journal_entries(book_id, entry_date DESC);
CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_accounts_book ON accounts(book_id);
CREATE INDEX idx_loan_schedule_loan ON loan_schedule(loan_id, version);
CREATE INDEX idx_book_members_user ON book_members(user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger de partida doble
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

-- Trigger de periodos cerrados
CREATE OR REPLACE FUNCTION check_period_open() RETURNS TRIGGER AS $$
DECLARE
  v_status period_status;
BEGIN
  SELECT p.status INTO v_status
    FROM periods p
    WHERE p.book_id = NEW.book_id
      AND p.year = EXTRACT(YEAR FROM NEW.entry_date)::INT
      AND p.month = EXTRACT(MONTH FROM NEW.entry_date)::INT;
  IF v_status = 'closed' THEN
    RAISE EXCEPTION 'No se puede modificar asientos en un periodo cerrado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_period_check
  BEFORE INSERT OR UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION check_period_open();

-- Trigger para crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- VISTAS
-- ============================================================

-- Mayor por cuenta
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

-- Balance de comprobación
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

-- ============================================================
-- SEED DE MONEDAS
-- ============================================================
INSERT INTO currencies (code, name, symbol) VALUES
  ('USD', 'Dólar estadounidense', '$'),
  ('EUR', 'Euro', '€'),
  ('VES', 'Bolívar venezolano', 'Bs'),
  ('MXN', 'Peso mexicano', '$'),
  ('COP', 'Peso colombiano', '$'),
  ('ARS', 'Peso argentino', '$')
ON CONFLICT (code) DO NOTHING;
