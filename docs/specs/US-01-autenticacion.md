# US-01 — Autenticación

> **Dominio:** Auth  
> **Fuente:** Fase 03  
> **Estado:** Implementado ✅

---

## Contexto

El sistema es multi-usuario. Cada persona necesita una identidad verificada antes de acceder a cualquier libro contable. La autenticación se maneja con Supabase Auth (proveedor Email).

---

## Historias de usuario

### US-01-1 — Registro de cuenta

**Como** visitante sin cuenta,  
**quiero** registrarme con mi correo y una contraseña,  
**para** poder acceder a la aplicación y crear mis propios libros contables.

#### Criterios de aceptación

- [ ] El formulario solicita: correo electrónico, contraseña (mínimo 6 caracteres).
- [ ] El campo de correo valida formato de email antes de enviar.
- [ ] Si el registro es exitoso, se muestra un mensaje de éxito.
- [ ] Si el correo ya existe, se muestra un error claro ("Este correo ya está registrado").
- [ ] El botón de envío muestra estado de carga mientras espera respuesta.
- [ ] Los errores se muestran inline bajo el campo correspondiente.

---

### US-01-2 — Inicio de sesión

**Como** usuario registrado,  
**quiero** iniciar sesión con mi correo y contraseña,  
**para** acceder a mis libros contables.

#### Criterios de aceptación

- [ ] El formulario solicita correo y contraseña.
- [ ] Si las credenciales son correctas, redirige a la página principal (`/`).
- [ ] Si las credenciales son incorrectas, se muestra un mensaje de error de autenticación.
- [ ] El botón muestra estado de carga durante la petición.
- [ ] Existe un enlace "¿Olvidaste tu contraseña?" visible en la pantalla.
- [ ] Existe un enlace "Crear cuenta" para ir al registro.

---

### US-01-3 — Cierre de sesión

**Como** usuario autenticado,  
**quiero** cerrar mi sesión,  
**para** que otras personas usando el mismo dispositivo no puedan acceder a mis datos.

#### Criterios de aceptación

- [ ] Existe un botón o enlace "Cerrar sesión" accesible desde el perfil.
- [ ] Al cerrar sesión, la sesión se invalida en el cliente.
- [ ] El usuario es redirigido a la pantalla de login.
- [ ] Las rutas protegidas no son accesibles después de cerrar sesión.

---

### US-01-4 — Recuperación de contraseña

**Como** usuario que olvidó su contraseña,  
**quiero** solicitar un enlace de recuperación,  
**para** poder acceder nuevamente a mi cuenta.

#### Criterios de aceptación

- [ ] El formulario solicita el correo registrado.
- [ ] Al enviar, se muestra confirmación de que el correo fue enviado (sin revelar si el email existe o no).
- [ ] El enlace del email redirige a una pantalla de nueva contraseña.
- [ ] La pantalla de nueva contraseña valida que la contraseña cumpla el mínimo de caracteres.
- [ ] Tras cambiar la contraseña, el usuario es redirigido al login.

---

### US-01-5 — Rutas protegidas

**Como** sistema,  
**quiero** que las rutas internas sean inaccesibles sin sesión activa,  
**para** proteger los datos de los usuarios.

#### Criterios de aceptación

- [ ] Cualquier URL interna (`/`, `/journal`, `/accounts`, etc.) redirige a `/login` si no hay sesión.
- [ ] Mientras se verifica la sesión al cargar la app, se muestra un indicador de carga.
- [ ] Una vez autenticado, el usuario es redirigido a la ruta que intentó visitar originalmente (o a `/`).

---

### US-01-6 — Perfil de usuario

**Como** usuario autenticado,  
**quiero** ver y editar mi información de perfil,  
**para** mantener mis datos actualizados.

#### Criterios de aceptación

- [ ] La pantalla de perfil muestra el correo electrónico del usuario (solo lectura).
- [ ] El usuario puede editar su nombre completo.
- [ ] Los cambios se guardan correctamente y se refleja la actualización.
- [ ] Existe un botón de "Cerrar sesión" en la pantalla de perfil.

---

## Reglas de negocio

- El correo es el identificador único e inmutable de la cuenta.
- Las rutas `/login`, `/signup`, `/forgot-password` y `/reset-password` son las únicas accesibles sin sesión.
- La sesión persiste entre visitas (no expira al cerrar pestaña).

## Notas técnicas

- Proveedor: Supabase Auth con email/password.
- Gestión de sesión: `supabase.auth.onAuthStateChange` + `getSession()` al montar.
- Contexto global: `AuthProvider` expone `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`.
- Validación: Zod en `src/features/auth/schemas.ts`.
