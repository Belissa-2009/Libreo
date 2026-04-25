# CLAUDE.md — Convenciones del proyecto Libro Diario

Este archivo es la guía obligatoria para cualquier modelo (Sonnet u otro) que ejecute el plan de implementación. **Léelo antes de empezar cualquier fase.**

## Qué es este proyecto

Aplicación contable PWA (web + móvil instalable) multi-usuario para llevar registros con partida doble. Stack: **React + TypeScript + Vite + TailwindCSS + shadcn/ui** en el frontend, **Supabase (Postgres + Auth + RLS)** en el backend.

El plan completo está en [PLAN.md](PLAN.md). La arquitectura (schema, RLS, manejo de dinero) está en [docs/architecture.md](docs/architecture.md). Cada fase de implementación está en [docs/phases/](docs/phases/) numerada del 01 al 14.

## Cómo trabajar

1. **Lee la fase actual completa antes de empezar.** Cada fase tiene: Goal, Prerequisites, Steps, Files, Verification, Definition of Done.
2. **No saltes fases.** Cada una asume que las anteriores están completas y verificadas.
3. **Termina cada fase con la verificación.** No marques una fase como hecha si la verificación falla.
4. **Commit al final de cada fase** con mensaje `feat(phase-N): <título>`.
5. Si una decisión técnica no está cubierta en el plan, sigue las **convenciones obligatorias** de abajo. Si sigue sin estar claro, pregunta al usuario antes de improvisar.

## Estado de Supabase (ya configurado)

El usuario ya creó el proyecto en Supabase y configuró las herramientas. **No vuelvas a crearlo.**

- **Nombre del proyecto**: `Tio Jandy`
- **Project ID / ref**: `acwepefsmcreootmtrde`
- **URL del proyecto**: `https://acwepefsmcreootmtrde.supabase.co`
- **Supabase CLI**: instalado globalmente y **ya con login hecho** (no ejecutes `supabase login`). Puedes usar `supabase` (o `npx supabase` dentro del proyecto si prefieres la versión local). Verifica el estado con `supabase projects list` si dudas.
- **Supabase MCP** (read-only): configurado en [.vscode/mcp.json](.vscode/mcp.json) apuntando a `http://localhost:54321/mcp?read_only=true`. Úsalo para **inspeccionar** schema, listar tablas, leer datos, validar políticas RLS y debuggear queries SELECT — pero **no para escribir**. Toda escritura va por CLI o migration SQL.

### Convención de uso del CLI

- **Crear y aplicar migrations**:
  ```bash
  supabase migration new <nombre_descriptivo>
  # editar el archivo SQL generado en supabase/migrations/
  supabase db push --linked
  ```
- **Vincular el proyecto local al remoto** (si no está hecho):
  ```bash
  supabase link --project-ref acwepefsmcreootmtrde
  ```
- **Generar tipos TypeScript** (después de cada cambio de schema):
  ```bash
  supabase gen types typescript --linked > src/types/database.ts
  ```
- **Deploy de Edge Functions**:
  ```bash
  supabase functions deploy <nombre>
  ```
- **Resetear DB local de desarrollo** (si tienes el stack local levantado):
  ```bash
  supabase db reset
  ```

### Cuándo apoyarte en el MCP vs el CLI

| Necesitas... | Usa |
|--------------|-----|
| Listar tablas, ver columnas, ver políticas RLS | MCP |
| Hacer SELECT para validar datos seed o de prueba | MCP |
| Verificar que una migration se aplicó | MCP |
| Aplicar migration | CLI (`supabase db push`) |
| Crear/modificar schema | Migration SQL + CLI |
| Desplegar Edge Function | CLI |
| Generar tipos TS | CLI |

Si el MCP devuelve resultados que parecen "viejos" comparados con cambios recién aplicados, refresca o vuelve a consultar — el read-only puede tener un breve delay.

## Convenciones obligatorias

### Dinero — NUNCA uses `Number` ni `Float`
- En Postgres: `NUMERIC(18,4)` para todos los montos.
- En TypeScript: usa `dinero.js` o `decimal.js`. **Está prohibido** sumar/restar/multiplicar montos con operadores nativos de JS.
- Helpers en [src/lib/money.ts](src/lib/money.ts) — siempre úsalos.

### Partida doble — validación en dos capas
- **Frontend (UX)**: el form de asiento muestra error en tiempo real si `total_debit ≠ total_credit`.
- **Backend (integridad)**: trigger Postgres `validate_balanced_entry` rechaza el insert/update. Nunca confíes solo en validación cliente.

### Row Level Security desde el día 1
- Toda tabla con `book_id` debe tener RLS habilitado y políticas por rol del usuario en `book_members`.
- No diferir RLS "para después". Si una tabla queda abierta, los datos de otros usuarios serían visibles.

### TypeScript estricto
- `tsconfig.json` con `"strict": true`.
- Genera tipos de Supabase con `supabase gen types typescript --linked > src/types/database.ts` y úsalos en todas las queries.
- Nunca uses `any`. Si lo necesitas, justifícalo con un comentario.

### Mobile-first
- Todos los flujos deben funcionar en pantalla de 360px de ancho.
- Especial atención al form de "nuevo asiento" — es el flujo más crítico en móvil.
- Prueba en Chrome DevTools con vista móvil antes de marcar una fase como hecha.

### Diseño funcional, no estético
- Tema neutro de shadcn/ui (slate o zinc).
- Sin animaciones decorativas.
- Tablas densas, formularios compactos.
- No agregues librerías de UI extra (ni Material, ni Ant, ni Chakra). Solo Tailwind + shadcn/ui.

### Estructura por features
- Carpeta `src/features/<dominio>/` con todo lo de ese dominio (componentes, hooks, queries, tipos).
- Carpeta `src/components/ui/` solo para componentes de shadcn.
- Carpeta `src/lib/` para utilidades transversales (supabase, money, exporters, date-fns wrappers).

### Git
- Una rama por fase: `feat/phase-NN-<slug>`.
- Commits pequeños y descriptivos en español.
- Al terminar la fase: PR (o merge a `main` si solo trabajas tú) con la verificación copiada en la descripción.

## Cosas que NO debes hacer

- No instales librerías que no estén en el plan sin avisar.
- No cambies el stack (si algo no funciona, primero busca solución dentro del stack acordado).
- No mezcles lógica contable en componentes React — esa lógica vive en `src/lib/` o en funciones SQL.
- No hagas refactor "preventivo" mientras implementas una fase. Termina la fase y luego propón el refactor.
- No subas las claves de Supabase al repo. `.env` está en `.gitignore`. Solo `.env.example`.

## Cosas que SÍ debes hacer cuando dudes

- Lee [docs/architecture.md](docs/architecture.md) — la mayoría de decisiones técnicas están ahí.
- Lee la fase anterior — muchas convenciones se establecen una vez.
- Ejecuta el dev server (`npm run dev`) y prueba el flujo end-to-end antes de declarar una fase terminada.
- Para errores de Postgres / RLS, revisa los logs en el dashboard de Supabase.

## Idioma

- **UI en español.** Todos los textos visibles al usuario.
- **Código en inglés.** Nombres de variables, funciones, tipos, tablas SQL.
- Los comentarios pueden ser en cualquiera de los dos, pero solo cuando expliquen el "por qué" no obvio.
