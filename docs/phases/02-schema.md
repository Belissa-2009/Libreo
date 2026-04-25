# Fase 02 — Schema, RLS y migrations

## Goal
Crear el proyecto Supabase, aplicar el schema completo (tablas, tipos, triggers, políticas RLS), generar tipos TypeScript y conectar al frontend.

## Prerequisites
- Fase 01 completada.
- Proyecto Supabase **ya existe** (`Tio Jandy`, ref `acwepefsmcreootmtrde`). Supabase CLI ya instalado por el usuario.
- MCP de Supabase configurado en `.vscode/mcp.json` (úsalo para inspeccionar lo que vas creando).

## Steps

### 1. Configurar `.env.local`

Toma el `anon key` desde el dashboard de Supabase (Settings → API) o pídeselo al usuario. La URL ya la conoces:

```
VITE_SUPABASE_URL=https://acwepefsmcreootmtrde.supabase.co
VITE_SUPABASE_ANON_KEY=<pegar anon key>
```

### 2. Vincular el proyecto local al remoto

El usuario **ya hizo login** con el CLI. No ejecutes `supabase login`. Desde la raíz del proyecto:

```bash
supabase init                                       # solo si supabase/ aún no existe
supabase link --project-ref acwepefsmcreootmtrde    # vincular al proyecto remoto
```

Confirma el vínculo:

```bash
supabase projects list   # debe listar Tio Jandy
```

Y usa el MCP para verificar que puedes leer del proyecto correcto antes de empezar a aplicar migrations.

### 3. Migration inicial

Genera la migration con el CLI (timestamp + nombre, evita colisiones):

```bash
supabase migration new initial_schema
```

Edita el archivo creado en `supabase/migrations/<timestamp>_initial_schema.sql` con todo el schema. **El contenido está completamente especificado en [docs/architecture.md](../architecture.md)**, sección "Schema completo". Copia ese SQL **exactamente**, en este orden:

1. `CREATE TYPE` (todos los enums).
2. Tablas en este orden (importante por las FKs):
   - `profiles`
   - `books`
   - `book_members`
   - `invitations`
   - `currencies`
   - `exchange_rates`
   - `accounts`
   - `periods`
   - `journal_entries`
   - `journal_lines`
   - `templates`, `template_lines`, `recurring_schedules`
   - `loans`, `loan_schedule`, `loan_payments`
3. Índices recomendados:
   ```sql
   CREATE INDEX idx_journal_entries_book_date ON journal_entries(book_id, entry_date DESC);
   CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
   CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
   CREATE INDEX idx_accounts_book ON accounts(book_id);
   CREATE INDEX idx_loan_schedule_loan ON loan_schedule(loan_id, version);
   CREATE INDEX idx_book_members_user ON book_members(user_id);
   ```
4. Triggers (de architecture.md):
   - `validate_balanced_entry` con su `CONSTRAINT TRIGGER`.
   - `check_period_open`.
5. Trigger para crear perfil al registrarse:
   ```sql
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
   ```
6. Vistas iniciales: `v_ledger`, `v_trial_balance` (de architecture.md). El resto se agrega en fase 07.

### 4. RLS policies

Genera otra migration:

```bash
supabase migration new rls_policies
```

Habilita RLS en TODAS las tablas de dominio:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
```

`currencies` queda **sin** RLS (es catálogo público).

#### Helper: función `is_book_member`

```sql
CREATE OR REPLACE FUNCTION is_book_member(p_book_id UUID, required_roles member_role[] DEFAULT ARRAY['admin','editor','viewer']::member_role[])
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM book_members
    WHERE book_id = p_book_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
  );
$$;
```

#### Políticas por tabla

**profiles**: cada usuario solo ve y edita su propio perfil.
```sql
CREATE POLICY profiles_select ON profiles FOR SELECT USING (id = auth.uid()
  OR id IN (SELECT user_id FROM book_members WHERE book_id IN (
    SELECT book_id FROM book_members WHERE user_id = auth.uid()
  )));
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());
```

**books**: el dueño puede todo; los miembros leen.
```sql
CREATE POLICY books_select ON books FOR SELECT
  USING (id IN (SELECT book_id FROM book_members WHERE user_id = auth.uid()));
CREATE POLICY books_insert ON books FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY books_update ON books FOR UPDATE USING (is_book_member(id, ARRAY['admin']::member_role[]));
CREATE POLICY books_delete ON books FOR DELETE USING (owner_id = auth.uid());
```

**book_members**: admins gestionan; miembros leen.
```sql
CREATE POLICY members_select ON book_members FOR SELECT
  USING (book_id IN (SELECT book_id FROM book_members WHERE user_id = auth.uid()));
