# Fase 06 — Asientos de diario

## Goal
Crear, listar, editar y eliminar asientos del libro diario con partida doble validada en frontend y backend. Esta es la pantalla más usada de la app y debe funcionar excepcionalmente bien en móvil.

## Prerequisites
- Fases 01–05 completadas.

## Steps

### 1. API

`src/features/journal/api.ts`:

- `listEntries(bookId, filters)` → trae asientos con sus líneas. Filtros: rango de fechas, cuenta, texto en descripción/referencia, paginación.
- `getEntry(id)` → asiento + líneas.
- `createEntry(input)` → inserta `journal_entries` y `journal_lines` en una **transacción RPC** (función SQL). Sin transacción, una falla a mitad deja datos huérfanos.
- `updateEntry(id, input)` → reemplaza líneas (delete + insert) en transacción.
- `deleteEntry(id)`.

Genera la migration `supabase migration new journal_functions` y agrega la función SQL `create_journal_entry(p_book_id, p_entry_date, p_description, p_reference, p_currency_code, p_exchange_rate, p_lines JSONB)`:

```sql
CREATE OR REPLACE FUNCTION create_journal_entry(
  p_book_id UUID, p_entry_date DATE, p_description TEXT, p_reference TEXT,
  p_currency_code TEXT, p_exchange_rate NUMERIC, p_lines JSONB
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry_id UUID;
  v_line JSONB;
  v_pos INT := 0;
BEGIN
  IF NOT is_book_member(p_book_id, ARRAY['admin','editor']::member_role[]) THEN
    RAISE EXCEPTION 'Sin permisos para crear asientos en este libro';
  END IF;

  INSERT INTO journal_entries (book_id, entry_date, description, reference, currency_code, exchange_rate, created_by)
  VALUES (p_book_id, p_entry_date, p_description, p_reference, p_currency_code, p_exchange_rate, auth.uid())
  RETURNING id INTO v_entry_id;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_pos := v_pos + 1;
    INSERT INTO journal_lines (entry_id, account_id, debit, credit, memo, position)
    VALUES (
      v_entry_id,
      (v_line->>'account_id')::UUID,
      COALESCE((v_line->>'debit')::NUMERIC, 0),
      COALESCE((v_line->>'credit')::NUMERIC, 0),
      v_line->>'memo',
      v_pos
    );
  END LOOP;

  RETURN v_entry_id; -- el trigger DEFERRED valida el balance al COMMIT
END;
$$;
```

Equivalente `update_journal_entry` que elimina líneas y reinserta.

### 2. Schema de validación

`src/features/journal/schemas.ts`:

```ts
import { z } from 'zod';

export const lineSchema = z.object({
  account_id: z.string().uuid('Cuenta requerida'),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  memo: z.string().optional(),
}).refine(l => (l.debit > 0) !== (l.credit > 0), {
  message: 'Una línea debe tener débito O crédito, no ambos',
});

export const entrySchema = z.object({
  entry_date: z.string(),
  description: z.string().min(1, 'Descripción requerida'),
  reference: z.string().optional(),
  currency_code: z.string().default('USD'),
  exchange_rate: z.number().positive().default(1),
  lines: z.array(lineSchema).min(2, 'Mínimo 2 líneas'),
}).refine(e => {
  const totalDebit = e.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = e.lines.reduce((s, l) => s + (l.credit || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.0001;
}, { message: 'Total débito debe igualar total crédito', path: ['lines'] });

export type EntryInput = z.infer<typeof entrySchema>;
```

> Nota: aquí usamos `number` para validación; al enviar al backend convierte con `dinero.js` para garantizar precisión.

### 3. Form de asiento

`src/features/journal/components/JournalEntryForm.tsx`:

Layout responsive:
- **Desktop**: tabla con columnas Cuenta, Memo, Débito, Crédito, Acción.
- **Mobile**: cada línea es una "card" apilada con campos en columna.

