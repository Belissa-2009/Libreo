# Fase 03 — Autenticación

## Goal
Sistema de auth funcional: registro, login, logout, recuperar contraseña, página de perfil. Rutas protegidas que redirigen a `/login` si no hay sesión.

## Prerequisites
- Fases 01 y 02 completadas.

## Steps

### 1. Configurar Auth en Supabase

Dashboard → Authentication → Providers → Email:
- **Enable Email provider**: ON.
- **Confirm email**: OFF para desarrollo (puedes activarlo en producción).
- **Secure email change**: ON.

URL Configuration (Authentication → URL Configuration):
- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/**`

### 2. AuthProvider

Crea `src/features/auth/AuthProvider.tsx`:

- Context que expone `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`, `resetPassword`.
- Suscripción a `supabase.auth.onAuthStateChange`.
- Al montar, hace `supabase.auth.getSession()`.

Hook `useAuth()` para acceder al context.

### 3. Validaciones con Zod

Crea `src/features/auth/schemas.ts`:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Nombre requerido'),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
```

### 4. Páginas

Crea con shadcn `Card` + `Form` + `Input`:

- `src/pages/auth/LoginPage.tsx` → email/password, link "¿No tienes cuenta?" y "Olvidé mi contraseña".
- `src/pages/auth/SignupPage.tsx` → nombre completo + email + password. Al registrarse pasa `data: { full_name }` en `options`.
- `src/pages/auth/ForgotPasswordPage.tsx` → email. Llama `supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })`.
- `src/pages/auth/ResetPasswordPage.tsx` → recibe token desde el email, permite cambiar password.
- `src/pages/auth/ProfilePage.tsx` → ver/editar `full_name`, mostrar email (readonly), botón "Cerrar sesión".

Cada formulario:
- Usa `react-hook-form` + `zodResolver`.
- Muestra errores inline.
- Botón con estado loading.
- Toast de éxito/error vía `sonner`.

### 5. Rutas y guards

Crea `src/routes/index.tsx` con `react-router`:

- Rutas públicas: `/login`, `/signup`, `/forgot-password`, `/reset-password`.
- Rutas protegidas: todo lo demás, dentro de un `<ProtectedRoute>` que:
  - Si `loading` → muestra spinner.
  - Si no hay `user` → redirige a `/login`.
  - Si hay `user` → renderiza children.

`src/components/layout/AppLayout.tsx`: layout con sidebar (desktop) / bottom nav (mobile) y `<Outlet />`. Por ahora solo enlaces a "Inicio" y "Perfil"; los demás se agregan según las fases avancen.

### 6. Página inicial

Crea `src/pages/HomePage.tsx` con un placeholder: "Hola {user.full_name}". Esta página crece en fase 04 (selector de libros).

### 7. Conectar todo

Actualiza `src/App.tsx`:

```tsx
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AppRoutes } from '@/routes';

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
```

## Files created/modified

- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/schemas.ts`
- `src/features/auth/useAuth.ts`
- `src/pages/auth/{Login,Signup,ForgotPassword,ResetPassword,Profile}Page.tsx`
- `src/pages/HomePage.tsx`
- `src/routes/index.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/App.tsx`

## Verification

1. Ir a `/signup`, crear usuario `test@example.com` / `123456`. Confirmar que en Supabase Auth aparece el usuario y en `profiles` aparece la fila (vía trigger `handle_new_user`).
2. Logout. Ir a `/login`, entrar.
3. Logout. Ir a `/forgot-password`, pedir reset, abrir el email, completar el flujo en `/reset-password`.
4. Acceder a una ruta protegida sin sesión → redirige a `/login`.
5. Editar nombre en `/profile`, recargar, verifica que persiste.
6. Mobile (DevTools 360px): todas las pantallas son usables.

## Definition of Done

- [ ] Los 5 flujos del verification funcionan.
- [ ] Las rutas protegidas redirigen correctamente.
- [ ] El context expone `loading` correctamente (no flash de redirect en primer render).
- [ ] Mobile-first verificado.
- [ ] Commit: `feat(phase-03): autenticación con email/password y perfil`.

## Notas

- No agregues login con Google/social en esta fase. El usuario eligió email+password.
- La confirmación de email puede activarse después; no la necesitamos para desarrollo.
- Si más adelante se quiere "remember me", Supabase Auth ya persiste la sesión por defecto en localStorage.
