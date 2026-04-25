# Fase 12 — Cierre de periodos

## Goal
Permitir a un admin cerrar un mes contable. Los asientos en periodos cerrados no pueden crearse, editarse ni eliminarse. Reabrir un periodo requiere admin y deja registro de la acción.

## Prerequisites
- Fase 06 completada. El trigger `check_period_open` ya existe (de fase 02).

## Steps

### 1. UI de gestión de periodos

`src/pages/periods/PeriodsPage.tsx` (solo admin):
- Tabla con un periodo por fila: año, mes, estado (abierto/cerrado), fecha de cierre, quién cerró.
- Filtro por año.
- Acciones por fila:
  - Si abierto: botón "Cerrar mes" (con confirmación; opcionalmente requiere segunda confirmación con texto).
  - Si cerrado: botón "Reabrir" (con confirmación + razón opcional).

### 2. API y RPCs

Genera con `supabase migration new periods_functions` y agrega:

```sql
CREATE OR REPLACE FUNCTION close_period(p_book_id UUID, p_year INT, p_month INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_book_member(p_book_id, ARRAY['admin']::member_role[]) THEN
    RAISE EXCEPTION 'Solo admin puede cerrar periodos';
  END IF;

  INSERT INTO periods (book_id, year, month, status, closed_at, closed_by)
  VALUES (p_book_id, p_year, p_month, 'closed', now(), auth.uid())
  ON CONFLICT (book_id, year, month) DO UPDATE
    SET status = 'closed', closed_at = now(), closed_by = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION reopen_period(p_book_id UUID, p_year INT, p_month INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_book_member(p_book_id, ARRAY['admin']::member_role[]) THEN
    RAISE EXCEPTION 'Solo admin puede reabrir periodos';
  END IF;

  UPDATE periods SET status = 'open', closed_at = NULL, closed_by = NULL
  WHERE book_id = p_book_id AND year = p_year AND month = p_month;
END;
$$;
```

`src/features/periods/api.ts`:
- `listPeriods(bookId, year)` — con join a `profiles` para mostrar quien cerró.
- `closePeriod(bookId, year, month)`.
- `reopenPeriod(bookId, year, month)`.

### 3. Validación en UI antes del cierre

Antes de cerrar, el modal debe mostrar:
- Cantidad de asientos del mes.
- Total débito / crédito (debe cuadrar).
- Warning si hay diferencia.
- Texto: "Una vez cerrado, no podrás crear ni editar asientos de este mes sin reabrirlo."

### 4. Indicadores visuales en otras pantallas

- En `JournalPage`, asientos de periodo cerrado tienen badge "Cerrado" y los botones editar/borrar están deshabilitados con tooltip.
- En `NewEntryPage`, si la fecha cae en un periodo cerrado, mostrar warning antes del submit.
- En `LoansPage` / `TemplatesPage`, ejecutar pago/template en periodo cerrado falla con mensaje claro (gracias al trigger).

### 5. Auditoría mínima

`closed_at` y `closed_by` en `periods` son la auditoría mínima. Para historial completo de aperturas/cierres, agregar una tabla `period_log` (post-MVP).

## Files created/modified

- `supabase/migrations/<timestamp>_periods_functions.sql`
- `src/features/periods/api.ts`
- `src/pages/periods/PeriodsPage.tsx`
- `src/features/journal/components/JournalEntryForm.tsx` (warning de periodo cerrado)
- `src/components/layout/AppLayout.tsx` (link "Periodos", solo admin)
- `src/routes/index.tsx`

## Verification

1. Crear varios asientos en marzo 2026.
2. Cerrar marzo 2026 → fila aparece como "Cerrado", con timestamp y nombre del admin.
3. Intentar editar un asiento de marzo → backend rechaza con mensaje del trigger.
4. Intentar crear asiento nuevo con fecha 15 marzo → idem.
5. Reabrir marzo → ahora se puede editar.
6. Como `editor`, no puede ver la página de periodos.
7. Como `editor`, en JournalPage, ve los asientos cerrados pero sin botones de edición.

## Definition of Done

- [ ] Los 7 escenarios pasan.
- [ ] Solo admin puede cerrar/reabrir.
- [ ] La UI deshabilita acciones antes de que el backend rechace.
- [ ] Commit: `feat(phase-12): cierre y reapertura de periodos`.

## Notas

- Esta fase es **post-MVP** (puede saltarse para publicar antes).
- Considera agregar "cierre anual" que computa utilidad y la pasa a "Resultados acumulados" con un asiento automático. Eso es post-MVP.
- Si el usuario olvida cerrar, no hay problema funcional; el cierre es solo para evitar modificaciones accidentales.
