# US-09 — PWA e instalación

> **Dominio:** PWA / Infraestructura cliente  
> **Fuente:** Fase 13  
> **Estado:** Implementado ✅

---

## Contexto

La aplicación es una Progressive Web App (PWA). Los usuarios pueden instalarla en su dispositivo como si fuera una app nativa, recibir actualizaciones automáticas y tener una experiencia optimizada en pantallas móviles.

---

## Historias de usuario

### US-09-1 — Instalar la aplicación en el dispositivo

**Como** usuario que visita la aplicación desde el navegador,  
**quiero** poder instalarla en mi dispositivo (teléfono o computadora),  
**para** acceder a ella directamente desde la pantalla de inicio sin abrir el navegador.

#### Criterios de aceptación

- [ ] La aplicación cumple los criterios PWA: manifest completo, service worker, íconos, HTTPS.
- [ ] En navegadores compatibles (Chrome/Edge desktop, Chrome Android), aparece un banner o prompt de instalación.
- [ ] El banner incluye un botón "Instalar" y otro para descartarlo.
- [ ] Si el usuario descarta el banner, no vuelve a mostrarse en esa sesión (dismissal guardado en `localStorage`).
- [ ] La app instalada se muestra en modo `standalone` (sin barra de navegación del navegador).
- [ ] En iOS/Safari, el usuario puede instalarla manualmente via "Agregar a pantalla de inicio".

---

### US-09-2 — Recibir actualizaciones automáticas

**Como** usuario con la aplicación instalada,  
**quiero** ser notificado cuando hay una nueva versión disponible,  
**para** actualizar la app sin tener que reinstalarla.

#### Criterios de aceptación

- [ ] Cuando hay una nueva versión del service worker listo, se muestra una notificación persist no intrusiva.
- [ ] La notificación incluye un botón "Recargar" para aplicar la actualización.
- [ ] Al hacer clic en "Recargar", la app se actualiza y recarga automáticamente.
- [ ] Si el usuario ignora la notificación, puede seguir usando la versión actual.

---

### US-09-3 — Acceso rápido a funciones clave desde la app instalada

**Como** usuario con la app instalada,  
**quiero** poder acceder rápidamente a "Nuevo asiento" y "Reportes" desde el lanzador del sistema operativo,  
**para** ir directamente a las funciones más usadas sin navegar por la app.

#### Criterios de aceptación

- [ ] El manifest incluye shortcuts: "Nuevo asiento" (`/journal/new`) y "Reportes" (`/reports`).
- [ ] En dispositivos Android compatibles, los shortcuts aparecen al hacer long-press sobre el ícono.

---

### US-09-4 — Experiencia en pantallas pequeñas

**Como** usuario en móvil,  
**quiero** que todos los formularios y tablas sean usables en una pantalla de 360px de ancho,  
**para** registrar asientos desde el teléfono con la misma efectividad que en escritorio.

#### Criterios de aceptación

- [ ] El formulario de asiento funciona en pantalla de 360px: los campos se apilan verticalmente, los botones son touch-friendly.
- [ ] Las tablas de reportes son horizontalmente scrolleables en móvil sin romper el layout.
- [ ] La navegación en móvil usa la barra inferior (o equivalente); en desktop usa sidebar lateral.
- [ ] El viewport respeta las safe-areas del iPhone (notch, barra de inicio).

---

## Reglas de negocio

- La app **requiere conexión activa** para leer y escribir datos en Supabase. No hay modo offline de edición.
- El service worker cachea los assets estáticos para arranque rápido; las peticiones de datos siempre van a la red.
- El tamaño máximo de precaché de Workbox es 5MB (necesario por el peso de `@react-pdf/renderer` + `xlsx`).

## Notas técnicas

- Plugin: `vite-plugin-pwa` con estrategia `generateSW`.
- Manifest configurado en `vite.config.ts` (id, lang, dir, orientation, categories, shortcuts, icons).
- `InstallPrompt.tsx`: escucha `beforeinstallprompt` y renderiza el banner de instalación.
- `UpdateToast.tsx`: usa `useRegisterSW({ immediate: true })` de `virtual:pwa-register/react`.
- Safe-area-insets declarados como custom properties CSS en `src/index.css`.
- Tipos de `virtual:pwa-register/react` en `tsconfig.app.json` bajo `"types"`.
