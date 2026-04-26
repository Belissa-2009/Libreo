import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listLoans,
  getLoan,
  createLoan,
  payInstallment,
  previewExtraPayment,
  applyExtraPayment,
} from '../api'
import type { CreateLoanInput } from '../schemas'
import type { PaymentStrategy } from '../api'

export function useLoans(bookId: string | null) {
  return useQuery({
    queryKey: ['loans', bookId],
    queryFn: () => listLoans(bookId!),
    enabled: !!bookId,
  })
}

export function useLoan(loanId: string | null) {
  return useQuery({
    queryKey: ['loan', loanId],
    queryFn: () => getLoan(loanId!),
    enabled: !!loanId,
  })
}

export function useCreateLoan(bookId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLoanInput) => createLoan(bookId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loans', bookId] }),
  })
}

export function usePayInstallment(loanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ installmentId, paymentDate }: { installmentId: string; paymentDate: string }) =>
      payInstallment(installmentId, paymentDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan', loanId] })
      qc.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}

export function usePreviewExtraPayment() {
  return useMutation({
    mutationFn: ({
      loanId,
      amount,
      strategy,
    }: {
      loanId: string
      amount: number
      strategy: PaymentStrategy
    }) => previewExtraPayment(loanId, amount, strategy),
  })
}

export function useApplyExtraPayment(loanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      paymentDate,
      amount,
      strategy,
    }: {
      paymentDate: string
      amount: number
      strategy: PaymentStrategy
    }) => applyExtraPayment(loanId, paymentDate, amount, strategy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan', loanId] })
      qc.invalidateQueries({ queryKey: ['loans'] })
    },
  })
}
