import type { TrialBalanceRow, IncomeStatementRow, BalanceSheetRow, LedgerRow } from '../api'
import type { EntryWithLines } from '@/features/journal/api'
import type { XlsxSheet } from '@/lib/exporters/xlsx'

export function toTrialBalanceSheet(rows: TrialBalanceRow[]): XlsxSheet {
  return {
    name: 'Balance de Comprobación',
    rows: rows.map((r) => ({
      Código: r.code,
      Cuenta: r.name,
      Tipo: r.type,
      Debe: r.total_debit,
      Haber: r.total_credit,
      Saldo: r.balance,
    })),
  }
}

export function toIncomeStatementSheets(rows: IncomeStatementRow[]): XlsxSheet[] {
  const detail: XlsxSheet = {
    name: 'Detalle',
    rows: rows.map((r) => ({
      Código: r.code,
      Cuenta: r.name,
      Tipo: r.type === 'income' ? 'Ingreso' : 'Gasto',
      Monto: r.amount,
    })),
  }
  const totalIncome = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const summary: XlsxSheet = {
    name: 'Resumen',
    rows: [
      { Concepto: 'Total Ingresos', Monto: totalIncome },
      { Concepto: 'Total Gastos', Monto: totalExpense },
      { Concepto: 'Resultado Neto', Monto: totalIncome - totalExpense },
    ],
  }
  return [detail, summary]
}

export function toBalanceSheetSheet(rows: BalanceSheetRow[]): XlsxSheet {
  return {
    name: 'Balance General',
    rows: rows.map((r) => ({
      Código: r.code,
      Cuenta: r.name,
      Tipo: r.type === 'asset' ? 'Activo' : r.type === 'liability' ? 'Pasivo' : 'Patrimonio',
      Saldo: r.balance,
    })),
  }
}

export function toLedgerSheet(rows: LedgerRow[], accountName: string): XlsxSheet {
  return {
    name: accountName.slice(0, 31), // Excel sheet name max 31 chars
    rows: rows.map((r) => ({
      Fecha: r.entry_date,
      Descripción: r.description,
      Referencia: r.reference ?? '',
      Debe: r.debit,
      Haber: r.credit,
      Saldo: r.balance,
    })),
  }
}

export function toJournalSheet(entries: EntryWithLines[]): XlsxSheet {
  return {
    name: 'Asientos',
    rows: entries.map((e) => ({
      Fecha: e.entry_date,
      Descripción: e.description ?? '',
      Referencia: e.reference ?? '',
      'Total Debe': e.journal_lines.reduce((s, l) => s + Number(l.debit ?? 0), 0),
      Moneda: e.currency_code,
    })),
  }
}
