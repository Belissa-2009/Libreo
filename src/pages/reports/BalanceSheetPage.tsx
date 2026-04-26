import { useState } from 'react'
import React from 'react'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useBalanceSheet, useIncomeStatement } from '@/features/reports/hooks/useReports'
import { DateRangePicker } from '@/features/reports/components/DateRangePicker'
import { AccountTypeSection } from '@/features/reports/components/AccountTypeSection'
import { ExportButton } from '@/features/reports/components/ExportButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadPdf } from '@/lib/exporters/pdf'
import { downloadXlsx } from '@/lib/exporters/xlsx'
import { toCsv, downloadCsv } from '@/lib/exporters/csv'
import { BalanceSheetPdf } from '@/features/reports/exporters/BalanceSheetPdf'
import { toBalanceSheetSheet } from '@/features/reports/exporters/sheets'
import { useQuery } from '@tanstack/react-query'
import { listBooks } from '@/features/books/api'
import { useAuth } from '@/features/auth/AuthProvider'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)
}

export default function BalanceSheetPage() {
  const { user } = useAuth()
  const { activeBookId } = useActiveBook()
  const [to, setTo] = useState(today())

  const yearStart = `${to.slice(0, 4)}-01-01`

  const { data: bsRows = [], isLoading, error } = useBalanceSheet(activeBookId ?? null, to)
  const { data: isRows = [] } = useIncomeStatement(activeBookId ?? null, yearStart, to)
  const { data: books = [] } = useQuery({ queryKey: ['books', user?.id], queryFn: listBooks, enabled: !!user })
  const bookName = books.find((b) => b.id === activeBookId)?.name ?? 'Libro'

  const assetRows = bsRows.filter(r => r.type === 'asset').map(r => ({ code: r.code, name: r.name, amount: r.balance }))
  const liabilityRows = bsRows.filter(r => r.type === 'liability').map(r => ({ code: r.code, name: r.name, amount: r.balance }))
  const equityRows = bsRows.filter(r => r.type === 'equity').map(r => ({ code: r.code, name: r.name, amount: r.balance }))

  const totalIncome = isRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = isRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const netIncome = totalIncome - totalExpense

  const totalAssets = assetRows.reduce((s, r) => s + r.amount, 0)
  const totalLiabilities = liabilityRows.reduce((s, r) => s + r.amount, 0)
  const totalEquity = equityRows.reduce((s, r) => s + r.amount, 0) + netIncome
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
  const filenameBase = `balance-general_al-${to}`

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Balance General</h1>
        <ExportButton
          filenameBase={filenameBase}
          pdf={() => downloadPdf(`${filenameBase}.pdf`, React.createElement(BalanceSheetPdf, { bookName, toDate: to, rows: bsRows }))}
          xlsx={() => downloadXlsx(`${filenameBase}.xlsx`, [toBalanceSheetSheet(bsRows)])}
          csv={() => downloadCsv(`${filenameBase}.csv`, toCsv(bsRows.map((r) => ({ Código: r.code, Cuenta: r.name, Tipo: r.type, Saldo: r.balance }))))}
        />
      </div>

      <DateRangePicker from="" to={to} onChange={(_, t) => setTo(t)} single />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {!balanced && bsRows.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠ El balance NO cuadra. Activo: {fmt(totalAssets)} ≠ Pasivo+Patrimonio: {fmt(totalLiabilities + totalEquity)}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left column: Assets */}
          <div>
            <AccountTypeSection title="Activos" rows={assetRows} subtotalLabel="Total Activos" />
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold flex justify-between">
              <span>TOTAL ACTIVO</span>
              <span className="tabular-nums">{fmt(totalAssets)}</span>
            </div>
          </div>

          {/* Right column: Liabilities + Equity */}
          <div>
            <AccountTypeSection title="Pasivos" rows={liabilityRows} subtotalLabel="Total Pasivos" />
            <AccountTypeSection
              title="Patrimonio"
              rows={[
                ...equityRows,
                { code: '–', name: netIncome >= 0 ? 'Utilidad del periodo' : 'Pérdida del periodo', amount: netIncome },
              ]}
              subtotalLabel="Total Patrimonio"
            />
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-semibold flex justify-between">
              <span>TOTAL PASIVO + PATRIMONIO</span>
              <span className="tabular-nums">{fmt(totalLiabilities + totalEquity)}</span>
            </div>
          </div>
        </div>
      )}

      {!isLoading && bsRows.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">Sin datos para la fecha seleccionada.</p>
      )}
    </div>
  )
}
