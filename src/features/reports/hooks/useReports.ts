import { useQuery } from '@tanstack/react-query'
import {
  getLedger,
  getTrialBalance,
  getIncomeStatement,
  getBalanceSheet,
  getMonthlySummary,
} from '../api'

export function useLedger(
  bookId: string | null,
  accountId: string | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ['ledger', bookId, accountId, from, to],
    queryFn: () => getLedger(bookId!, accountId!, from, to),
    enabled: !!bookId && !!accountId,
  })
}

export function useTrialBalance(bookId: string | null, to: string) {
  return useQuery({
    queryKey: ['trial-balance', bookId, to],
    queryFn: () => getTrialBalance(bookId!, to),
    enabled: !!bookId,
  })
}

export function useIncomeStatement(
  bookId: string | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ['income-statement', bookId, from, to],
    queryFn: () => getIncomeStatement(bookId!, from, to),
    enabled: !!bookId,
  })
}

export function useBalanceSheet(bookId: string | null, to: string) {
  return useQuery({
    queryKey: ['balance-sheet', bookId, to],
    queryFn: () => getBalanceSheet(bookId!, to),
    enabled: !!bookId,
  })
}

export function useMonthlySummary(bookId: string | null, months = 6) {
  return useQuery({
    queryKey: ['monthly-summary', bookId, months],
    queryFn: () => getMonthlySummary(bookId!, months),
    enabled: !!bookId,
  })
}
