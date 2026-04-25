# Fase 11 — Exportación PDF, Excel y CSV

## Goal
Cada reporte (Mayor, Balance de Comprobación, Estado de Resultados, Balance General) se puede descargar en PDF, Excel y CSV. También exportar el listado de asientos del periodo.

## Prerequisites
- Fase 07 completada (reportes funcionando).

## Steps

### 1. Dependencias

```bash
npm install @react-pdf/renderer xlsx
```

### 2. Helpers genéricos

`src/lib/exporters/csv.ts`:
- `toCsv(rows: Record<string, unknown>[]): string` — escapa comillas, separa con coma.
- `downloadCsv(filename, content)` → crea Blob y dispara descarga.

`src/lib/exporters/xlsx.ts`:
- `downloadXlsx(filename, sheets: { name: string, rows: Record<string, unknown>[] }[])` — usa SheetJS.

`src/lib/exporters/pdf.tsx` (sí, `.tsx` por JSX de react-pdf):
- Componente base `<ReportLayout title subtitle children />` con header, fecha de generación, footer numerado.
- Función `downloadPdf(filename, document)` que renderiza con `pdf(<Doc/>).toBlob()`.

### 3. PDF por reporte

Una plantilla PDF por reporte:
- `src/features/reports/exporters/TrialBalancePdf.tsx`
- `src/features/reports/exporters/IncomeStatementPdf.tsx`
- `src/features/reports/exporters/BalanceSheetPdf.tsx`
- `src/features/reports/exporters/LedgerPdf.tsx`
- `src/features/journal/exporters/JournalListPdf.tsx`

Cada uno recibe `{ book, fromDate, toDate, data }` y renderiza tabla con totales.

### 4. Excel por reporte

Cada reporte tiene un helper `to<Report>Sheet(data)` que devuelve `{ name, rows }` para `downloadXlsx`. Un solo workbook puede contener varias hojas (ej: Estado de Resultados con hoja "Detalle" + hoja "Resumen").

### 5. CSV

Reportes simples van directo a `toCsv`. El Mayor tiene una columna por línea, fácil.

### 6. UI: botones de exportación

En cada página de reporte, agrega un dropdown "Exportar" (shadcn `DropdownMenu`) con tres ítems: PDF, Excel, CSV.

Componente reutilizable `src/features/reports/components/ExportButton.tsx`:

```tsx
<ExportButton
  filenameBase={`balance-comprobacion_${fromDate}_${toDate}`}
  pdf={() => downloadPdf(..., <TrialBalancePdf .../>)}
  xlsx={() => downloadXlsx(..., [toTrialBalanceSheet(data)])}
  csv={() => downloadCsv(..., toCsv(data))}
/>
```

### 7. Naming convention de archivos

- `mayor_<account-code>_<from>_<to>.pdf`
- `balance-comprobacion_al-<date>.xlsx`
- `estado-resultados_<from>_<to>.csv`
- `balance-general_al-<date>.pdf`
- `diario_<from>_<to>.xlsx`

### 8. Branding del PDF

Header de cada PDF:
- Nombre del libro (`book.name`).
- Título del reporte.
- Subtítulo: "del DD/MM/AAAA al DD/MM/AAAA" o "al DD/MM/AAAA".
- Fecha y hora de generación abajo.
- Logo opcional (placeholder por ahora).

Estilos sobrios: fuente Helvetica, 9pt para tablas, 14pt título, rayas grises para separar.

## Files created/modified

- `src/lib/exporters/{csv,xlsx,pdf}.{ts,tsx}`
- `src/features/reports/exporters/{TrialBalance,IncomeStatement,BalanceSheet,Ledger}Pdf.tsx`
- `src/features/reports/exporters/sheets.ts` (todas las funciones `to<Report>Sheet`)
- `src/features/reports/components/ExportButton.tsx`
- `src/pages/reports/*Page.tsx` (integración del botón)
- `src/pages/journal/JournalPage.tsx` (botón exportar)
- `package.json`

## Verification

1. Generar Balance de Comprobación, exportar a PDF → abre, los totales coinciden con la UI.
2. Mismo reporte → Excel → abre en LibreOffice/Excel, los números son numéricos (no texto).
3. Mismo reporte → CSV → abrir en VSCode, ver encoding UTF-8 con BOM.
4. Mayor de "Caja" → PDF con header correcto y saldo final.
5. Estado de Resultados con datos en USD y VES (multimoneda) → reporte muestra moneda base y suma correcta.
6. Listado de asientos del mes → Excel con todas las líneas.
7. Mobile: el botón "Exportar" es accesible y la descarga funciona.

## Definition of Done

- [ ] Los 7 escenarios pasan.
- [ ] Los archivos generados se abren sin errores.
- [ ] Filenames descriptivos.
- [ ] Tipografía y formato consistentes en PDFs.
- [ ] Commit: `feat(phase-11): exportación PDF, Excel y CSV de reportes`.

## Notas

- Si los PDFs son lentos, considera lazy-loading de `@react-pdf/renderer` (es pesado). `const Pdf = lazy(() => import('./Pdf'))`.
- Para imprimir directo (bonus), `window.print()` con CSS `@media print` puede ser más rápido.
- Excel no es ideal para Mayor con miles de movimientos; ofrece CSV como alternativa.
