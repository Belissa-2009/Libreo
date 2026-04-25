# Fase 04 — Libros y miembros

## Goal
Permitir crear libros contables, invitar otros usuarios con roles (admin/editor/viewer), aceptar invitaciones, cambiar de libro activo. Toda la UI siguiente opera dentro del libro activo.

## Prerequisites
- Fase 03 completada.

## Steps

### 1. Edge Function para invitaciones

Las invitaciones se aceptan vía un token único enviado por email; se necesita un endpoint que ignore RLS para crear el `book_member` cuando el invitado acepta.

Crea `supabase/functions/accept-invitation/index.ts`:

- Recibe `{ token: string }`.
- Verifica al usuario autenticado (`auth.getUser()`).
- Lee `invitations` con service-role key.
- Si el token es válido, no expirado, y el email del invitee coincide con el `auth.email`:
  - Inserta `book_members(book_id, user_id, role)` con la `role` de la invitación.
  - Marca la invitación como `accepted_at = now()`.
- Devuelve `{ book_id }`.

Despliega:
```bash
supabase functions deploy accept-invitation
```

Configura los secrets que necesite (la `service_role` key se inyecta automáticamente como `SUPABASE_SERVICE_ROLE_KEY`).

### 2. Email de invitación

**Opción simple** (MVP): NO enviar email. La app genera un link `https://app/.../accept-invitation?token=xxx`, el admin lo copia y se lo manda a la persona por WhatsApp/email.

**Opción completa** (post-MVP): enviar con Resend o el SMTP de Supabase. No invertir tiempo en esto ahora.

### 3. Queries y hooks

Crea `src/features/books/api.ts` con funciones tipadas:

- `listBooks()` → libros donde el usuario es miembro, con su rol.
- `createBook({ name, base_currency })` → inserta en `books`, luego en `book_members` (al `owner_id` con rol `admin`). Hacerlo en una transacción RPC `create_book` (función SQL) para evitar inconsistencia.
- `updateBook(id, { name, base_currency })`.
- `deleteBook(id)` → solo owner.
- `listMembers(bookId)`.
- `createInvitation(bookId, email, role)` → inserta en `invitations`, devuelve token + URL.
- `revokeInvitation(id)`.
- `removeMember(bookId, userId)`.
- `updateMemberRole(bookId, userId, role)`.
- `acceptInvitation(token)` → llama a la Edge Function.

### 4. Función SQL `create_book`

Genera una nueva migration con `supabase migration new create_book_function` y pega:

```sql
CREATE OR REPLACE FUNCTION create_book(p_name TEXT, p_base_currency TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_book_id UUID;
BEGIN
  INSERT INTO books (name, base_currency, owner_id)
  VALUES (p_name, p_base_currency, auth.uid())
  RETURNING id INTO v_book_id;

  INSERT INTO book_members (book_id, user_id, role)
  VALUES (v_book_id, auth.uid(), 'admin');

  -- Aquí también se sembrará el plan de cuentas inicial en fase 05
  RETURN v_book_id;
END;
$$;
```

Aplica con `supabase db push --linked` y regenera tipos con `supabase gen types typescript --linked > src/types/database.ts`.

### 5. Estado global del libro activo

Crea `src/features/books/useActiveBook.ts` con Zustand:

- `activeBookId: string | null`
- `setActiveBook(id)`
- `clearActiveBook()`
- Persiste en `localStorage` con `zustand/middleware/persist` bajo la key `active-book`.

Al hacer login, si el usuario solo tiene un libro, se selecciona automáticamente. Si tiene varios, redirige a `/books` para elegir. Si no tiene ninguno, redirige a `/books/new`.

### 6. Páginas

- `src/pages/books/BooksPage.tsx` — lista de libros del usuario con su rol; botones "Crear libro", "Entrar". Al entrar, setea activeBookId y va a `/`.
- `src/pages/books/NewBookPage.tsx` — form: nombre + moneda base (select). Llama `create_book` RPC.
- `src/pages/books/BookSettingsPage.tsx` — solo admin: editar nombre/moneda; lista miembros con su rol; botón "Invitar miembro" (modal con email + rol); botón "Quitar" por miembro; cambiar rol inline; mostrar invitaciones pendientes con botón copiar link y revocar.
- `src/pages/books/AcceptInvitationPage.tsx` — recibe `?token=xxx`. Si no hay sesión, redirige a `/login` preservando el token. Si hay sesión, llama `acceptInvitation(token)`, muestra resultado y redirige a `/`.

### 7. Selector en el layout

En `AppLayout`, en el header, muestra el nombre del libro activo con dropdown para cambiar de libro o ir a configuración.

### 8. Filtrar contenido por libro activo

Reglas para todo el resto del proyecto:
- Cualquier query de datos de dominio debe filtrar por `activeBookId`. Crea un helper `useBookQuery` que lo aplique automáticamente.
- Si `activeBookId` es null, no permitas operaciones de dominio.

## Files created/modified

- `supabase/functions/accept-invitation/index.ts`
- `supabase/migrations/<timestamp>_create_book_function.sql`
- `src/types/database.ts` (regenerado)
- `src/features/books/{api,useActiveBook,schemas}.ts`
- `src/features/books/components/{BookCard,InviteMemberDialog,MembersList}.tsx`
- `src/pages/books/{Books,NewBook,BookSettings,AcceptInvitation}Page.tsx`
- `src/components/layout/AppLayout.tsx` (selector de libro)
- `src/routes/index.tsx` (nuevas rutas)

## Verification

1. **Crear libro**: usuario A crea "Personal" con moneda USD → aparece como admin.
2. **Invitación copy-link**: A invita `b@example.com` como editor → genera link.
3. **Aceptar invitación**: usuario B (registrado) abre el link → se une al libro como editor.
4. **Cambiar libro activo**: A crea segundo libro "Negocio", el dropdown lista ambos, cambia entre ellos.
5. **Roles**: B no puede ver "Configuración del libro" (solo admin).
6. **Quitar miembro**: A quita a B → B ya no ve el libro.
7. **RLS**: en el SQL Editor de Supabase, prueba `set role authenticated; set request.jwt.claim.sub = '<uuid de C>'; select * from books;` — debe devolver solo libros donde C es miembro.

## Definition of Done

- [ ] Los 7 escenarios del verification pasan.
- [ ] El libro activo persiste tras recargar.
- [ ] Sin libro activo, las páginas de dominio (cuando existan) muestran un empty state que invita a crear/seleccionar libro.
- [ ] Commit: `feat(phase-04): libros, miembros e invitaciones`.

## Notas

- Cuando se elimina un libro, las cascadas en FK borran todo lo de dominio. Cuidado: confirmación con doble click.
- La invitación expira a 7 días por defecto. Configurable en `createInvitation`.
- Si dos usuarios editan al mismo tiempo, TanStack Query revalida; no necesitamos realtime para el MVP.
