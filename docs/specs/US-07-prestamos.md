# US-07 — Préstamos y amortización

> **Dominio:** Loans  
> **Fuente:** Fase 09  
> **Estado:** Implementado ✅

---

## Contexto

El módulo de préstamos permite registrar obligaciones financieras (recibidas u otorgadas) con su tabla de amortización calculada usando el **método francés** (cuota fija). El sistema genera automáticamente los asientos contables al pagar cada cuota y permite realizar abonos extraordinarios al capital con dos estrategias de recálculo.

---

## Historias de usuario

### US-07-1 — Registrar un préstamo

**Como** editor o administrador del libro,  
**quiero** registrar un préstamo con sus condiciones financieras,  
**para** llevar el control de las cuotas y los asientos contables asociados.

#### Criterios de aceptación

- [ ] El formulario solicita:
  - Tipo: `Recibido` (el negocio debe dinero) u `Otorgado` (el negocio prestó dinero).
  - Contraparte: nombre del banco, persona o entidad.
  - Divisa (`currency_code`): moneda del préstamo (DOP o USD); requerida al crear el préstamo.
  - Capital: monto principal del préstamo (número positivo).
  - Tasa (%): tasa de interés correspondiente al período seleccionado.
  - Periodicidad de la tasa: diaria, semanal, quincenal o mensual.
  - Plazo (meses): duración total.
  - Fecha de inicio: fecha del primer desembolso.
  - Cuenta de interés: cuenta contable para registrar los intereses.
  - Cuenta de caja/banco: cuenta de donde fluye el dinero.
  - Notas (opcional).
- [ ] Al guardar, se calcula y almacena automáticamente la tabla de amortización completa (método francés).
- [ ] El usuario es redirigido al detalle del préstamo recién creado.

---

### US-07-2 — Ver lista de préstamos

**Como** miembro del libro,  
**quiero** ver todos los préstamos del libro en forma de tarjetas,  
**para** tener una visión rápida de los compromisos financieros vigentes.

#### Criterios de aceptación

- [ ] Se muestra una tarjeta por préstamo con: contraparte, tipo, capital original, saldo pendiente, próxima cuota y barra de progreso de pagos.
- [ ] Si no hay préstamos, se muestra un estado vacío.
- [ ] Cada tarjeta es un enlace al detalle del préstamo.

---

### US-07-3 — Ver el detalle del préstamo

**Como** miembro del libro,  
**quiero** ver los KPIs y la tabla de amortización de un préstamo,  
**para** entender el estado actual y los pagos futuros.

#### Criterios de aceptación

- [ ] Se muestran 4 KPIs: capital original, saldo pendiente, interés total acumulado, cuotas pagadas / total.
- [ ] Pestaña **Amortización**: tabla con columnas de número de cuota, fecha de vencimiento, cuota total, capital, interés, saldo restante y estado (pendiente / pagado).
- [ ] Pestaña **Pagos**: historial de cuotas efectivamente pagadas con la fecha real de pago.
- [ ] El tipo del préstamo (Recibido / Otorgado) se muestra con un badge de color diferenciado.

---

### US-07-4 — Pagar una cuota del calendario

**Como** editor o administrador del libro,  
**quiero** registrar el pago de una cuota del préstamo,  
**para** actualizar el estado del préstamo y generar el asiento contable automáticamente.

#### Criterios de aceptación

- [ ] Solo se puede pagar la siguiente cuota pendiente en secuencia (no se puede saltar cuotas).
- [ ] El sistema solicita confirmar la fecha de pago real (puede diferir de la fecha de vencimiento).
- [ ] Al confirmar, se crea automáticamente el asiento contable correspondiente (débito a préstamos por pagar / crédito a caja, según el tipo).
- [ ] La cuota queda marcada como pagada en la tabla de amortización.
- [ ] Los KPIs se actualizan inmediatamente.

---

### US-07-5 — Realizar un abono extraordinario

**Como** editor o administrador del libro,  
**quiero** aplicar un pago adicional al capital fuera del calendario regular,  
**para** reducir la deuda anticipadamente y recalcular la amortización.

#### Criterios de aceptación

- [ ] Se puede acceder al diálogo de abono extraordinario desde el detalle del préstamo.
- [ ] El formulario solicita: monto del abono y estrategia de recálculo.
  - **Reducir plazo**: mantiene la cuota fija y acorta el número de meses.
  - **Reducir cuota**: mantiene el plazo y disminuye el monto de cada cuota.
- [ ] El monto del abono debe ser positivo y menor al saldo pendiente.
- [ ] Se puede previsualizar cómo cambia la tabla antes de confirmar.
- [ ] Al confirmar, se genera una nueva versión de la tabla de amortización.
- [ ] La versión anterior queda archivada (solo se muestra la versión activa más reciente).

---

## Reglas de negocio

- El método de amortización es siempre **francés** (cuota fija): `PMT = P × i / (1 - (1+i)^-n)`.
- La última cuota se ajusta para que el saldo quede exactamente en 0.
- Los asientos contables de pago se generan automáticamente usando las cuentas configuradas en el préstamo.
- Las tablas de amortización tienen versiones; solo la versión más alta (`version = MAX`) es la activa.
- Cuando el plazo llega a 0 por abono extra con estrategia "reducir plazo", el préstamo se considera liquidado.

## Notas técnicas

- Funciones SQL: `french_installment`, `generate_loan_schedule`, `preview_extra_payment`, `pay_loan_installment`, `apply_extra_payment`.
- Tablas: `loans`, `loan_schedule`, `loan_payments`.
- UI: `LoansPage`, `NewLoanPage`, `LoanDetailPage`, componentes `LoanCard`, `ScheduleTable`, `ExtraPaymentDialog`.
- **Divisas:**
  - `loans.currency_code`: TEXT NOT NULL DEFAULT 'DOP'. Indica la moneda en que está denominado el préstamo. Requerida al crear.
  - `loan_schedule.currency_code`: TEXT NULLABLE (FK → `currencies.code`). Permite registrar la moneda real de cada cuota del calendario; NULL indica que hereda la del préstamo.
  - `loan_payments.currency_code`: TEXT NULLABLE (FK → `currencies.code`). Permite registrar la moneda real del pago efectuado; NULL indica que hereda la del préstamo.
- **Tasas:** la interfaz recibe la tasa del período seleccionado y la normaliza internamente a una tasa anual para conservar compatibilidad con el esquema y las funciones SQL existentes.
