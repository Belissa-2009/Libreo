-- Agregar Peso dominicano (DOP) y corregir símbolo de USD
INSERT INTO currencies (code, name, symbol)
VALUES ('DOP', 'Peso dominicano', 'RD$')
ON CONFLICT (code) DO NOTHING;

UPDATE currencies SET symbol = 'US$' WHERE code = 'USD';
