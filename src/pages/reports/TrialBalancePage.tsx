import { useState } from 'react'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useTrialBalance } from '@/features/reports/hooks/useReports'
import { DateRangePicker } from '@/features/reports/components/DateRangePicker'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import type { TrialBalanceRow } from '@/features/reports/api'
import type { AccountType } from '@/features/accounts/api'

const TYPE_LABELS: Record<AccountType, string> = {
  asset: 'Activos',
  liability: 'Pasivos',
  equity: 'Patrimonio',
  income: 'Ingresos',
  expense: 'Gastos',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)
}

function groupByType(rows: TrialBalanceRow[]) {
  const groups: Record<string, TrialBalanceRow[]> = {}
  for (const row of rows) {
    if (!groups[row.type]) groups[row.type] = []
    groups[row.type].push(row)
  }
  return groups
}

export default function TrialBalancePage() {
  const { activeBookId } = useActiveBook()
  const [to, setTo] = useState(today())

  const { data: rows = [], isLoading, error } = useTrialBalance(activeBookId ?? null, to)

  const totalDebit = rows.reduce((s, r) => s + r.total_debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.total_credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01

  const groups = groupByType(rows)

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold">Balance de Comprobación</h1>

      <DateRangePicker from="" to={to} onChange={(_, t) => setTo(t)} single />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {!balanced && rows.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠ El balance NO cuadra. Diferencia: {fmt(Math.abs(totalDebit - totalCredit))}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="space-y-4">
          {(Object.keys(TYPE_LABELS) as AccountType[]).map(type => {
            const typeRows = groups[type] ?? []
            if (typeRows.length === 0) return null
            return (
              <div key={type}>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-1 px-1">
                  {TYPE_LABELS[type]}
                </h3>
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left w-20">Código</th>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-right">Débito</th>
                        <th className="px-3 py-2 text-right">Crédito</th>
                        <th className="px-3 py-2 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {typeRows.map(r => (
                        <tr key={r.account_id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                          <td className="px-3 py-2">{r.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(r.total_debit)}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{fmt(r.total_credit)}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${r.balance < 0 ? 'text-red-600' : ''}`}>
                            {fmt(r.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}

          {rows.length > 0 && (
            <div className={`rounded-md border p-3 text-sm font-semibold flex justify-between ${balanced ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'}`}>
              <span>Totales</span>
              <span className="flex gap-8 tabular-nums">
                <span>D: {fmt(totalDebit)}</span>
                <span>C: {fmt(totalCredit)}</span>
                {balanced && <span className="text-green-600">✓ Cuadra</span>}
              </span>
            </div>
          )}

          {rows.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-8">Sin datos para la fecha seleccionada.</p>
          )}
        </div>
      )}
    </div>
  )
}
