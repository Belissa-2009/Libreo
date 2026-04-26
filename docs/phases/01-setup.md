# Fase 01 — Setup del proyecto

## Goal
Dejar el proyecto listo para programar: Vite + React + TypeScript inicializado, Tailwind v4, shadcn/ui, vite-plugin-pwa, dependencias core instaladas, cliente Supabase y estructura de carpetas en su sitio.

## Prerequisites
- Node 20+ y npm 10+ instalados.
- Cuenta de Supabase creada (no es necesario tener el proyecto todavía; eso es la Fase 02).

## Steps

### 1. Inicializar Vite

```bash
npm create vite@latest . -- --template react-ts
```

Cuando pregunte si remover archivos, acepta. Luego:

```bash
npm install
```

### 2. Limpiar archivos demo
Borra el contenido de `src/App.tsx`, `src/App.css`, `src/index.css`, y deja un `App.tsx` mínimo que renderice `<h1>Libreo</h1>`.

### 3. Configurar TypeScript con path alias

En `tsconfig.app.json` añade:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Mismo cambio en `tsconfig.json` (sección `compilerOptions`).

### 4. Instalar Tailwind v4

```bash
npm install tailwindcss @tailwindcss/vite
```

Reemplaza `src/index.css` por:

```css
@import "tailwindcss";
```

### 5. Configurar Vite (Tailwind + PWA + alias)

Instala el resto:

```bash
npm install vite-plugin-pwa
npm install -D @types/node
```

Reemplaza `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Libreo',
        short_name: 'Libreo',
        description: 'Aplicación contable personal y compartida',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Iconos provisorios: cualquier PNG de los tamaños indicados en `public/`. Se reemplazan en la Fase 13.

### 6. Instalar dependencias core

```bash
npm install @supabase/supabase-js @tanstack/react-query react-router zustand react-hook-form zod @hookform/resolvers dinero.js @dinero.js/currencies date-fns
```

### 7. Inicializar shadcn/ui

```bash
npx shadcn@latest init
```

Respuestas:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Esto crea `components.json`, modifica `src/index.css` (con variables CSS) y crea `src/lib/utils.ts`.

Agrega componentes base que usaremos:

```bash
npx shadcn@latest add button input label dialog select table sonner form card dropdown-menu sheet textarea tabs separator badge
```

### 8. Crear estructura de carpetas

```bash
mkdir -p src/features/{auth,books,accounts,journal,reports,loans,templates,periods,currencies}
mkdir -p src/components/layout
mkdir -p src/lib/exporters
mkdir -p src/hooks src/pages src/routes src/types
mkdir -p supabase/migrations supabase/functions
```

### 9. Cliente Supabase y env

Crea `.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Copia a `.env.local` (este archivo NO va al repo). Asegúrate que `.gitignore` incluya `.env*` excepto `.env.example`.

Crea `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local');
}

export const supabase = createClient<Database>(url, key);
```

> Nota: `Database` se generará en la Fase 02. Por ahora crea `src/types/database.ts` con `export type Database = any;` como placeholder y déjalo marcado con TODO.

### 10. Crear helper de dinero

Crea `src/lib/money.ts`:

```ts
import { dinero, add, subtract, multiply, toDecimal, toSnapshot, type Dinero, type Currency } from 'dinero.js';
import { USD, EUR, VES, MXN, COP, ARS } from '@dinero.js/currencies';

export const CURRENCIES: Record<string, Currency<number>> = { USD, EUR, VES, MXN, COP, ARS };

export function money(amount: number | string, currencyCode: string): Dinero<number> {
  const currency = CURRENCIES[currencyCode];
  if (!currency) throw new Error(`Moneda no soportada: ${currencyCode}`);
  const scale = currency.exponent;
  const numeric = typeof amount === 'string' ? Number(amount) : amount;
  const value = Math.round(numeric * 10 ** scale);
  return dinero({ amount: value, currency });
}

export function formatMoney(d: Dinero<number>): string {
  const { amount, currency } = toSnapshot(d);
  const decimal = (amount / 10 ** currency.exponent).toFixed(currency.exponent);
  return `${currency.code} ${decimal}`;
}

export { add, subtract, multiply, toDecimal };
```

> Si necesitas más monedas, agrégalas a `CURRENCIES` y actualiza la tabla `currencies` en DB.

### 11. Configurar TanStack Query y React Router

Crea `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { Toaster } from '@/components/ui/sonner';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

### 12. Run

```bash
npm run dev
```

Verifica `http://localhost:5173`. Debes ver el `<h1>` y la consola sin errores.

## Files created/modified

- `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`
- `src/App.tsx`, `src/main.tsx`, `src/index.css`
- `src/lib/supabase.ts`, `src/lib/money.ts`, `src/lib/utils.ts`
- `src/types/database.ts` (placeholder)
- `src/components/ui/*` (componentes shadcn)
- `components.json`
- `.env.example`, `.env.local`, `.gitignore`
- Carpetas vacías de `src/features/*`, `supabase/*`

## Verification

- [ ] `npm run dev` arranca sin errores.
- [ ] La página renderiza el `<h1>`.
- [ ] DevTools → Application → Manifest muestra el manifest del PWA.
- [ ] Importar `{ supabase }` desde `@/lib/supabase` no da error de tipos (con el placeholder `any`).
- [ ] Importar `{ money, formatMoney }` desde `@/lib/money` funciona en una prueba rápida (`console.log(formatMoney(money(100, 'USD')))` → `USD 100.00`).

## Definition of Done

- [ ] El proyecto corre con `npm run dev`.
- [ ] `npm run build` termina sin errores.
- [ ] `.env.local` existe (no committeado) con valores válidos o vacíos placeholder.
- [ ] La estructura de carpetas existe.
- [ ] Commit: `feat(phase-01): setup vite + react + tailwind + shadcn + pwa`.
