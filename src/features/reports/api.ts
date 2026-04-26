import { supabase } from '@/lib/supabase'

export type LedgerRow = {
  line_id: string
  entry_date: string
  description: string
  reference: string
  debit: number
  credit: number
  balance: number
}

export type TrialBalanceRow = {
  account_id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  total_debit: number
  total_credit: number
  balance: number
}

export type IncomeStatementRow = {
  account_id: string
  code: string
  name: string
  type: 'income' | 'expense'
  amount: number
}

export type BalanceSheetRow = {
  account_id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity'
  balance: number
}

export type MonthlySummaryRow = {
  month: string
  income: number
  expense: number
}

export async function getLedger(
  bookId: string,
  accountId: string,
  from: string,
  to: string,
): Promise<LedgerRow[]> {
  const { data, error } = await supabase.rpc('report_ledger', {
    p_book_id: bookId,
    p_account_id: accountId,
    p_from: from,
    p_to: to,
  })
  if (error) throw error
  return (data ?? []) as LedgerRow[]
}

export async function getTrialBalance(
  bookId: string,
  to: string,
): Promise<TrialBalanceRow[]> {
  const { data, error } = await supabase.rpc('report_trial_balance', {
    p_book_id: bookId,
    p_to: to,
  })
  if (error) throw error
  return (data ?? []) as TrialBalanceRow[]
}

export async function getIncomeStatement(
  bookId: string,
  from: string,
  to: string,
): Promise<IncomeStatementRow[]> {
  const { data, error } = await supabase.rpc('report_income_statement', {
    p_book_id: bookId,
    p_from: from,
    p_to: to,
  })
  if (error) throw error
  return (data ?? []) as IncomeStatementRow[]
}

export async function getBalanceSheet(
  bookId: string,
  to: string,
): Promise<BalanceSheetRow[]> {
  const { data, error } = await supabase.rpc('report_balance_sheet', {
    p_book_id: bookId,
    p_to: to,
  })
  if (error) throw error
  return (data ?? []) as BalanceSheetRow[]
}

export async function getMonthlySummary(
  bookId: string,
  months = 6,
): Promise<MonthlySummaryRow[]> {
  const { data, error } = await supabase.rpc('report_monthly_summary', {
    p_book_id: bookId,
    p_months: months,
  })
  if (error) throw error
  return (data ?? []) as MonthlySummaryRow[]
}
