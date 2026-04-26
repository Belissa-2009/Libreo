# Libro Diario

Aplicación contable personal y compartida con partida doble. Desarrollada con React 19, TypeScript, TailwindCSS v4, shadcn/ui y Supabase.

## Características

- **Múltiples libros contables** con roles (admin / editor / viewer).
- **Asientos de diario** con partida doble y validación de cuadre.
- **Multimoneda** — registra en cualquier moneda; la tasa de cambio se aplica a los reportes en base.
- **Reportes**: Mayor, Balance de Comprobación, Estado de Resultados, Balance General.
- **Exportación** a PDF, Excel y CSV.
- **Préstamos** con amortización francesa y abonos extraordinarios.
- **PWA** instalable en Android, iOS y escritorio.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Estilos | TailwindCSS v4 + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| PDF | @react-pdf/renderer |
| Excel | SheetJS (xlsx) |
| Deploy | Vercel |

## Desarrollo local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu URL y anon key de Supabase

# 3. Aplicar migraciones
npx supabase db push --linked

# 4. Iniciar servidor de desarrollo
npm run dev
```

## Deploy en Vercel

1. Importar el repositorio en [vercel.com](https://vercel.com).
2. Framework preset: **Vite** (auto-detectado).
3. Agregar variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

Tras el primer deploy, actualizar en el dashboard de Supabase:
- **Authentication → URL Configuration → Site URL** a la URL de producción.
- **Redirect URLs** con `https://tu-dominio.com/**`.

## Variables de entorno

```env
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

> **Nunca** incluyas la `service_role` key en el frontend.

## Estructura del proyecto

```
src/
├── components/       # Componentes genéricos (layout, UI primitivos)
├── features/         # Feature modules (auth, books, journal, accounts, reports, loans, currencies)
├── lib/              # Utilidades (supabase client, exporters, utils)
├── pages/            # Páginas por ruta
├── routes/           # Configuración de rutas
└── types/            # Tipos generados por Supabase CLI
supabase/
└── migrations/       # Migraciones SQL en orden cronológico
```

## Para usuarios finales

La aplicación está disponible en la URL proporcionada por el administrador. Para unirse a un libro compartido, pide al administrador que te envíe una invitación por correo.

Para soporte, contacta al administrador del sistema.


The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
