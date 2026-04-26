import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import type { CreateLoanInput } from './schemas'

export type Loan = Database['public']['Tables']['loans']['Row']
export type LoanSchedule = Database['public']['Tables']['loan_schedule']['Row']
export type LoanPayment = Database['public']['Tables']['loan_payments']['Row']
export type PaymentStrategy = Database['public']['Enums']['payment_strategy']

export type LoanWithSchedule = Loan & {
  schedule: LoanSchedule[]
  payments: LoanPayment[]
}

export async function listLoans(bookId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getLoan(id: string): Promise<LoanWithSchedule> {
  const [{ data: loan, error: e1 }, { data: schedule, error: e2 }, { data: payments, error: e3 }] =
    await Promise.all([
      supabase.from('loans').select('*').eq('id', id).single(),
      supabase.from('loan_schedule').select('*').eq('loan_id', id).order('version').order('installment_number'),
      supabase.from('loan_payments').select('*').eq('loan_id', id).order('payment_date'),
    ])
  if (e1) throw e1
  if (e2) throw e2
  if (e3) throw e3
  return { ...loan!, schedule: schedule ?? [], payments: payments ?? [] }
}

export async function createLoan(bookId: string, input: CreateLoanInput): Promise<Loan> {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      book_id: bookId,
      type: input.type,
      counterparty: input.counterparty,
      principal: input.principal,
      annual_rate: input.annual_rate,
      term_months: input.term_months,
      start_date: input.start_date,
      asset_account_id: input.asset_account_id ?? null,
      liability_account_id: input.liability_account_id ?? null,
      interest_account_id: input.interest_account_id,
      cash_account_id: input.cash_account_id,
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('generate_loan_schedule', { p_loan_id: data.id })
  return data
}

export async function payInstallment(installmentId: string, paymentDate: string): Promise<string> {
  const { data, error } = await supabase.rpc('pay_loan_installment', {
    p_installment_id: installmentId,
    p_payment_date: paymentDate,
  })
  if (error) throw error
  return data as string
}

export async function previewExtraPayment(
  loanId: string,
  amount: number,
  strategy: PaymentStrategy,
): Promise<{ new_term: number; new_installment: number; saved_installments: number }> {
  const { data, error } = await supabase.rpc('preview_extra_payment', {
    p_loan_id: loanId,
    p_amount: amount,
    p_strategy: strategy,
  })
  if (error) throw error
  const rows = data as { new_term: number; new_installment: number; saved_installments: number }[]
  return rows[0] ?? { new_term: 0, new_installment: 0, saved_installments: 0 }
}

export async function applyExtraPayment(
  loanId: string,
  paymentDate: string,
  amount: number,
  strategy: PaymentStrategy,
): Promise<string> {
  const { data, error } = await supabase.rpc('apply_extra_payment', {
    p_loan_id: loanId,
    p_payment_date: paymentDate,
    p_amount: amount,
    p_strategy: strategy,
  })
  if (error) throw error
  return data as string
}
