# US-10 — Roles y permisos

> **Dominio:** Transversal (Access Control)  
> **Fuente:** Fases 02, 04  
> **Estado:** Implementado ✅

---

## Contexto

El sistema es multi-usuario colaborativo. Los permisos se controlan a nivel de **libro** mediante el rol asignado en `book_members`. La seguridad se aplica en dos capas: la UI oculta acciones no permitidas, y RLS en Postgres garantiza que ninguna petición directa pueda violarlos.

---

## Historias de usuario

### US-10-1 — Acceso diferenciado por rol

**Como** sistema,  
**quiero** restringir las acciones disponibles según el rol del usuario en cada libro,  
**para** garantizar que solo personas autorizadas modifiquen la información.

#### Criterios de aceptación

**Viewer (solo lectura):**
- [ ] Puede ver el plan de cuentas.
- [ ] Puede ver el listado de asientos del diario.
- [ ] Puede ver todos los reportes (Balance de Comprobación, Mayor, Estado de Resultados, Balance General).
- [ ] Puede exportar reportes (PDF, Excel, CSV).
- [ ] No puede crear, editar ni eliminar asientos, cuentas, préstamos ni tipos de cambio.
- [ ] Los botones de crear/editar/eliminar no son visibles en la UI.

**Editor:**
- [ ] Todo lo que puede hacer un Viewer, más:
- [ ] Puede crear, editar y eliminar asientos en el diario.
- [ ] Puede crear y editar cuentas en el plan de cuentas.
- [ ] Puede agregar y actualizar tipos de cambio.
- [ ] Puede crear préstamos y registrar pagos.
- [ ] No puede invitar ni gestionar miembros.
- [ ] No puede editar la configuración del libro (nombre, moneda base).
- [ ] No puede eliminar el libro.

**Admin:**
- [ ] Todo lo que puede hacer un Editor, más:
- [ ] Puede editar la configuración del libro (nombre, moneda base).
- [ ] Puede invitar nuevos miembros y asignarles rol.
- [ ] Puede cambiar el rol de cualquier miembro.
- [ ] Puede remover miembros del libro.
- [ ] Puede revocar invitaciones pendientes.
- [ ] Puede eliminar el libro (solo el owner/creador).

---

### US-10-2 — Seguridad en el backend (RLS)

**Como** sistema,  
**quiero** que las políticas de Row Level Security en Postgres bloqueen cualquier acceso no autorizado, independientemente de lo que haga el cliente,  
**para** garantizar que un usuario nunca pueda ver ni modificar datos de libros a los que no pertenece.

#### Criterios de aceptación

- [ ] Todas las tablas con `book_id` tienen RLS habilitado.
- [ ] Las políticas SELECT permiten leer solo registros de libros donde el usuario es miembro.
- [ ] Las políticas INSERT/UPDATE/DELETE solo permiten escritura a miembros con roles `admin` o `editor`, según corresponda.
- [ ] Las funciones SECURITY DEFINER (RPCs) verifican el rol internamente antes de proceder.
- [ ] Un usuario anónimo no puede consultar ninguna tabla protegida.

---

## Tabla de recursos y permisos

| Recurso | Viewer | Editor | Admin |
|---------|--------|--------|-------|
| Ver cuentas | ✅ | ✅ | ✅ |
| Crear/editar cuentas | ❌ | ✅ | ✅ |
| Eliminar cuentas | ❌ | ✅ | ✅ |
| Ver asientos | ✅ | ✅ | ✅ |
| Crear/editar asientos | ❌ | ✅ | ✅ |
| Eliminar asientos | ❌ | ✅ | ✅ |
| Ver reportes | ✅ | ✅ | ✅ |
| Exportar reportes | ✅ | ✅ | ✅ |
| Gestionar tipos de cambio | ❌ | ✅ | ✅ |
| Ver/crear préstamos | ❌ | ✅ | ✅ |
| Pagar cuotas de préstamo | ❌ | ✅ | ✅ |
| Configuración del libro | ❌ | ❌ | ✅ |
| Invitar miembros | ❌ | ❌ | ✅ |
| Cambiar rol de miembros | ❌ | ❌ | ✅ |
| Remover miembros | ❌ | ❌ | ✅ |
| Eliminar el libro | ❌ | ❌ | ✅ (solo owner) |

---

## Reglas de negocio

- Un libro siempre tiene al menos un miembro con rol `admin`.
- No se puede degradar a un admin si es el único admin del libro.
- No se puede remover al último admin del libro.
- El creator/owner del libro es automáticamente `admin` desde la creación.
- Los roles son por libro, no globales; un usuario puede ser `admin` en un libro y `viewer` en otro.

## Notas técnicas

- Los roles se almacenan en `book_members.role` con el enum `member_role` ('admin', 'editor', 'viewer').
- La función helper `is_book_member(book_id, roles[])` se usa dentro de las RPCs para verificar permisos.
- En el frontend, `myBook?.role` se usa para condicionar la visibilidad de botones y formularios.
- RLS está activo en: `books`, `book_members`, `accounts`, `journal_entries`, `journal_lines`, `loans`, `loan_schedule`, `loan_payments`, `exchange_rates`, `invitations`.
