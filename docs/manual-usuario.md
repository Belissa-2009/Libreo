# Manual de Usuario — Libreo

> Versión actual del proyecto. Última actualización: abril 2026.

---

## Tabla de contenidos

1. [Introducción](#1-introducción)
2. [Primeros pasos](#2-primeros-pasos)
   - 2.1 [Crear una cuenta](#21-crear-una-cuenta)
   - 2.2 [Iniciar sesión](#22-iniciar-sesión)
   - 2.3 [Recuperar contraseña](#23-recuperar-contraseña)
3. [Libros contables](#3-libros-contables)
   - 3.1 [Crear un libro](#31-crear-un-libro)
   - 3.2 [Seleccionar el libro activo](#32-seleccionar-el-libro-activo)
   - 3.3 [Configuración del libro](#33-configuración-del-libro)
   - 3.4 [Miembros e invitaciones](#34-miembros-e-invitaciones)
4. [Plan de cuentas](#4-plan-de-cuentas)
   - 4.1 [Ver el plan de cuentas](#41-ver-el-plan-de-cuentas)
   - 4.2 [Crear una cuenta](#42-crear-una-cuenta)
   - 4.3 [Editar o eliminar una cuenta](#43-editar-o-eliminar-una-cuenta)
5. [Libro diario (asientos)](#5-libro-diario-asientos)
   - 5.1 [Ver los asientos](#51-ver-los-asientos)
   - 5.2 [Crear un asiento](#52-crear-un-asiento)
   - 5.3 [Editar un asiento](#53-editar-un-asiento)
   - 5.4 [Eliminar un asiento](#54-eliminar-un-asiento)
6. [Reportes](#6-reportes)
   - 6.1 [Balance de Comprobación](#61-balance-de-comprobación)
   - 6.2 [Libro Mayor](#62-libro-mayor)
   - 6.3 [Estado de Resultados](#63-estado-de-resultados)
   - 6.4 [Balance General](#64-balance-general)
7. [Exportación de datos](#7-exportación-de-datos)
8. [Préstamos](#8-préstamos)
   - 8.1 [Registrar un préstamo](#81-registrar-un-préstamo)
   - 8.2 [Ver el detalle del préstamo](#82-ver-el-detalle-del-préstamo)
   - 8.3 [Pagar una cuota](#83-pagar-una-cuota)
   - 8.4 [Hacer un abono extraordinario](#84-hacer-un-abono-extraordinario)
9. [Monedas y tipos de cambio](#9-monedas-y-tipos-de-cambio)
10. [Instalación como aplicación (PWA)](#10-instalación-como-aplicación-pwa)
11. [Roles y permisos](#11-roles-y-permisos)
12. [Perfil y preferencias del sistema](#12-perfil-y-preferencias-del-sistema)
    - 12.1 [Ver y editar el perfil](#121-ver-y-editar-el-perfil)
    - 12.2 [Configurar la divisa por defecto](#122-configurar-la-divisa-por-defecto)
13. [Preguntas frecuentes](#13-preguntas-frecuentes)

---

## 1. Introducción

**Libreo** es una aplicación contable de partida doble diseñada para pequeños negocios y particulares. Permite registrar transacciones financieras, gestionar múltiples libros contables con distintos colaboradores, generar reportes financieros estándar y administrar préstamos con su tabla de amortización.

Funciona completamente en el navegador y puede instalarse como aplicación en tu teléfono o computadora (PWA), sin necesidad de descargar nada desde una tienda.

---

## 2. Primeros pasos

### 2.1 Crear una cuenta

1. Abre la aplicación en tu navegador.
2. Haz clic en **"Crear cuenta"**.
3. Ingresa tu **correo electrónico** y una **contraseña** (mínimo 6 caracteres).
4. Confirma la contraseña y presiona **"Registrarse"**.
5. Revisa tu correo: recibirás un enlace de confirmación. Haz clic en él para activar tu cuenta.

### 2.2 Iniciar sesión

1. Ingresa tu **correo** y **contraseña** registrados.
2. Haz clic en **"Iniciar sesión"**.
3. Si las credenciales son correctas, serás redirigido a la pantalla principal.

### 2.3 Recuperar contraseña

1. En la pantalla de inicio de sesión, haz clic en **"¿Olvidaste tu contraseña?"**.
2. Ingresa tu correo electrónico y presiona **"Enviar enlace"**.
3. Revisa tu bandeja de entrada y haz clic en el enlace recibido.
4. Define una nueva contraseña y guarda los cambios.

---

## 3. Libros contables

Un **libro** es el contenedor principal de toda la información contable: cuentas, asientos, reportes y préstamos. Puedes tener múltiples libros (por ejemplo, uno por empresa o proyecto) y compartirlos con colaboradores.

### 3.1 Crear un libro

1. Ve a **Libros** en el menú lateral.
2. Haz clic en **"Nuevo libro"**.
3. Ingresa:
   - **Nombre** del libro.
   - **Moneda base** (se usará como moneda predeterminada para todos los asientos).
4. Haz clic en **"Crear"**.

### 3.2 Seleccionar el libro activo

La aplicación trabaja siempre sobre un **libro activo**. Para cambiarlo:

- En el encabezado superior encontrarás un selector de libro. Haz clic sobre él y elige el libro deseado.

Todas las secciones (asientos, cuentas, reportes, préstamos) mostrarán datos del libro activo seleccionado.

### 3.3 Configuración del libro

1. Ve a **Libros** y haz clic en los **"..."** o en el nombre del libro para acceder a su configuración.
2. Desde allí puedes:
   - Cambiar el **nombre** del libro.
   - Cambiar la **moneda base**.
   - Copiar el **ID del libro** (útil para soporte técnico).
   - **Eliminar** el libro (acción irreversible; solo disponible para administradores).

### 3.4 Miembros e invitaciones

Cada libro puede tener múltiples usuarios con distintos roles.

**Para invitar a alguien:**
1. Entra a la configuración del libro.
2. En la sección **"Miembros"**, haz clic en **"Invitar"**.
3. Introduce el correo del colaborador y selecciona su rol (ver [sección 11](#11-roles-y-permisos)).
4. El colaborador recibirá un correo con un enlace de invitación.

**Para aceptar una invitación:**
1. Haz clic en el enlace del correo de invitación.
2. Si no tienes cuenta, créala primero.
3. Serás agregado automáticamente al libro con el rol asignado.

**Para revocar una invitación pendiente:**
- En la sección de miembros, localiza la invitación y haz clic en el ícono de eliminar.

---

## 4. Plan de cuentas

El **plan de cuentas** es la lista estructurada de todas las cuentas disponibles para registrar transacciones. Cada cuenta tiene un código, un nombre y un tipo contable.

### 4.1 Ver el plan de cuentas

1. Selecciona un libro activo.
2. Ve a **"Cuentas"** en el menú lateral.
3. Las cuentas se muestran agrupadas por tipo: **Activos, Pasivos, Patrimonio, Ingresos y Gastos**.

### 4.2 Crear una cuenta

1. Desde la página de cuentas, haz clic en **"Nueva cuenta"**.
2. Completa los campos:
   - **Código**: identificador numérico (ej. `1101`).
   - **Nombre**: descripción de la cuenta (ej. `Caja general`).
   - **Tipo**: Activo, Pasivo, Patrimonio, Ingreso o Gasto.
   - **Cuenta padre** (opcional): para organizar en jerarquía.
   - **Descripción** (opcional).
3. Haz clic en **"Guardar"**.

### 4.3 Editar o eliminar una cuenta

- Haz clic en el ícono de edición (lápiz) junto a la cuenta para modificar su nombre, código o descripción.
- Para eliminar, usa el ícono de papelera. Solo es posible eliminar cuentas que **no tengan asientos** registrados.

---

## 5. Libro diario (asientos)

El **libro diario** registra todas las transacciones financieras como asientos de partida doble. Cada asiento debe tener el total de débitos igual al total de créditos.

### 5.1 Ver los asientos

1. Ve a **"Libro diario"** en el menú lateral.
2. Los asientos se muestran en orden cronológico descendente.
3. Usa los filtros disponibles para acotar los resultados:
   - **Fecha desde / hasta**: restringe el rango de fechas.
   - **Búsqueda**: filtra por descripción o referencia.
4. Navega entre páginas si hay más de 50 asientos.

### 5.2 Crear un asiento

1. Haz clic en **"Nuevo asiento"**.
2. Completa el encabezado:
   - **Fecha**: fecha de la transacción.
   - **Descripción**: breve descripción (ej. `Pago de alquiler`).
   - **Referencia** (opcional): número de factura, recibo, etc.
   - **Moneda**: moneda del asiento (puede diferir de la moneda base).
   - **Tipo de cambio** (si la moneda es distinta a la base).
3. Agrega al menos **dos líneas** de detalle:
   - Selecciona la **cuenta**.
   - Ingresa el monto en la columna **Debe** o **Haber** (solo una de las dos por línea).
4. Verifica que el indicador de balance muestre **"Cuadrado"** (total débito = total crédito).
5. Haz clic en **"Guardar asiento"**.

> **Nota:** el sistema no permitirá guardar un asiento si los débitos y créditos no están balanceados.

### 5.3 Editar un asiento

1. En el listado del libro diario, haz clic en el asiento que deseas modificar.
2. Realiza los cambios necesarios (fecha, descripción, líneas).
3. Confirma que el asiento sigue balanceado y haz clic en **"Guardar"**.

### 5.4 Eliminar un asiento

1. En el listado, haz clic en el ícono de eliminar (papelera) del asiento correspondiente.
2. Confirma la acción en el diálogo de confirmación.

> Solo usuarios con rol **admin** o **editor** pueden crear, editar o eliminar asientos.

---

## 6. Reportes

Los reportes se generan dinámicamente a partir de los asientos registrados. Todos incluyen un selector de período y un botón de exportación.

### 6.1 Balance de Comprobación

**Ruta:** Reportes → Balance de Comprobación

Muestra el total de débitos, créditos y saldo de cada cuenta hasta la fecha seleccionada.

- Usa el campo **"Al"** para definir la fecha de corte.
- Las cuentas se agrupan por tipo.
- Al final se muestra el **total general** y se indica si el libro está **cuadrado**.

### 6.2 Libro Mayor

**Ruta:** Reportes → Libro Mayor

Muestra todos los movimientos de una cuenta específica en un período, incluyendo el saldo acumulado.

- Selecciona la **cuenta** que deseas analizar.
- Define el rango **Desde / Hasta**.
- Cada fila muestra: fecha, descripción, referencia, débito, crédito y saldo corriente.
- Al final aparece el **saldo final** de la cuenta.

### 6.3 Estado de Resultados

**Ruta:** Reportes → Estado de Resultados

Resumen de ingresos y gastos para un período determinado.

- Define el rango **Desde / Hasta**.
- Se presentan dos secciones: **Ingresos** y **Gastos**.
- Al final se muestra el **Resultado Neto** (ingresos − gastos).

### 6.4 Balance General

**Ruta:** Reportes → Balance General

Estado de situación financiera al cierre de un período.

- Define la fecha de corte **"Al"**.
- Se presentan tres secciones: **Activos**, **Pasivos** y **Patrimonio**.
- Incluye verificación de la identidad contable: Activos = Pasivos + Patrimonio.

---

## 7. Exportación de datos

Todos los reportes y el libro diario cuentan con un botón **"Exportar"** que despliega tres opciones:

| Formato | Descripción |
|---------|-------------|
| **PDF** | Documento listo para imprimir con encabezado, nombre del libro y paginación. |
| **Excel (.xlsx)** | Hoja de cálculo editable compatible con Microsoft Excel y Google Sheets. |
| **CSV** | Archivo de texto separado por comas, compatible con cualquier herramienta. |

**Para exportar:**
1. Aplica los filtros o el período deseado en el reporte.
2. Haz clic en **"Exportar"** (ícono de descarga en la esquina superior derecha).
3. Selecciona el formato.
4. El archivo se descargará automáticamente con un nombre descriptivo que incluye las fechas del período.

---

## 8. Préstamos

El módulo de préstamos permite registrar y dar seguimiento a obligaciones financieras con amortización francesa (cuota fija mensual).

### 8.1 Registrar un préstamo

1. Ve a **"Préstamos"** en el menú lateral.
2. Haz clic en **"Nuevo préstamo"**.
3. Completa el formulario:
   - **Tipo**: `Recibido` (el negocio debe dinero) u `Otorgado` (el negocio prestó dinero).
   - **Contraparte**: nombre del banco, persona o entidad.
   - **Capital**: monto original del préstamo.
   - **Tasa anual (%)**: tasa de interés anual.
   - **Plazo (meses)**: duración del préstamo.
   - **Fecha de inicio**: fecha del primer desembolso.
   - **Divisa**: moneda en la que se pactó el préstamo (por defecto usa tu divisa configurada en el perfil).
   - **Cuenta de interés**: cuenta contable donde se registran los intereses.
   - **Cuenta de caja/banco**: cuenta de donde salen o entran los pagos.
   - **Notas** (opcional).
4. Haz clic en **"Crear préstamo"**.

El sistema calculará automáticamente la tabla de amortización con cuota fija (método francés).

### 8.2 Ver el detalle del préstamo

Desde la lista de préstamos, haz clic en cualquier tarjeta para acceder al detalle. Verás:

- **KPIs**: capital original, saldo pendiente, interés total acumulado, cuotas pagadas vs. totales.
- Pestaña **"Amortización"**: tabla completa con número de cuota, fecha de vencimiento, cuota total, porción de capital, porción de interés y estado.
- Pestaña **"Pagos"**: historial de pagos efectuados con fecha real.

### 8.3 Pagar una cuota

1. En la tabla de amortización, localiza la cuota a pagar.
2. Haz clic en el botón **"Pagar"** en la fila correspondiente.
3. Confirma o ajusta la **fecha de pago** real.
4. Confirma el pago. El sistema registrará el asiento contable automáticamente.

> Solo se puede pagar la primera cuota pendiente en secuencia (no se puede saltar cuotas).

### 8.4 Hacer un abono extraordinario

Un abono extraordinario reduce el capital pendiente fuera del calendario normal.

1. En el detalle del préstamo, haz clic en **"Abono extra"**.
2. Define el **monto** del abono.
3. Selecciona la **estrategia**:
   - **Reducir plazo**: mantiene la cuota y acorta el número de meses.
   - **Reducir cuota**: mantiene el plazo y disminuye el monto de cada cuota.
4. Haz clic en **"Vista previa"** para ver cómo cambia la tabla de amortización.
5. Confirma con **"Aplicar abono"**. Se generará una nueva versión de la tabla.

---

## 9. Monedas y tipos de cambio

La aplicación soporta múltiples monedas para registrar asientos en divisas distintas a la moneda base del libro.

**Para gestionar tipos de cambio:**

1. Ve a **"Tipos de cambio"** en el menú lateral (o desde la configuración del libro).
2. Verás la lista de monedas disponibles con su tasa respecto a la moneda base.
3. Para actualizar una tasa:
   - Ingresa el nuevo valor en el campo correspondiente.
   - Haz clic en **"Guardar"**.

**Al crear un asiento en moneda extranjera:**
- Selecciona la moneda en el formulario del asiento.
- El sistema mostrará el tipo de cambio vigente.
- Puedes ajustar el tipo de cambio manualmente si lo necesitas para esa transacción específica.

---

## 10. Instalación como aplicación (PWA)

La aplicación puede instalarse en tu dispositivo para usarla sin necesidad de abrir el navegador cada vez.

### En escritorio (Chrome / Edge)

1. Abre la aplicación en el navegador.
2. Aparecerá un aviso en la parte inferior de la pantalla: **"Instalar Libreo"**. Haz clic en **"Instalar"**.
3. También puedes instalarlo desde el ícono de instalación en la barra de direcciones del navegador.

### En móvil (Android)

1. Abre la aplicación en Chrome.
2. Aparecerá un banner en la parte inferior. Toca **"Instalar"**.
3. La aplicación se agregará a tu pantalla de inicio como cualquier otra app.

### En móvil (iOS / Safari)

1. Abre la aplicación en Safari.
2. Toca el botón de compartir (ícono de caja con flecha hacia arriba).
3. Selecciona **"Agregar a pantalla de inicio"**.
4. Confirma el nombre y toca **"Agregar"**.

### Actualizaciones automáticas

Cuando hay una nueva versión disponible, verás una notificación en la parte inferior de la pantalla. Toca **"Recargar"** para aplicar la actualización.

---

## 11. Roles y permisos

Cada miembro de un libro tiene asignado uno de tres roles:

| Rol | Puede ver | Puede crear/editar | Puede eliminar | Puede invitar miembros | Puede eliminar el libro |
|-----|-----------|-------------------|----------------|------------------------|------------------------|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **editor** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

- El **creador** del libro es automáticamente administrador.
- Un administrador puede cambiar el rol de cualquier miembro o removerlo del libro.
- Un **viewer** puede consultar todos los reportes y exportar datos, pero no puede modificar nada.

---

## 12. Perfil y preferencias del sistema

Desde la sección de perfil puedes actualizar tus datos personales y configurar el comportamiento del sistema a tu gusto.

**Para acceder:** haz clic en el ícono de usuario (**Perfil**) en el menú lateral o en la barra de navegación inferior (en móvil).

### 12.1 Ver y editar el perfil

El segmento **Perfil** muestra:

- **Correo electrónico**: el correo con el que creaste tu cuenta (solo lectura).
- **Nombre completo**: editable. Ingresa el nuevo nombre y haz clic en **"Guardar cambios"**.
- **Cerrar sesión**: botón para terminar la sesión actual.

### 12.2 Configurar la divisa por defecto

El segmento **Configuración** permite definir qué divisa se pre-selecciona en todos los formularios del sistema (asientos, préstamos, tipos de cambio).

1. En el selector **"Divisa por defecto"**, elige la moneda que uses con mayor frecuencia:
   - **DOP** — Peso dominicano *(selección predeterminada para cuentas nuevas)*
   - **USD** — Dólar estadounidense
2. Haz clic en **"Guardar preferencias"**.
3. Aparecerá un mensaje de confirmación: *"Preferencias guardadas"*.

A partir de ese momento, cualquier formulario con campo de divisa abrirá con la moneda que configuraste. Siempre puedes cambiarla manualmente dentro de cada formulario sin que eso modifique tu preferencia global.

> **Nota:** cambiar la divisa por defecto no afecta los registros ya creados, solo el valor inicial de los formularios futuros.

---

## 13. Preguntas frecuentes

**¿Puedo tener varios libros para distintas empresas?**
Sí. Puedes crear tantos libros como necesites. Cada libro es completamente independiente.

**¿Puedo usar una moneda distinta al lempira?**
Sí. Al crear el libro defines la moneda base. Al registrar asientos puedes usar cualquier moneda adicional y especificar el tipo de cambio.

**¿Qué pasa si elimino un asiento por error?**
La eliminación es permanente. Se recomienda verificar antes de confirmar. Si tienes copias de seguridad en Excel o PDF (exportadas previamente), podrás recuperar la información.

**¿Los datos están seguros?**
Sí. Todos los datos se almacenan en Supabase con cifrado en tránsito (HTTPS) y en reposo. Cada usuario solo accede a los datos de los libros a los que fue invitado, gracias a las políticas de Row Level Security en la base de datos.

**¿Funciona sin conexión a internet?**
La aplicación requiere conexión para leer y guardar datos. Sin embargo, al estar instalada como PWA cargará más rápido y mostrará una pantalla de error si no hay conexión en lugar de una página en blanco.

**¿Puedo exportar todos mis datos?**
Sí. Cada reporte (libro diario, balance de comprobación, libro mayor, estado de resultados, balance general) se puede exportar a PDF, Excel o CSV desde el botón **"Exportar"** en cada pantalla.

**¿Cómo se calcula la amortización de los préstamos?**
Se usa el **método francés** (cuota fija): cada cuota tiene el mismo monto total, pero la proporción entre capital e interés varía — al inicio se paga más interés y con el tiempo se paga más capital.

**¿Puedo cambiar el correo electrónico de mi cuenta?**
Actualmente el correo se gestiona directamente en Supabase Auth. Desde la sección **Perfil** puedes ver tu correo registrado, pero para cambiarlo debes contactar al administrador del sistema.

**¿Puedo tener una divisa por defecto distinta al peso dominicano?**
Sí. Ve a **Perfil → Configuración**, elige la divisa que prefieras y guarda. Esa divisa se pre-seleccionará en todos los formularios. Consulta la [sección 12.2](#122-configurar-la-divisa-por-defecto) para más detalles.
