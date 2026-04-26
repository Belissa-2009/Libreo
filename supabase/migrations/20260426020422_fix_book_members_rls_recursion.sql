-- ============================================================
-- FIX: Recursión infinita en política RLS de book_members
--
-- La política original hacía una subconsulta directa a
-- book_members dentro de la cláusula USING, lo que causaba
-- que Postgres intentara evaluar la misma política de nuevo
-- → error 42P17 "infinite recursion detected in policy".
--
-- Solución: función SECURITY DEFINER que devuelve los book_ids
-- del usuario actual; al correr con privilegios elevados,
-- no está sujeta a las políticas RLS de book_members.
-- ============================================================

-- 1. Función auxiliar SECURITY DEFINER (rompe la recursión)
CREATE OR REPLACE FUNCTION get_my_book_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT book_id FROM book_members WHERE user_id = auth.uid()
$$;

-- 2. Reemplazar la política recursiva
DROP POLICY IF EXISTS members_select ON book_members;

CREATE POLICY members_select ON book_members FOR SELECT
  USING (book_id IN (SELECT get_my_book_ids()));
