# US-02 — Libros contables y miembros

> **Dominio:** Books / Members  
> **Fuente:** Fase 04  
> **Estado:** Implementado ✅

---

## Contexto

Un **libro contable** es el contenedor raíz de toda la información financiera: cuentas, asientos, reportes y préstamos. El sistema es multi-libro: un usuario puede pertenecer a varios libros con distintos roles. Toda la UI opera siempre sobre un "libro activo" seleccionado.

---

## Historias de usuario

### US-02-1 — Crear un libro

**Como** usuario autenticado,  
**quiero** crear un libro contable con nombre y moneda base,  
**para** comenzar a registrar transacciones financieras.

#### Criterios de aceptación

- [ ] El formulario solicita: nombre del libro y moneda base (selector de monedas disponibles).
- [ ] Al crear el libro, el usuario queda automáticamente como miembro con rol `admin`.
- [ ] Se genera automáticamente un plan de cuentas predeterminado (ver US-03).
- [ ] El nuevo libro aparece inmediatamente en la lista de libros del usuario.
- [ ] El nombre es obligatorio y tiene al menos 2 caracteres.

---

### US-02-2 — Listar mis libros

**Como** usuario autenticado,  
**quiero** ver todos los libros a los que pertenezco junto con mi rol en cada uno,  
**para** saber qué libros puedo gestionar y con qué permisos.

#### Criterios de aceptación

- [ ] Se muestran todos los libros del usuario con su nombre, moneda base y rol.
- [ ] Si no hay libros, se muestra un estado vacío con llamado a la acción de crear uno.
- [ ] Los libros creados por otros usuarios pero de los que soy miembro también aparecen.

---

### US-02-3 — Seleccionar el libro activo

**Como** usuario autenticado,  
**quiero** seleccionar cuál libro estoy usando en este momento,  
**para** que todas las secciones (asientos, cuentas, reportes) muestren datos del libro correcto.

#### Criterios de aceptación

- [ ] Existe un selector de libro activo visible en el encabezado de la aplicación.
- [ ] Al cambiar el libro activo, todos los datos de la UI se actualizan.
- [ ] El libro activo se persiste localmente (no se pierde al recargar la página).
- [ ] Si el libro activo ya no está disponible (fue eliminado o el usuario fue removido), se limpia la selección.

---

### US-02-4 — Editar un libro

**Como** administrador del libro,  
**quiero** cambiar el nombre o la moneda base del libro,  
**para** corregir datos incorrectos.

#### Criterios de aceptación

- [ ] Solo usuarios con rol `admin` pueden editar la configuración del libro.
- [ ] Los cambios se guardan y se reflejan inmediatamente en la UI.
- [ ] Cambiar la moneda base no altera los asientos ya registrados (el tipo de cambio queda congelado por asiento).

---

### US-02-5 — Eliminar un libro

**Como** dueño del libro,  
**quiero** eliminar un libro que ya no necesito,  
**para** mantener mi espacio de trabajo organizado.

#### Criterios de aceptación

- [ ] Solo el owner (creador) puede eliminar el libro.
- [ ] Se muestra un diálogo de confirmación antes de eliminar.
- [ ] Al eliminar, se borra toda la información asociada (cuentas, asientos, miembros).
- [ ] La operación es irreversible y así se advierte al usuario.

---

### US-02-6 — Invitar miembro al libro

**Como** administrador del libro,  
**quiero** invitar a otros usuarios por correo electrónico,  
**para** colaborar en el mismo libro con roles apropiados.

#### Criterios de aceptación

- [ ] El formulario solicita el correo del invitado y su rol (`admin`, `editor` o `viewer`).
- [ ] Se genera un enlace de invitación único con token.
- [ ] El enlace puede copiarse al portapapeles para enviarlo manualmente.
- [ ] La invitación se muestra como "pendiente" hasta que sea aceptada.
- [ ] Una invitación pendiente puede ser revocada por el administrador.
- [ ] No se pueden invitar correos ya miembros del libro.

---

### US-02-7 — Aceptar invitación

**Como** usuario invitado,  
**quiero** aceptar una invitación a través del enlace recibido,  
**para** unirme al libro con el rol asignado.

#### Criterios de aceptación

- [ ] Al acceder al enlace, si no hay sesión, se redirige al login/registro antes de continuar.
- [ ] Si el correo de la sesión coincide con el correo de la invitación, se acepta automáticamente.
- [ ] Si el token es inválido o expirado, se muestra un error descriptivo.
- [ ] Tras aceptar, el libro aparece en la lista del usuario y puede seleccionarse.

---

### US-02-8 — Gestionar miembros existentes

**Como** administrador del libro,  
**quiero** cambiar el rol de un miembro o removerlo del libro,  
**para** controlar los permisos de acceso.

#### Criterios de aceptación

- [ ] Se muestra la lista de miembros actuales con su nombre/correo y rol.
- [ ] Un administrador puede cambiar el rol de cualquier miembro (excepto el suyo propio si es el único admin).
- [ ] Un administrador puede remover a cualquier miembro del libro.
- [ ] No es posible remover al último administrador del libro.

---

## Reglas de negocio

- Un libro siempre tiene al menos un `admin`.
- La moneda base del libro se usa como referencia en todos los reportes.
- Los roles disponibles son: `admin`, `editor`, `viewer` (ver US-11 para tabla de permisos).
- Las invitaciones expiran a las 7 días de generarse.
- La relación usuario–libro vive en `book_members(book_id, user_id, role)`.

## Notas técnicas

- La creación del libro usa la función RPC `create_book` (transacción atómica: inserta libro + agrega miembro + siembra cuentas).
- Las invitaciones se aceptan a través de la Edge Function `accept-invitation` (evita RLS al crear `book_member`).
- El libro activo se guarda en Zustand (`useActiveBook`) con persistencia en `localStorage`.
