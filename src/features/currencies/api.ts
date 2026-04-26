import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row']

export async function listExchangeRates(bookId: string): Promise<ExchangeRate[]> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('book_id', bookId)
    .order('rate_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertExchangeRate(rate: {
  book_id: string
  from_currency: string
  to_currency: string
  rate: number
  rate_date: string
}): Promise<void> {
  const { error } = await supabase.from('exchange_rates').upsert(rate, {
    onConflict: 'book_id,from_currency,to_currency,rate_date',
  })
  if (error) throw error
}

export async function deleteExchangeRate(
  bookId: string,
  fromCurrency: string,
  toCurrency: string,
  rateDate: string,
): Promise<void> {
  const { error } = await supabase
    .from('exchange_rates')
    .delete()
    .eq('book_id', bookId)
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .eq('rate_date', rateDate)
  if (error) throw error
}

export async function getRateForDate(
  bookId: string,
  from: string,
  to: string,
  date: string,
): Promise<number | null> {
  if (from === to) return 1
  const { data, error } = await supabase.rpc('get_exchange_rate', {
    p_book_id: bookId,
    p_from: from,
    p_to: to,
    p_date: date,
  })
  if (error) throw error
  return data ?? null
}