CREATE POLICY members_write ON book_members FOR ALL
  USING (is_book_member(book_id, ARRAY['admin']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin']::member_role[]));
```
> Excepción: cuando un usuario acepta una invitación se inserta su `book_member` vía Edge Function con service-role, que ignora RLS.

**Patrón estándar para todas las tablas con `book_id`**:
```sql
-- Reemplaza <table> por: accounts, exchange_rates, periods, journal_entries,
-- templates, recurring_schedules, loans
CREATE POLICY <table>_select ON <table> FOR SELECT USING (is_book_member(book_id));
CREATE POLICY <table>_write ON <table> FOR ALL
  USING (is_book_member(book_id, ARRAY['admin','editor']::member_role[]))
  WITH CHECK (is_book_member(book_id, ARRAY['admin','editor']::member_role[]));
```

**Para tablas hijas sin `book_id` directo** (`journal_lines`, `template_lines`, `loan_schedule`, `loan_payments`): la política valida vía join. Ejemplo:
```sql
CREATE POLICY journal_lines_select ON journal_lines FOR SELECT
  USING (entry_id IN (
    SELECT id FROM journal_entries WHERE is_book_member(book_id)
  ));
CREATE POLICY journal_lines_write ON journal_lines FOR ALL
  USING (entry_id IN (
    SELECT id FROM journal_entries WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
  ))
  WITH CHECK (entry_id IN (
    SELECT id FROM journal_entries WHERE is_book_member(book_id, ARRAY['admin','editor']::member_role[])
  ));
```
Aplica el mismo patrón con la tabla padre correspondiente para `template_lines`, `loan_schedule`, `loan_payments`.

### 5. Seed de catálogo

Crea `supabase/seed.sql`:

```sql
INSERT INTO currencies (code, name, symbol) VALUES
  ('USD', 'Dólar estadounidense', '$'),
  ('EUR', 'Euro', '€'),
  ('VES', 'Bolívar venezolano', 'Bs'),
  ('MXN', 'Peso mexicano', '$'),
  ('COP', 'Peso colombiano', '$'),
  ('ARS', 'Peso argentino', '$')
ON CONFLICT (code) DO NOTHING;
```

### 6. Aplicar migrations

```bash
supabase db push --linked
```

Si pide confirmación, acepta. Verifica:
- En el dashboard de Supabase (Table Editor) que todas las tablas existen.
- O usa el **MCP** para ejecutar `select table_name from information_schema.tables where table_schema = 'public'` y ver el listado completo.

### 7. Generar tipos TypeScript

```bash
supabase gen types typescript --linked > src/types/database.ts
```

Reemplaza el contenido placeholder. Verifica que `src/lib/supabase.ts` ya no se queja.

### 8. Smoke test

Crea temporalmente en `src/App.tsx`:

```tsx
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function App() {
  useEffect(() => {
    supabase.from('currencies').select('*').then(r => console.log('currencies', r));
  }, []);
  return <h1>Libro Diario</h1>;
}
```

`npm run dev`, abre la consola. Debes ver el array de monedas. Quita después.

## Files created/modified

- `supabase/migrations/<timestamp>_initial_schema.sql`
- `supabase/migrations/<timestamp>_rls_policies.sql`
- `supabase/seed.sql`
- `src/types/database.ts` (regenerado)

## Verification

- [ ] Todas las tablas listadas en architecture.md existen en Supabase.
- [ ] Cada tabla con `book_id` tiene RLS habilitado (Table Editor → ícono de candado).
- [ ] Insertar manualmente en `currencies` desde el dashboard funciona; insertar en `accounts` sin estar autenticado falla por RLS.
- [ ] El smoke test devuelve las 6 monedas seed.
- [ ] `src/types/database.ts` tiene tipos generados (no es `any`).

## Definition of Done

- [ ] Migrations aplicadas y reproducibles (`supabase db reset` debe regenerar todo).
- [ ] Tipos TypeScript generados.
- [ ] Triggers de partida doble y periodos creados.
- [ ] Commit: `feat(phase-02): schema completo con RLS y triggers`.

## Troubleshooting

- **`supabase link` falla**: verifica que tienes el `project-ref` correcto y que iniciaste sesión.
- **RLS bloquea queries del backend**: para operaciones administrativas (Edge Functions) usa la `service_role` key, no la `anon` key.
- **Trigger `validate_balanced_entry` se ejecuta antes de tener todas las líneas**: confirma que es `DEFERRABLE INITIALLY DEFERRED` y que las inserciones están en una transacción.
