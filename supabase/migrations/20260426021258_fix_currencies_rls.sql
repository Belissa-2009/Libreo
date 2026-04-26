-- currencies es un catálogo público de solo lectura.
-- No requiere RLS; cualquier usuario autenticado debe poder leerlo.
ALTER TABLE currencies DISABLE ROW LEVEL SECURITY;
