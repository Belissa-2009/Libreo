import { useState } from 'react'
import React from 'react'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useLedger } from '@/features/reports/hooks/useReports'
import { DateRangePicker } from '@/features/reports/components/DateRangePicker'
import { ExportButton } from '@/features/reports/components/ExportButton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadPdf } from '@/lib/exporters/pdf'
import { downloadXlsx } from '@/lib/exporters/xlsx'
import { toCsv, downloadCsv } from '@/lib/exporters/csv'
import { LedgerPdf } from '@/features/reports/exporters/LedgerPdf'
import { toLedgerSheet } from '@/features/reports/exporters/sheets'
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

export default function LedgerPage() {
  const { user } = useAuth()
  const { activeBookId } = useActiveBook()
  const [accountId, setAccountId] = useState<string>('')
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(today())

  const { data: accounts = [] } = useAccounts(activeBookId ?? null)
  const { data: books = [] } = useQuery({ queryKey: ['books', user?.id], queryFn: listBooks, enabled: !!user })
  const bookName = books.find((b) => b.id === activeBookId)?.name ?? 'Libro'
  const { data: rows = [], isLoading, error } = useLedger(activeBookId ?? null, accountId || null, from, to)

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)

  const selectedAccount = accounts.find((a) => a.id === accountId)
  const filenameBase = `mayor_${selectedAccount?.code ?? 'cuenta'}_${from}_${to}`

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Libro Mayor</h1>
        <ExportButton
          filenameBase={filenameBase}
          pdf={() => downloadPdf(`${filenameBase}.pdf`, React.createElement(LedgerPdf, { bookName, accountName: selectedAccount?.name ?? 'Cuenta', fromDate: from, toDate: to, rows }))}
          xlsx={() => downloadXlsx(`${filenameBase}.xlsx`, [toLedgerSheet(rows, selectedAccount?.name ?? 'Mayor')])}
          csv={() => downloadCsv(`${filenameBase}.csv`, toCsv(rows.map((r) => ({ Fecha: r.entry_date, Descripción: r.description, Referencia: r.reference ?? '', Debe: r.debit, Haber: r.credit, Saldo: r.balance }))))}
        />
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <Label>Cuenta</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecciona una cuenta…" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.code} – {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !accountId ? (
        <p className="text-muted-foreground text-sm">Selecciona una cuenta para ver su mayor.</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Descripción</th>
                <th className="px-3 py-2 text-left">Ref</th>
                <th className="px-3 py-2 text-right">Débito</th>
                <th className="px-3 py-2 text-right">Crédito</th>
                <th className="px-3 py-2 text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.line_id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 tabular-nums whitespace-nowrap">{r.entry_date}</td>
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.reference}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.debit ? fmt(r.debit) : ''}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.credit ? fmt(r.credit) : ''}</td>
                  <td className={`px-3 py-2 text-right tabular-nums font-medium ${r.balance < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                    Sin movimientos en el periodo
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-muted/50 font-semibold border-t">
              <tr>
                <td colSpan={3} className="px-3 py-2">Totales</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(totalDebit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(totalCredit)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(totalDebit - totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
