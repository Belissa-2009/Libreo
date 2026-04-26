import { useState } from 'react'
import React from 'react'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useIncomeStatement } from '@/features/reports/hooks/useReports'
import { DateRangePicker } from '@/features/reports/components/DateRangePicker'
import { AccountTypeSection } from '@/features/reports/components/AccountTypeSection'
import { ExportButton } from '@/features/reports/components/ExportButton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadPdf } from '@/lib/exporters/pdf'
import { downloadXlsx } from '@/lib/exporters/xlsx'
import { toCsv, downloadCsv } from '@/lib/exporters/csv'
import { IncomeStatementPdf } from '@/features/reports/exporters/IncomeStatementPdf'
import { toIncomeStatementSheets } from '@/features/reports/exporters/sheets'
import { useQuery } from '@tanstack/react-query'
import { listBooks } from '@/features/books/api'
import { useAuth } from '@/features/auth/AuthProvider'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)
}

export default function IncomeStatementPage() {
  const { user } = useAuth()
  const { activeBookId } = useActiveBook()
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())

  const { data: rows = [], isLoading, error } = useIncomeStatement(activeBookId ?? null, from, to)
  const { data: books = [] } = useQuery({ queryKey: ['books', user?.id], queryFn: listBooks, enabled: !!user })
  const bookName = books.find((b) => b.id === activeBookId)?.name ?? 'Libro'

  const incomeRows = rows.filter(r => r.type === 'income').map(r => ({ code: r.code, name: r.name, amount: r.amount }))
  const expenseRows = rows.filter(r => r.type === 'expense').map(r => ({ code: r.code, name: r.name, amount: r.amount }))

  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0)
  const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0)
  const netIncome = totalIncome - totalExpense

  const filenameBase = `estado-resultados_${from}_${to}`

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Estado de Resultados</h1>
        <ExportButton
          filenameBase={filenameBase}
          pdf={() => downloadPdf(`${filenameBase}.pdf`, React.createElement(IncomeStatementPdf, { bookName, fromDate: from, toDate: to, rows }))}
          xlsx={() => downloadXlsx(`${filenameBase}.xlsx`, toIncomeStatementSheets(rows))}
          csv={() => downloadCsv(`${filenameBase}.csv`, toCsv(rows.map((r) => ({ Código: r.code, Cuenta: r.name, Tipo: r.type, Monto: r.amount }))))}
        />
      </div>

      <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-2">
          <AccountTypeSection title="Ingresos" rows={incomeRows} subtotalLabel="Total Ingresos" />
          <AccountTypeSection title="Gastos" rows={expenseRows} subtotalLabel="Total Gastos" />

          <div className={`rounded-xl border p-4 flex justify-between items-center font-bold text-lg ${netIncome >= 0 ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'}`}>
            <span>{netIncome >= 0 ? 'Utilidad Neta' : 'Pérdida Neta'}</span>
            <span className={`tabular-nums ${netIncome >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {fmt(netIncome)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
