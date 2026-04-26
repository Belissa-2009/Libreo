# US-04 — Libro diario (asientos)

> **Dominio:** Journal  
> **Fuente:** Fase 06  
> **Estado:** Implementado ✅

---

## Contexto

El **libro diario** es el corazón de la aplicación. Registra todas las transacciones financieras como asientos de partida doble: cada asiento tiene dos o más líneas cuya suma de débitos debe ser exactamente igual a la suma de créditos. Esta invariante se valida tanto en el frontend (UX inmediata) como en el backend (trigger de Postgres).

---

## Historias de usuario

### US-04-1 — Ver el listado de asientos

**Como** miembro del libro (cualquier rol),  
**quiero** ver todos los asientos del libro diario con sus datos principales,  
**para** tener una visión general de las transacciones registradas.

#### Criterios de aceptación

- [ ] Los asientos se muestran en orden cronológico descendente (más reciente primero).
- [ ] Cada asiento muestra: fecha, descripción, referencia, moneda y total débito.
- [ ] Se pueden ver las líneas de detalle de cada asiento (cuenta, débito/crédito, memo).
- [ ] Si no hay asientos, se muestra un estado vacío.
- [ ] La lista soporta paginación (50 asientos por página).

---

### US-04-2 — Filtrar asientos

**Como** miembro del libro,  
**quiero** filtrar los asientos por fecha y texto,  
**para** encontrar transacciones específicas rápidamente.

#### Criterios de aceptación

- [ ] Se puede filtrar por rango de fechas (desde / hasta).
- [ ] Se puede buscar por texto en descripción o referencia.
- [ ] Al cambiar los filtros, la lista se actualiza automáticamente.
- [ ] Al limpiar los filtros, vuelve a mostrar todos los asientos.

---

### US-04-3 — Crear un asiento

**Como** administrador o editor del libro,  
**quiero** registrar un nuevo asiento de partida doble,  
**para** documentar una transacción financiera.

#### Criterios de aceptación

- [ ] El formulario solicita en el encabezado: fecha (requerida), descripción (requerida), referencia (opcional), moneda, tipo de cambio.
- [ ] Se pueden agregar dos o más líneas de detalle.
- [ ] Cada línea solicita: cuenta (selector del catálogo), monto en Debe o Haber (solo uno de los dos), memo (opcional).
- [ ] El formulario muestra en tiempo real el total del Debe y el Haber, y señala si están balanceados.
- [ ] No se puede guardar si el total débito ≠ total crédito.
- [ ] No se puede guardar si hay menos de 2 líneas.
- [ ] No se puede guardar si alguna línea no tiene cuenta seleccionada o monto mayor a cero.
- [ ] Al guardar con éxito, aparece una notificación y el usuario vuelve al listado.
- [ ] El backend también valida el balance (trigger `validate_balanced_entry`); si el trigger rechaza, el error se muestra al usuario.

---

### US-04-4 — Editar un asiento

**Como** administrador o editor del libro,  
**quiero** modificar un asiento existente,  
**para** corregir errores en la información registrada.

#### Criterios de aceptación

- [ ] Desde el listado, se puede acceder a la edición de cualquier asiento.
- [ ] El formulario precarga todos los datos del asiento (encabezado y líneas).
- [ ] Se pueden agregar, modificar o eliminar líneas.
- [ ] Las mismas validaciones de balance aplican que al crear.
- [ ] Al guardar, las líneas antiguas se reemplazan completamente por las nuevas (en transacción).
- [ ] Solo usuarios con rol `admin` o `editor` ven el botón de editar.

---

### US-04-5 — Eliminar un asiento

**Como** administrador o editor del libro,  
**quiero** eliminar un asiento incorrecto,  
**para** corregir el registro contable.

#### Criterios de aceptación

- [ ] Se solicita confirmación antes de eliminar.
- [ ] Al eliminar, el asiento y todas sus líneas desaparecen de la lista.
- [ ] Los reportes se actualizan automáticamente (ya no consideran ese asiento).
- [ ] La operación es irreversible.
- [ ] Solo usuarios con rol `admin` o `editor` pueden eliminar.

---

## Reglas de negocio

- **Invariante de partida doble**: `SUM(debit) = SUM(credit)` en toda transacción. Validado en 2 capas: frontend y trigger de Postgres.
- Cada línea tiene **débito O crédito**, nunca ambos en la misma línea.
- Un asiento mínimo tiene 2 líneas.
- La `entry_date` es la fecha de la transacción real (no la de creación del registro).
- Los montos se almacenan en `NUMERIC(18,4)` para evitar errores de punto flotante.
- El tipo de cambio queda **congelado** en el asiento en el momento de la creación.

## Notas técnicas

- La creación y edición usan las funciones RPC `create_journal_entry` / `update_journal_entry` (transacciones atómicas).
- El trigger `validate_balanced_entry` es `DEFERRED` y se ejecuta al `COMMIT`.
- Los asientos con líneas se consultan como `EntryWithLines = JournalEntry & { journal_lines: JournalLine[] }`.
- `JournalEntry` no tiene campo `total_debit`; se calcula con `journal_lines.reduce(...)`.
- La moneda del asiento se almacena en `currency_code` (no `currency`).
