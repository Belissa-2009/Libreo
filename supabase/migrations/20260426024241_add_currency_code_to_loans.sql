ALTER TABLE loans
  ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'DOP'
    REFERENCES currencies(code);
