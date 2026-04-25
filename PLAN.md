# Libro Diario — Plan de implementación

## Contexto

Aplicación contable PWA (web + móvil) multi-usuario para llevar registros con partida doble. Permite múltiples libros contables compartidos entre usuarios con roles (admin / editor / viewer), genera reportes financieros estándar y maneja préstamos con tabla de amortización y abonos extraordinarios.

**Usuario objetivo**: el dueño y su esposa, llevando finanzas personales y de un emprendimiento. Posibilidad de invitar más usuarios por libro.

## Decisiones arquitectónicas

| Aspecto | Decisión |
|---------|----------|
| Plataforma | PWA instalable (un único codebase para web y móvil) |
| Frontend | React 19 + TypeScript + Vite |
| UI | TailwindCSS + shadcn/ui |
| Backend | Supabase (Postgres + Auth + RLS + Edge Functions + pg_cron) |
| Auth | Email + contraseña |
| Multi-tenant | Por "libro" (`book`), con `book_members` y RLS |
| Almacenamiento | 100% en la nube (sin offline complejo en MVP) |
| Dinero | `NUMERIC(18,4)` en DB, `dinero.js` en frontend |
| Hosting | Vercel o Cloudflare Pages |
| Idioma UI | Español |
| Proyecto Supabase | `Tio Jandy` (ref `acwepefsmcreootmtrde`) — ya creado y vinculado |
| Tooling extra | Supabase CLI instalado + Supabase MCP (read-only) en [.vscode/mcp.json](.vscode/mcp.json) |

Más detalle técnico en [docs/architecture.md](docs/architecture.md).
Convenciones obligatorias en [CLAUDE.md](CLAUDE.md).

## Fases

Cada fase es independientemente verificable y debe terminar con su Definition of Done cumplida. Sigue el orden, no saltes fases.

| # | Fase | Documento | Resultado |
|---|------|-----------|-----------|
| 01 | Setup del proyecto | [docs/phases/01-setup.md](docs/phases/01-setup.md) | Proyecto Vite corriendo, Tailwind, shadcn, PWA y Supabase client conectados |
| 02 | Schema, RLS y migrations | [docs/phases/02-schema.md](docs/phases/02-schema.md) | Base de datos completa en Supabase con políticas RLS y tipos generados |
| 03 | Autenticación | [docs/phases/03-auth.md](docs/phases/03-auth.md) | Signup, login, logout, recuperar password, perfil |
| 04 | Libros y miembros | [docs/phases/04-books-members.md](docs/phases/04-books-members.md) | CRUD de libros, invitaciones, roles, contexto de libro activo |
| 05 | Plan de cuentas | [docs/phases/05-accounts.md](docs/phases/05-accounts.md) | Árbol de cuentas con tipos y jerarquía + seed inicial |
| 06 | Asientos de diario | [docs/phases/06-journal.md](docs/phases/06-journal.md) | Form de asiento con partida doble, listado, búsqueda |
| 07 | Mayor + reportes financieros | [docs/phases/07-reports.md](docs/phases/07-reports.md) | Mayor por cuenta, balance de comprobación, P&L, balance general |
| 08 | Multimoneda | [docs/phases/08-multicurrency.md](docs/phases/08-multicurrency.md) | Tasas de cambio y conversión a moneda base en reportes |
| 09 | Préstamos y abonos | [docs/phases/09-loans.md](docs/phases/09-loans.md) | Tabla de amortización, pagos, abonos con reducir plazo / reducir cuota |
| 10 | Asientos recurrentes | [docs/phases/10-recurring.md](docs/phases/10-recurring.md) | Plantillas + Edge Function + pg_cron |
| 11 | Exportación | [docs/phases/11-exports.md](docs/phases/11-exports.md) | PDF, Excel y CSV de cada reporte |
| 12 | Cierre de periodos | [docs/phases/12-periods.md](docs/phases/12-periods.md) | Bloqueo de meses cerrados |
| 13 | PWA polish | [docs/phases/13-pwa.md](docs/phases/13-pwa.md) | Manifest, iconos, install prompt, splash, caching |
| 14 | Deploy | [docs/phases/14-deploy.md](docs/phases/14-deploy.md) | App publicada en producción con env vars |

## MVP vs. post-MVP

**MVP = fases 01–09 + 11 + 13 + 14**. Esto cubre el core contable, préstamos, exportación y publicación.
**Post-MVP**: 10 (recurrentes) y 12 (cierre de periodos) pueden hacerse después si urge publicar.

## Criterios de aceptación globales

Al terminar las fases del MVP, el usuario debe poder:

1. Registrarse, hacer login, recuperar contraseña.
2. Crear un libro contable, invitar a otra persona como editor.
3. Configurar plan de cuentas (con seed inicial cargado).
4. Registrar un asiento que respete partida doble; el sistema rechaza asientos desbalanceados.
5. Ver el mayor de una cuenta con saldo corriente.
6. Ver Balance de Comprobación con totales débito = crédito.
7. Ver Estado de Resultados y Balance General correctos para un periodo.
8. Registrar asientos en USD con tasa de cambio y verlos convertidos en moneda base.
9. Crear un préstamo con tabla de amortización francesa, pagar cuotas y ver el asiento generado.
10. Hacer un abono extraordinario y elegir entre **reducir plazo** o **reducir cuota**, con previsualización del impacto.
11. Exportar Balance General y P&L en PDF y Excel.
12. Instalar la PWA en móvil y abrirla desde el ícono.
13. Confirmar que un viewer no puede crear ni editar asientos (RLS lo bloquea).
