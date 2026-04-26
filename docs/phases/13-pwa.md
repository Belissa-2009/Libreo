# Fase 13 — PWA polish

## Goal
La aplicación es instalable en móvil y desktop, con iconos y manifest correctos, splash screen, install prompt y caching de assets para arranque rápido. Lighthouse PWA score ≥ 90.

## Prerequisites
- Fases anteriores completadas. La app es funcional en navegador.

## Steps

### 1. Iconos definitivos

Crea iconos en estos tamaños y colócalos en `public/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-maskable-512.png` (512×512, con safe area centrada al 80% — usa https://maskable.app para previsualizar)
- `apple-touch-icon.png` (180×180)
- `favicon.ico` (multi-size)

Diseño: minimalista, alto contraste. Sugerencia: una "L" o "$" sobre fondo sólido del color del tema (`#0f172a`).

Genera con un tool como https://realfavicongenerator.net o https://maskable.app/editor.

### 2. Manifest definitivo

Actualiza `vite.config.ts`, opción `manifest`:

```ts
manifest: {
  id: '/',
  name: 'Libreo',
  short_name: 'Libreo',
  description: 'Aplicación contable personal y compartida con partida doble.',
  lang: 'es',
  dir: 'ltr',
  theme_color: '#0f172a',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait-primary',
  start_url: '/',
  scope: '/',
  categories: ['finance', 'productivity'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Nuevo asiento', url: '/journal/new', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    { name: 'Reportes', url: '/reports', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
  ],
}
```

### 3. HTML head

Actualiza `index.html`:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0f172a" />
  <meta name="description" content="Aplicación contable personal y compartida" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <title>Libreo</title>
</head>
```

### 4. Caching strategy

En `vite.config.ts` opción `workbox`, ajusta runtime caching:

```ts
workbox: {
  globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api/, /\/functions\//],
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'google-fonts-stylesheets' },
    },
    {
      urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
},
```

> **No cachees** las requests a Supabase. Eso causaría datos viejos. La app requiere conexión.

### 5. Install prompt

`src/components/InstallPrompt.tsx`:

- Escucha `beforeinstallprompt` en window.
- Guarda el evento en estado.
- Muestra un banner discreto (bottom toast) con "Instalar app" y "Cerrar".
- Al click en instalar: `event.prompt()`.
- Recuerda en localStorage que el usuario ya cerró el prompt para no spamearlo.

Renderiza en `AppLayout` solo si está autenticado y no en standalone (`!window.matchMedia('(display-mode: standalone)').matches`).

### 6. Service Worker update flow

Cuando hay nueva versión, mostrar toast "Nueva versión disponible. Recargar." con `vite-plugin-pwa` API:

```ts
import { useRegisterSW } from 'virtual:pwa-register/react';

const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
```

Mostrar toast con `sonner` cuando `needRefresh[0]` sea true.

### 7. iOS standalone tweaks

iOS Safari es quisquilloso:
- En `index.html`:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Libreo" />
  ```
- Splash screens: opcionales pero recomendadas para iOS. Generar con https://progressier.com/pwa-icons-and-ios-splash-screen-generator y referenciar con `<link rel="apple-touch-startup-image" ... media="...">`.
- Safe area: el layout debe respetar `env(safe-area-inset-*)`. Tailwind v4 lo soporta vía `pt-safe`, `pb-safe`. Configurar en `src/index.css`:
  ```css
  @theme {
    --spacing-safe-top: env(safe-area-inset-top);
    --spacing-safe-bottom: env(safe-area-inset-bottom);
  }
  ```

### 8. Performance básica

- `npm run build` → revisar tamaño de bundle (`dist/`). Lazy-load páginas pesadas (`React.lazy`) si pasan de ~500KB.
- Comprimir imágenes (los iconos PNG pueden optimizarse con tinypng).
- Asegurar que las fuentes (si usas) tengan `font-display: swap`.

### 9. Lighthouse audit

```bash
npm run build
npm run preview
```

Abre Lighthouse en Chrome, modo móvil. Apunta a:
- PWA: ≥ 90
- Performance: ≥ 80
- Accessibility: ≥ 90

Corrige issues que aparezcan (manifest mal formado, falta de alt en imágenes, contraste insuficiente).

## Files created/modified

- `public/{icon-192,icon-512,icon-maskable-512,apple-touch-icon}.png`, `public/favicon.ico`
- `index.html`
- `vite.config.ts`
- `src/components/InstallPrompt.tsx`
- `src/components/UpdateToast.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/index.css`

## Verification

1. `npm run build && npm run preview` → abrir en Chrome móvil (DevTools).
2. DevTools → Application → Manifest: sin errores.
3. DevTools → Application → Service Workers: registrado y activo.
4. Lighthouse PWA: ≥ 90.
5. En Chrome desktop: aparece ícono "Instalar" en la barra de URL.
6. Instalar la app, abrirla desde el ícono → arranca en standalone, sin browser chrome.
7. En iOS (Safari): "Compartir" → "Añadir a inicio" → ícono correcto, se abre standalone.
8. Hacer cambio en `App.tsx`, rebuild, recargar → toast "Nueva versión disponible".
9. Sin conexión: la app carga (pero las requests a Supabase fallarán; mostrar mensaje de error claro). El **cascarón** debe cargar offline; el contenido de Supabase no.

## Definition of Done

- [ ] Los 9 escenarios pasan.
- [ ] Iconos correctos en Android, iOS y desktop.
- [ ] Manifest válido sin warnings.
- [ ] Lighthouse PWA ≥ 90.
- [ ] Install prompt funcional.
- [ ] Update toast funcional.
- [ ] Commit: `feat(phase-13): PWA completa con iconos, manifest e install prompt`.

## Notas

- No prometemos modo offline completo. La app necesita conexión (datos en Supabase). El cascarón cachea para arranque rápido.
- Splash screens iOS son nice-to-have. Si toma mucho tiempo, dejarlas para después.
- Para distribución por App Store: necesitarías Capacitor o similar. Eso es otro proyecto.
