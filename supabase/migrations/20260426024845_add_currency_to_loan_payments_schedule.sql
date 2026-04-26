-- Add nullable currency_code to loan_payments and loan_schedule
ALTER TABLE loan_payments
  ADD COLUMN currency_code TEXT REFERENCES currencies(code);

ALTER TABLE loan_schedule
  ADD COLUMN currency_code TEXT REFERENCES currencies(code);
