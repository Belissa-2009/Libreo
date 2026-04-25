# Fase 05 — Plan de cuentas

## Goal
CRUD del plan de cuentas con jerarquía padre/hijo, tipo (asset/liability/equity/income/expense), código y nombre. Seed inicial automático al crear un libro nuevo.

## Prerequisites
- Fase 04 completada.

## Steps

### 1. Función SQL para sembrar cuentas

Genera con `supabase migration new seed_accounts_function` y pega:

```sql
CREATE OR REPLACE FUNCTION seed_default_accounts(p_book_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_activo UUID; v_pasivo UUID; v_patrimonio UUID; v_ingresos UUID; v_gastos UUID;
  v_corriente UUID; v_no_corriente UUID;
BEGIN
  -- Activo
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '1', 'Activo', 'asset') RETURNING id INTO v_activo;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES (p_book_id, '1.1', 'Activo Corriente', 'asset', v_activo) RETURNING id INTO v_corriente;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '1.1.1', 'Caja', 'asset', v_corriente),
    (p_book_id, '1.1.2', 'Banco', 'asset', v_corriente),
    (p_book_id, '1.1.3', 'Cuentas por cobrar', 'asset', v_corriente);
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES (p_book_id, '1.2', 'Activo No Corriente', 'asset', v_activo) RETURNING id INTO v_no_corriente;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '1.2.1', 'Mobiliario y equipo', 'asset', v_no_corriente);

  -- Pasivo
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '2', 'Pasivo', 'liability') RETURNING id INTO v_pasivo;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '2.1', 'Cuentas por pagar', 'liability', v_pasivo),
    (p_book_id, '2.2', 'Préstamos por pagar', 'liability', v_pasivo);

  -- Patrimonio
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '3', 'Patrimonio', 'equity') RETURNING id INTO v_patrimonio;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '3.1', 'Capital', 'equity', v_patrimonio),
    (p_book_id, '3.2', 'Resultados acumulados', 'equity', v_patrimonio);

  -- Ingresos
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '4', 'Ingresos', 'income') RETURNING id INTO v_ingresos;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '4.1', 'Ingresos por servicios', 'income', v_ingresos),
    (p_book_id, '4.2', 'Otros ingresos', 'income', v_ingresos);

  -- Gastos
  INSERT INTO accounts (book_id, code, name, type) VALUES (p_book_id, '5', 'Gastos', 'expense') RETURNING id INTO v_gastos;
  INSERT INTO accounts (book_id, code, name, type, parent_id) VALUES
    (p_book_id, '5.1', 'Gastos operativos', 'expense', v_gastos),
    (p_book_id, '5.2', 'Gastos por intereses', 'expense', v_gastos),
    (p_book_id, '5.3', 'Sueldos y salarios', 'expense', v_gastos),
    (p_book_id, '5.4', 'Servicios públicos', 'expense', v_gastos);
END;
$$;
```

Modifica `create_book` (de la fase 04) para que llame `seed_default_accounts(v_book_id)` antes del `RETURN`.

### 2. API y queries

`src/features/accounts/api.ts`:
- `listAccounts(bookId)` → todas las cuentas del libro, ordenadas por `code`.
- `createAccount({ book_id, code, name, type, parent_id })`.
- `updateAccount(id, partial)`.
- `toggleAccountActive(id, is_active)`.
- `deleteAccount(id)` → solo si no tiene `journal_lines` referenciadas (verificar antes; mostrar error claro si tiene).

### 3. Componentes UI

- `src/features/accounts/components/AccountTree.tsx` — render recursivo. Usa indentación visual basada en profundidad. Muestra `code · name` y un badge con el tipo.
- `src/features/accounts/components/AccountForm.tsx` — modal con campos:
  - `code` (text, requerido, único en el libro)
  - `name` (text, requerido)
  - `type` (select de los 5 tipos; bloqueado si tiene parent — hereda del padre)
  - `parent_id` (select con todas las cuentas; opcional)
  - `is_active` (switch)
- Validación con Zod.

### 4. Página

`src/pages/accounts/AccountsPage.tsx`:
- Header con botón "Nueva cuenta" (solo admin/editor).
- Tabs por tipo: Todas | Activo | Pasivo | Patrimonio | Ingresos | Gastos.
- Search por código/nombre.
- En cada cuenta: botón editar, botón "Desactivar" (no borrar; preserva historia).
- Botón "Borrar" solo si nunca se usó.

### 5. Hooks de uso compartido

- `useAccountsMap(bookId)` → objeto `{ [id]: Account }` cacheado, para resolver IDs en otras pantallas (asientos).
- `useAccountTree(bookId)` → estructura jerárquica para selects.

## Files created/modified

- `supabase/migrations/<timestamp>_seed_accounts_function.sql`
- Edición del `<timestamp>_create_book_function.sql` previo (para llamar a `seed_default_accounts`)
- `src/features/accounts/api.ts`
- `src/features/accounts/schemas.ts`
- `src/features/accounts/hooks/{useAccounts,useAccountsMap,useAccountTree}.ts`
- `src/features/accounts/components/{AccountTree,AccountForm}.tsx`
- `src/pages/accounts/AccountsPage.tsx`
- `src/routes/index.tsx` (ruta `/accounts`)
- `src/components/layout/AppLayout.tsx` (link "Cuentas")

## Verification

1. Crear un libro nuevo → automáticamente tiene las 18 cuentas del seed.
2. Crear cuenta hija "Caja chica" bajo "Caja" (1.1.1) con código `1.1.1.1` → aparece anidada.
3. Editar el nombre de "Banco" → persiste.
4. Intentar borrar "Caja" después de tener un asiento que la referencia → error claro.
5. Desactivar "Caja chica" → ya no aparece en el select de asientos (cuando exista en fase 06), pero sigue visible en la lista con badge "Inactiva".
6. Como `viewer`, los botones de crear/editar no aparecen.

## Definition of Done

- [ ] Los 6 escenarios pasan.
- [ ] El árbol se ve correctamente en mobile (sin scroll horizontal).
- [ ] Tipo no editable cuando hay parent (hereda).
- [ ] Commit: `feat(phase-05): plan de cuentas con seed inicial`.

## Notas

- El seed es opinionated; el usuario puede ajustar cuentas a su gusto.
- Códigos: convención libre del usuario. No imponemos formato estricto.
- Si en el futuro se quiere importar/exportar plan de cuentas, reservar el formato CSV con columnas `code,name,type,parent_code`.
