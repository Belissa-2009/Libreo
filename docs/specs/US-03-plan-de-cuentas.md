# US-03 — Plan de cuentas

> **Dominio:** Accounts  
> **Fuente:** Fase 05  
> **Estado:** Implementado ✅

---

## Contexto

El **plan de cuentas** es la estructura que clasifica los recursos, obligaciones, patrimonio, ingresos y gastos de una entidad. Todo asiento debe referenciar cuentas de este catálogo. Las cuentas se organizan en jerarquía (padre/hijo) con un código único por libro.

---

## Historias de usuario

### US-03-1 — Plan de cuentas por defecto al crear un libro

**Como** sistema,  
**quiero** sembrar un plan de cuentas inicial cuando se crea un libro,  
**para** que el usuario pueda empezar a registrar asientos sin configurar nada desde cero.

#### Criterios de aceptación

- [ ] Al crear un libro, se generan automáticamente las cuentas raíz: Activo (1), Pasivo (2), Patrimonio (3), Ingresos (4), Gastos (5).
- [ ] Se crean subcuentas básicas en cada categoría: Caja, Banco, Cuentas por cobrar, Cuentas por pagar, Préstamos por pagar, Capital, Resultados acumulados, Ingresos por servicios, Gastos operativos, entre otras.
- [ ] Las cuentas del seed tienen códigos jerárquicos (ej: `1`, `1.1`, `1.1.1`).
- [ ] El seed ocurre dentro de la misma transacción de creación del libro (función `create_book`).

---

### US-03-2 — Ver el plan de cuentas

**Como** miembro del libro (cualquier rol),  
**quiero** ver todas las cuentas del libro organizadas por tipo y jerarquía,  
**para** entender la estructura contable y encontrar cuentas específicas.

#### Criterios de aceptación

- [ ] Las cuentas se muestran agrupadas por tipo: Activos, Pasivos, Patrimonio, Ingresos, Gastos.
- [ ] La jerarquía se refleja visualmente con indentación según el nivel de la cuenta.
- [ ] Cada cuenta muestra su código, nombre y tipo.
- [ ] Las cuentas inactivas se muestran diferenciadas (opacas o con un badge).

---

### US-03-3 — Crear una cuenta

**Como** administrador o editor del libro,  
**quiero** crear nuevas cuentas en el catálogo,  
**para** adaptar el plan de cuentas a las necesidades específicas del negocio.

#### Criterios de aceptación

- [ ] El formulario solicita: código, nombre, tipo y cuenta padre (opcional).
- [ ] El código debe ser único dentro del libro.
- [ ] Si se selecciona una cuenta padre, el tipo de la nueva cuenta se hereda del padre y no puede cambiarse.
- [ ] La nueva cuenta se añade inmediatamente al árbol en la posición correcta.
- [ ] Los errores de validación se muestran inline.

---

### US-03-4 — Editar una cuenta

**Como** administrador o editor del libro,  
**quiero** actualizar el nombre, código o descripción de una cuenta,  
**para** corregir errores o mejorar la descripción.

#### Criterios de aceptación

- [ ] Se puede editar: código, nombre y descripción.
- [ ] No se puede cambiar el tipo de una cuenta que ya tiene asientos (para no distorsionar los reportes).
- [ ] Los cambios se reflejan inmediatamente en la lista y en los asientos que la referencian.

---

### US-03-5 — Desactivar / activar una cuenta

**Como** administrador del libro,  
**quiero** desactivar cuentas que ya no uso sin eliminarlas,  
**para** mantener el historial íntegro y evitar que se usen en nuevos asientos.

#### Criterios de aceptación

- [ ] Una cuenta desactivada no aparece en los selectores de cuenta al crear un asiento.
- [ ] Una cuenta desactivada sí aparece en reportes históricos (sus movimientos no se borran).
- [ ] La cuenta puede reactivarse en cualquier momento.

---

### US-03-6 — Eliminar una cuenta

**Como** administrador del libro,  
**quiero** eliminar cuentas que no tienen ningún movimiento,  
**para** mantener el catálogo limpio.

#### Criterios de aceptación

- [ ] Solo se puede eliminar una cuenta si no tiene líneas de asiento asociadas.
- [ ] Si la cuenta tiene movimientos, se muestra un error explicativo (no se puede eliminar, solo desactivar).
- [ ] Si la cuenta tiene subcuentas activas, no se puede eliminar.
- [ ] Se solicita confirmación antes de eliminar.

---

## Reglas de negocio

- Los 5 tipos de cuenta son: `asset` (Activo), `liability` (Pasivo), `equity` (Patrimonio), `income` (Ingreso), `expense` (Gasto).
- El código es un identificador alfanumérico único por libro.
- Una cuenta hija hereda el tipo de su padre; no se puede contradecir la jerarquía.
- Solo cuentas **hoja** (sin hijos y activas) aparecen en el selector de asientos.
- RLS garantiza que solo miembros del libro pueden ver/modificar sus cuentas.

## Notas técnicas

- Seed disparado por `seed_default_accounts(book_id)` dentro de `create_book` (RPC).
- `listAccounts(bookId)` ordena por `code` para renderizado consistente.
- El árbol recursivo se renderiza en `AccountTree.tsx` con indentación por nivel.
- Antes de eliminar, `deleteAccount` verifica referencias en `journal_lines`.
