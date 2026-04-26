# US-08 — Exportación de datos

> **Dominio:** Exports  
> **Fuente:** Fase 11  
> **Estado:** Implementado ✅

---

## Contexto

Los usuarios necesitan llevar los datos financieros fuera de la aplicación: para imprimir, archivar, análisis externo en Excel o integración con otros sistemas. Todos los reportes y el libro diario son exportables en tres formatos: PDF, Excel y CSV.

---

## Historias de usuario

### US-08-1 — Exportar reporte a PDF

**Como** miembro del libro,  
**quiero** descargar cualquier reporte en formato PDF,  
**para** imprimirlo, archivarlo o compartirlo como documento formal.

#### Criterios de aceptación

- [ ] Cada página de reporte (Balance de Comprobación, Libro Mayor, Estado de Resultados, Balance General, Libro Diario) tiene un botón "Exportar" con opción PDF.
- [ ] El PDF incluye: nombre del libro, título del reporte, período o fecha de corte, fecha de generación.
- [ ] Los datos se presentan en tabla con las mismas columnas que la UI.
- [ ] El PDF incluye numeración de páginas y un pie de página.
- [ ] El botón muestra un indicador de carga mientras se genera el archivo.
- [ ] El archivo se descarga automáticamente con un nombre descriptivo que incluye el reporte y las fechas (ej: `balance-comprobacion_al-2026-04-25.pdf`).

---

### US-08-2 — Exportar reporte a Excel

**Como** miembro del libro,  
**quiero** descargar cualquier reporte en formato Excel (.xlsx),  
**para** hacer análisis adicionales o integrar los datos con otras hojas de cálculo.

#### Criterios de aceptación

- [ ] Cada página de reporte tiene un botón "Exportar" con opción Excel.
- [ ] El archivo contiene al menos una hoja con los datos del reporte (algunos reportes pueden tener múltiples hojas).
- [ ] Los encabezados de columna están en la primera fila.
- [ ] Los montos son valores numéricos (no texto), para facilitar fórmulas en Excel.
- [ ] El nombre del archivo usa la misma convención que el PDF (ej: `diario_2026-01-01_2026-04-25.xlsx`).

---

### US-08-3 — Exportar reporte a CSV

**Como** miembro del libro,  
**quiero** descargar cualquier reporte en formato CSV,  
**para** importar los datos en cualquier herramienta de análisis o sistema contable.

#### Criterios de aceptación

- [ ] Cada página de reporte tiene un botón "Exportar" con opción CSV.
- [ ] El archivo usa codificación UTF-8 con BOM (para compatibilidad con Excel en Windows).
- [ ] Los valores con comas o comillas están correctamente escapados.
- [ ] La primera fila contiene los nombres de las columnas.
- [ ] El nombre del archivo sigue la misma convención.

---

### US-08-4 — Exportar el listado de asientos del diario

**Como** miembro del libro,  
**quiero** exportar los asientos del período visible en el libro diario,  
**para** tener un respaldo o compartirlos con un contador externo.

#### Criterios de aceptación

- [ ] El botón de exportación en la página del libro diario respeta los filtros activos (fechas y búsqueda).
- [ ] El PDF incluye las líneas de cada asiento (cuenta, débito, crédito, memo).
- [ ] El Excel y CSV incluyen una fila por línea de asiento, con los datos del encabezado repetidos en cada fila.

---

## Reglas de negocio

- Los datos exportados **siempre reflejan el estado con los filtros activos** en el momento de la exportación.
- Los montos en los exports están en moneda base del libro (mismo criterio que los reportes en pantalla).
- No se requiere autenticación adicional para exportar; los permisos del libro aplican igual.

## Notas técnicas

- Librería PDF: `@react-pdf/renderer` — renderiza componentes React a PDF en el navegador.
- Librería Excel: `xlsx` (SheetJS) — `XLSX.utils.json_to_sheet` + `XLSX.writeFile`.
- CSV: implementación propia en `src/lib/exporters/csv.ts` con BOM UTF-8.
- Todas las plantillas PDF heredan el layout base `ReportLayout` en `src/lib/exporters/pdf.tsx`.
- El payload de `pdf()` usa `ReactElement<any>` con cast interno a `ReactElement<DocumentProps>` para evitar fricción de tipos con `@react-pdf/renderer`.
- Workbox `maximumFileSizeToCacheInBytes` está en 5MB porque `@react-pdf/renderer` + `xlsx` suman ~2.9MB de bundle.
