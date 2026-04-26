-- Dejar únicamente Peso dominicano (DOP) y Dólar estadounidense (USD)
DELETE FROM currencies WHERE code NOT IN ('DOP', 'USD');
