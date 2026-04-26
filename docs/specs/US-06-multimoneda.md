# US-06 — Multimoneda

> **Dominio:** Currencies / Exchange Rates  
> **Fuente:** Fase 08  
> **Estado:** Implementado ✅

---

## Contexto

Un negocio puede operar con varias monedas. Cada libro tiene una **moneda base** usada en reportes. Los asientos pueden registrarse en cualquier moneda, acompañados del tipo de cambio vigente al momento de la transacción. El tipo de cambio queda congelado en el asiento para preservar la integridad histórica.

---

## Historias de usuario

### US-06-1 — Ver tipos de cambio del libro

**Como** miembro del libro,  
**quiero** ver el historial de tipos de cambio registrados,  
**para** saber qué tasas se usaron en distintas fechas.

#### Criterios de aceptación

- [ ] Se muestra una tabla con: moneda origen, moneda destino, tasa y fecha.
- [ ] Se pueden filtrar por moneda.
- [ ] Los registros se muestran en orden cronológico descendente.

---

### US-06-2 — Registrar un tipo de cambio

**Como** administrador o editor del libro,  
**quiero** registrar o actualizar el tipo de cambio entre dos monedas en una fecha,  
**para** que los asientos en esa moneda puedan usar la tasa correcta.

#### Criterios de aceptación

- [ ] El formulario solicita: moneda origen, moneda destino, tasa, fecha.
- [ ] Si ya existe una tasa para esa combinación de monedas y fecha, se actualiza (upsert).
- [ ] La tasa debe ser un número positivo mayor a 0.
- [ ] La operación es posible solo para usuarios con rol `admin` o `editor`.

---

### US-06-3 — Usar moneda extranjera en un asiento

**Como** editor del libro,  
**quiero** registrar un asiento en una moneda distinta a la base del libro,  
**para** documentar transacciones en divisas extranjeras.

#### Criterios de aceptación

- [ ] En el formulario de asiento, el selector de moneda lista todas las monedas disponibles.
- [ ] Si la moneda elegida difiere de la moneda base del libro, aparece el campo "Tipo de cambio".
- [ ] El campo de tipo de cambio se precarga automáticamente con la tasa más reciente para esa moneda y fecha del asiento.
- [ ] El usuario puede ajustar manualmente el tipo de cambio.
- [ ] Se muestra un texto informativo indicando la equivalencia (ej: "1 USD = 27.50 HNL según tasa del 15/01/2026").
- [ ] Si la moneda es igual a la base, el campo de tipo de cambio se oculta y se fija en `1`.
- [ ] El tipo de cambio se guarda junto al asiento y no se modifica si la tasa cambia en el futuro.

---

### US-06-4 — Reportes en moneda base

**Como** miembro del libro,  
**quiero** que todos los reportes muestren los montos convertidos a la moneda base,  
**para** tener una visión unificada de las finanzas independientemente de la moneda de cada asiento.

#### Criterios de aceptación

- [ ] El Balance de Comprobación, Mayor, Estado de Resultados y Balance General muestran montos en moneda base.
- [ ] La conversión usa el `exchange_rate` congelado en cada asiento (no la tasa actual).
- [ ] Los conceptos del reporte indican la moneda base del libro.

---

## Reglas de negocio

- El tipo de cambio en un asiento es **inmutable** una vez guardado.
- La búsqueda de tasa vigente selecciona la más reciente con `rate_date <= entry_date` para la combinación de monedas.
- Si `from_currency == to_currency`, la tasa es implícitamente 1 (sin necesidad de registro).
- Los reportes multiplican los montos de asiento por `exchange_rate` para obtener la equivalencia en moneda base.

## Notas técnicas

- Tablas involucradas: `currencies`, `exchange_rates`.
- `getRateForDate(bookId, from, to, date)` busca la tasa más reciente ≤ fecha dada.
- La conversión en reportes ocurre directamente en las funciones SQL RPC (`jl.debit * je.exchange_rate`).
- UI en `src/pages/currencies/ExchangeRatesPage.tsx`.
