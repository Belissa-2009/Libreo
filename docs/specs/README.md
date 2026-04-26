00# Especificaciones del sistema — Libro Diario

Este directorio contiene las **historias de usuario (US)** y **criterios de aceptación** de cada dominio funcional del sistema. Son la fuente de verdad para saber qué hace la aplicación y qué debe cumplir cualquier nueva iteración.

---

## Cómo usar estos documentos

- **Antes de implementar** cualquier feature nuevo, revisa si ya existe una US relacionada o si debes crear una nueva.
- **Al agregar funcionalidad** a un dominio existente, extiende el archivo correspondiente con nuevas historias o actualiza los criterios de aceptación.
- **Los criterios de aceptación** son la Definition of Done de cada historia. Una feature no está completa hasta que todos sus criterios están marcados.
- **No modifiques** los criterios de una US ya implementada sin crear primero una nueva US que describa el cambio (trazabilidad).

---

## Índice de especificaciones

| Archivo | Dominio | Fase origen | Estado |
|---------|---------|-------------|--------|
| [US-01-autenticacion.md](US-01-autenticacion.md) | Autenticación | 03 | ✅ Implementado |
| [US-02-libros-miembros.md](US-02-libros-miembros.md) | Libros y miembros | 04 | ✅ Implementado |
| [US-03-plan-de-cuentas.md](US-03-plan-de-cuentas.md) | Plan de cuentas | 05 | ✅ Implementado |
| [US-04-libro-diario.md](US-04-libro-diario.md) | Asientos / Diario | 06 | ✅ Implementado |
| [US-05-reportes.md](US-05-reportes.md) | Reportes financieros | 07 | ✅ Implementado |
| [US-06-multimoneda.md](US-06-multimoneda.md) | Multimoneda | 08 | ✅ Implementado |
| [US-07-prestamos.md](US-07-prestamos.md) | Préstamos | 09 | ✅ Implementado |
| [US-08-exportacion.md](US-08-exportacion.md) | Exportación PDF/Excel/CSV | 11 | ✅ Implementado |
| [US-09-pwa.md](US-09-pwa.md) | PWA e instalación | 13 | ✅ Implementado |
| [US-10-roles-permisos.md](US-10-roles-permisos.md) | Roles y permisos (transversal) | 02, 04 | ✅ Implementado |

---

## Estructura de una US

Cada archivo de especificación sigue esta estructura:

```
# US-NN — Nombre del dominio

## Contexto
Por qué existe este dominio, qué problema resuelve.

## Historias de usuario

### US-NN-M — Nombre de la historia
**Como** [rol],
**quiero** [acción],
**para** [beneficio].

#### Criterios de aceptación
- [ ] Criterio 1
- [ ] Criterio 2
...

## Reglas de negocio
Invariantes y restricciones del dominio.

## Notas técnicas
Referencias a archivos, funciones, tablas relevantes.
```

---

## Convención de numeración

- `US-NN` identifica el dominio (un número por dominio funcional).
- `US-NN-M` identifica una historia dentro del dominio (M es incremental).
- Al agregar un dominio nuevo, asigna el siguiente número disponible en la tabla de índice.

---

## Fases no cubiertas como US (fuera del MVP actual)

Las siguientes fases del plan de implementación no están implementadas y no tienen specs todavía:

| Fase | Título | Notas |
|------|--------|-------|
| 10 | Asientos recurrentes | Post-MVP |
| 12 | Cierre de períodos | Post-MVP |