Cada línea:
- Combobox de cuenta (autocompletar por código y nombre, solo cuentas activas y sin hijos — las hojas).
- Memo (text opcional).
- Débito y Crédito (numéricos; ingresar uno bloquea el otro).
- Botón "X" para eliminar línea.

Botón "+ Línea" para agregar una nueva (mínimo 2 líneas).

Footer fijo (sobre todo en mobile):
- Totales: `Débito: $X.XX  ·  Crédito: $X.XX  ·  Diferencia: $0.00`.
- Diferencia destacada en rojo si ≠ 0.
- Botón "Guardar" deshabilitado si la diferencia ≠ 0 o el form es inválido.

Header del form:
- Fecha (date picker, default hoy).
- Descripción.
- Referencia (opcional, ej: # de factura).
- Moneda (select; default = `book.base_currency`). Si distinta de base, aparece campo "Tasa de cambio".

### 4. Página de listado

`src/pages/journal/JournalPage.tsx`:

- Header: "Nuevo asiento" (botón).
- Filtros: rango de fechas, cuenta, texto.
- Tabla (desktop) / cards (mobile) listando asientos: fecha, descripción, total, ícono para expandir y ver líneas.
- Acciones por fila: ver detalle, editar, borrar (con confirmación).
- Paginación (50 por página).
- Empty state si no hay asientos.

### 5. Página de creación/edición

`src/pages/journal/NewEntryPage.tsx` y `EditEntryPage.tsx`:
- Wrappers que renderizan `JournalEntryForm` y manejan submit/redirect.

### 6. Manejo de errores

- Si el backend rechaza por desbalanceo (no debería pasar gracias al frontend), mostrar toast con el mensaje exacto del trigger.
- Si rechaza por periodo cerrado, mostrar mensaje claro y deshabilitar el botón.

## Files created/modified

- `supabase/migrations/<timestamp>_journal_functions.sql`
- `src/features/journal/api.ts`
- `src/features/journal/schemas.ts`
- `src/features/journal/hooks/{useEntries,useEntry}.ts`
- `src/features/journal/components/{JournalEntryForm,LineRow,EntryCard,Filters}.tsx`
- `src/pages/journal/{Journal,NewEntry,EditEntry}Page.tsx`
- `src/routes/index.tsx` (rutas `/journal`, `/journal/new`, `/journal/:id/edit`)
- `src/components/layout/AppLayout.tsx` (link "Diario")

## Verification

1. Crear asiento "Aporte inicial" — débito 1000 en Caja, crédito 1000 en Capital → guarda OK, aparece en listado.
2. Intentar guardar con débito ≠ crédito → botón deshabilitado, mensaje en footer.
3. Forzar (DevTools) un POST desbalanceado al endpoint → backend rechaza con mensaje del trigger.
4. Editar el asiento, cambiar monto a 1500 → totales se recalculan, guarda OK.
5. Filtrar por cuenta "Caja" → solo aparecen asientos que la usan.
6. Borrar un asiento → desaparece y queda en log de auditoría (futuro; por ahora simple delete).
7. Como `viewer`, los botones "Nuevo/Editar/Borrar" no aparecen.
8. **Mobile (360px)**: el form es usable sin scroll horizontal; los totales del footer son visibles al hacer scroll.

## Definition of Done

- [ ] Los 8 escenarios pasan.
- [ ] Validación de partida doble funciona en frontend y backend.
- [ ] Manejo de monedas con `dinero.js`, no `Number`.
- [ ] El form recuerda la última cuenta usada (UX nice-to-have, opcional).
- [ ] Commit: `feat(phase-06): asientos de diario con partida doble`.

## Notas

- Solo dejes seleccionar cuentas **hoja** (sin hijos). Las cuentas padre son agregadoras, no transaccionales.
- El `position` mantiene el orden visual de las líneas.
- Para edición, considera bloquear si el asiento está en un periodo cerrado (el trigger lo bloquea, pero el botón debería avisar antes).
