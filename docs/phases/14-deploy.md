# Fase 14 — Deploy a producción

## Goal
Publicar la app en una URL pública (Vercel o Cloudflare Pages), con env vars de producción apuntando al proyecto Supabase, y verificar que el flujo end-to-end funciona en producción.

## Prerequisites
- Fase 13 completada. La app es funcional localmente y pasa Lighthouse.

## Steps

### 1. Decidir entre Vercel y Cloudflare Pages

| Aspecto | Vercel | Cloudflare Pages |
|---------|--------|------------------|
| Setup | Más simple | Igual de simple |
| Edge network | Excelente | Excelente |
| Free tier | Generoso, suficiente | Generoso, suficiente |
| Custom domain | Sí | Sí |
| Recomendación | **Vercel** para empezar | Igual de buena alternativa |

Asume **Vercel** en los pasos siguientes; Cloudflare Pages es análogo.

### 2. Repositorio Git

Si aún no está, inicializar:

```bash
git init
git add .
git commit -m "feat: initial accounting app"
```

Crear repo en GitHub (privado) y push. La app contiene datos sensibles potenciales — preferir privado.

### 3. Conectar Vercel

1. https://vercel.com → "New Project" → importar el repo.
2. Framework preset: **Vite** (auto-detectado).
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Install command: `npm install`.
6. **Environment Variables**:
   - `VITE_SUPABASE_URL` = la URL del proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY` = anon key.
7. Deploy.

### 4. Configurar dominio

- Si usas dominio personalizado: Vercel → Settings → Domains → agregar.
- Configurar DNS (Vercel guía con los registros exactos).
- Esperar propagación (típicamente <10 min).

### 5. Actualizar URLs en Supabase

Dashboard de Supabase → Authentication → URL Configuration:
- **Site URL**: `https://tu-dominio.com` (o `https://<proyecto>.vercel.app`).
- **Redirect URLs**: `https://tu-dominio.com/**` y, si tiene dominio Vercel preview, también `https://*-tu-equipo.vercel.app/**`.

Esto es crítico para que el flow de "reset password" redirija al dominio correcto.

### 6. Probar producción

1. Abrir la URL pública en navegador limpio (incógnito).
2. Registrar un usuario nuevo.
3. Login.
4. Crear libro contable.
5. Hacer un asiento.
6. Ver Balance de Comprobación.
7. Exportar a PDF.
8. Instalar como PWA en móvil.
9. Logout, recuperar contraseña, recibir email, completar reset.

### 7. Headers de seguridad

Crear `vercel.json` en la raíz:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

> Si el día de mañana usas `Content-Security-Policy`, ten cuidado de no romper Supabase ni el SW.

### 8. Monitoreo básico

- **Vercel Analytics**: gratis para Hobby; activar.
- **Supabase Logs**: revisa Auth Logs y Postgres Logs si algo falla en producción.
- **Errores frontend**: considerar Sentry (free tier 5k eventos/mes) — opcional MVP.

### 9. Backup

Configura backup automático en Supabase:
- Free tier: backups diarios pero no descargables (cuidado).
- Plan Pro: backups con retención y export. Recomendado si ya pagas.
- Alternativa gratis: cron job que exporta tablas a JSON y las sube a un Google Drive personal vía script.

### 10. Documentar acceso para tu esposa

Crea un README breve para los usuarios finales:

- URL de la app.
- Cómo registrarse.
- Cómo ser invitada al libro existente.
- Contacto para soporte.

## Files created/modified

- `vercel.json`
- `README.md` (público o privado)
- `.gitignore` (verificar que `.env*`, `dist`, `node_modules` están ignorados)

## Verification

- [ ] La URL pública carga sin errores.
- [ ] Lighthouse PWA en producción ≥ 90.
- [ ] Los 9 pasos de "Probar producción" pasan.
- [ ] Headers de seguridad presentes (verificar con https://securityheaders.com).
- [ ] La PWA se instala en Android y iOS.
- [ ] Backup configurado.

## Definition of Done

- [ ] App publicada en URL accesible.
- [ ] Variables de entorno de producción configuradas.
- [ ] Email de reset password funciona en producción.
- [ ] Tu esposa puede registrarse y unirse al libro compartido.
- [ ] Commit: `chore(phase-14): deploy en Vercel con headers de seguridad`.

## Notas

- Deploy preview por PR: Vercel lo da automático. Útil para probar cambios antes de merger.
- Si tienes problemas con CORS de Supabase: la `anon key` desde el navegador es esperada; si falla, revisa que la URL en `.env` sea la correcta.
- No subas la `service_role` key al frontend. **Nunca**. Solo Edge Functions.
