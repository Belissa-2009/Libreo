# US-11 — Perfil y preferencias del sistema

> **Dominio:** Profile / User Preferences  
> **Fuente:** Transversal (aplica a todos los módulos con selección de divisa)  
> **Estado:** Pendiente ⬜

---

## Contexto

Cada usuario puede personalizar el comportamiento del sistema según sus necesidades. La preferencia más crítica es la **divisa por defecto**: como el sistema opera principalmente en República Dominicana, el peso dominicano (DOP) es el valor predeterminado, pero un usuario que trabaje mayoritariamente en dólares puede cambiarlo a USD.

Esta preferencia se almacena a nivel de usuario (no de libro) y se usa como valor pre-seleccionado en todos los formularios del sistema que requieran elegir una divisa (asientos, préstamos, tasas de cambio, etc.).

---

## Historias de usuario

### US-11-1 — Ver perfil y preferencias

**Como** usuario autenticado,  
**quiero** acceder a una sección de "Perfil" o "Preferencias",  
**para** ver y editar mis datos personales y la configuración de la aplicación.

#### Criterios de aceptación

- [ ] Existe una sección de perfil accesible desde el menú principal o el avatar del usuario.
- [ ] La sección está dividida en al menos dos segmentos claramente diferenciados: **Perfil** y **Configuración**.
- [ ] El segmento **Perfil** muestra el correo del usuario (solo lectura desde Supabase Auth).
- [ ] El segmento **Configuración** (o "Preferencias del sistema") muestra la divisa por defecto actualmente seleccionada.

---

### US-11-2 — Cambiar la divisa por defecto del sistema

**Como** usuario autenticado,  
**quiero** cambiar la divisa por defecto del sistema en mis preferencias,  
**para** que todos los formularios del sistema pre-seleccionen la divisa con la que trabajo habitualmente.

#### Criterios de aceptación

- [ ] El segmento **Configuración** muestra un selector de divisa con las opciones disponibles (`DOP`, `USD`).
- [ ] El valor inicial del selector es `DOP` para cualquier usuario que aún no haya configurado esta preferencia.
- [ ] Al cambiar la divisa y guardar, la preferencia se persiste en la base de datos asociada al usuario.
- [ ] Tras guardar, se muestra un mensaje de confirmación ("Preferencias guardadas").
- [ ] Si el guardado falla, se muestra un mensaje de error claro.
- [ ] La nueva preferencia entra en efecto de inmediato: cualquier formulario con selección de divisa que se abra **después** de guardar pre-selecciona la divisa configurada.
- [ ] La preferencia persiste entre sesiones (no se resetea al cerrar y reabrir).

---

### US-11-3 — Divisa por defecto aplicada globalmente

**Como** usuario autenticado con divisa por defecto configurada,  
**quiero** que todos los formularios del sistema que incluyan un campo de divisa lo pre-seleccionen con mi preferencia,  
**para** no tener que elegirla manualmente en cada operación.

#### Criterios de aceptación

- [ ] El formulario de **nuevo asiento contable** pre-selecciona la divisa por defecto del usuario.
- [ ] El formulario de **nuevo préstamo** pre-selecciona la divisa por defecto del usuario.
- [ ] El formulario de **nueva tasa de cambio** pre-selecciona la divisa base del usuario como referencia.
- [ ] Si la preferencia es `DOP`, el selector muestra `DOP` como valor inicial en todos los formularios listados arriba.
- [ ] Si la preferencia es `USD`, el selector muestra `USD` como valor inicial en todos los formularios listados arriba.
- [ ] El usuario siempre puede cambiar la divisa manualmente dentro de cada formulario individual; cambiarla en el formulario no modifica la preferencia global.

---

## Reglas de negocio

1. La divisa por defecto es `DOP` para todo usuario nuevo que no haya configurado preferencias.
2. Solo se puede configurar una divisa por defecto (no múltiples).
3. Las divisas disponibles para seleccionar como predeterminada son únicamente las registradas en la tabla `currencies` (actualmente `DOP` y `USD`).
4. La preferencia es por usuario, no por libro: aplica a todos los libros del usuario.
5. Cambiar la preferencia no modifica registros existentes (asientos, préstamos, etc.) — solo afecta el valor inicial de los formularios futuros.

---

## Notas técnicas

### Tabla `user_preferences`

Crear tabla para almacenar preferencias del usuario:

```sql
CREATE TABLE user_preferences (
  user_id   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_currency_code  TEXT NOT NULL DEFAULT 'DOP' REFERENCES currencies(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- El usuario solo puede ver y modificar sus propias preferencias
CREATE POLICY "user_preferences_select" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_preferences_insert" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_update" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid());
```

> **Nota:** Al crear una nueva cuenta, se inserta una fila en `user_preferences` con los valores por defecto (puede hacerse con un trigger `AFTER INSERT ON auth.users` o de forma lazy al primer acceso al perfil).

### Hook `useUserPreferences`

- Exponer las preferencias del usuario como contexto global en `src/features/profile/hooks/useUserPreferences.ts`.
- El hook debe cachear el valor para evitar fetches repetidos y exponerlo a cualquier componente sin necesidad de prop-drilling.
- Ejemplo de uso en formularios:
  ```ts
  const { defaultCurrencyCode } = useUserPreferences();
  // Usar como defaultValue del campo currency_code en el form
  ```

### Archivos relevantes

- Migración: `supabase/migrations/YYYYMMDD_create_user_preferences.sql`
- Tipos generados: `src/types/database.ts` (regenerar tras migración)
- Hook: `src/features/profile/hooks/useUserPreferences.ts`
- Página/sección: `src/pages/profile/ProfilePage.tsx` (o componente dentro del layout)
- Segmento de preferencias: `src/features/profile/components/SystemPreferences.tsx`
