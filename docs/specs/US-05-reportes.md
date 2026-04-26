# US-05 — Reportes financieros

> **Dominio:** Reports  
> **Fuente:** Fase 07  
> **Estado:** Implementado ✅

---

## Contexto

Los reportes financieros dan visibilidad sobre la situación económica del negocio. Se generan en tiempo real calculando los datos en Postgres a partir de los asientos registrados. El frontend solo se encarga de presentar los datos.

---

## Historias de usuario

### US-05-1 — Balance de Comprobación

**Como** miembro del libro,  
**quiero** ver el balance de comprobación a una fecha de corte,  
**para** verificar que los libros están cuadrados y conocer el saldo de cada cuenta.

#### Criterios de aceptación

- [ ] Existe un selector de fecha de corte ("Al").
- [ ] Se muestran todas las cuentas con movimientos, agrupadas por tipo: Activos, Pasivos, Patrimonio, Ingresos, Gastos.
- [ ] Por cada cuenta se muestra: código, nombre, total débitos, total créditos y saldo neto.
- [ ] Al final de la tabla se muestra el total general de débitos y créditos.
- [ ] Se indica visualmente si el libro está **cuadrado** (total_debit ≈ total_credit, diferencia < 0.01) o desbalanceado.
- [ ] Los montos se muestran convertidos a la moneda base del libro.

---

### US-05-2 — Libro Mayor

**Como** miembro del libro,  
**quiero** ver todos los movimientos de una cuenta específica en un período,  
**para** analizar el historial detallado de esa cuenta con su saldo corriente.

#### Criterios de aceptación

- [ ] Existe un selector de cuenta (lista filtrable del plan de cuentas).
- [ ] Existe un selector de rango de fechas (desde / hasta).
- [ ] Se muestran las líneas del mayor en orden cronológico: fecha, descripción, referencia, débito, crédito, saldo acumulado.
- [ ] Al final se muestra el saldo final de la cuenta en el período.
- [ ] Si la cuenta no tiene movimientos en el período, se muestra un estado vacío descriptivo.

---

### US-05-3 — Estado de Resultados

**Como** miembro del libro,  
**quiero** ver el estado de resultados (P&L) para un período,  
**para** conocer la rentabilidad del negocio en ese lapso.

#### Criterios de aceptación

- [ ] Existe un selector de rango de fechas (desde / hasta).
- [ ] Se presentan dos secciones: **Ingresos** y **Gastos**, con detalle por cuenta.
- [ ] Se muestra el subtotal de cada sección.
- [ ] Al final se muestra el **Resultado Neto** (Ingresos − Gastos), con indicación clara si es positivo (ganancia) o negativo (pérdida).
- [ ] Los montos están en moneda base del libro.

---

### US-05-4 — Balance General

**Como** miembro del libro,  
**quiero** ver el balance general (estado de situación financiera) a una fecha de corte,  
**para** conocer los activos, pasivos y patrimonio del negocio en ese momento.

#### Criterios de aceptación

- [ ] Existe un selector de fecha de corte ("Al").
- [ ] Se presentan tres secciones: **Activos**, **Pasivos** y **Patrimonio**, con detalle por cuenta.
- [ ] Se muestra el subtotal de cada sección.
- [ ] Se verifica la identidad contable: Activos = Pasivos + Patrimonio. Si no cuadra, se muestra una advertencia.
- [ ] Los montos están en moneda base del libro.

---

## Reglas de negocio

- Todos los cálculos ocurren en Postgres mediante funciones RPC (`report_ledger`, `report_trial_balance`, `report_income_statement`, `report_balance_sheet`).
- Los montos de asientos en moneda extranjera se convierten a moneda base multiplicando por el `exchange_rate` congelado en el asiento.
- La diferencia de balance aceptable para considerarse "cuadrado" es menor a 0.01 (errores de redondeo).
- Los reportes incluyen solo cuentas activas con movimientos en el período (excepto el Balance General que incluye saldos acumulados históricos).

## Notas técnicas

- Las funciones RPC están en `supabase/migrations/*_reports_functions.sql`.
- La UI de reportes vive en `src/pages/reports/`.
- `DateRangePicker` y `ExportButton` son componentes compartidos en `src/features/reports/components/`.
- Los reportes de "al cierre" (Trial Balance, Balance General) reciben solo `p_to`; los de período (Mayor, Estado de Resultados) reciben `p_from` y `p_to`.
