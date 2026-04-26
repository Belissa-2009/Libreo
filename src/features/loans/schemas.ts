import { z } from 'zod'

export const createLoanSchema = z.object({
  type: z.enum(['received', 'given']),
  counterparty: z.string().min(1),
  principal: z.number().min(0.01),
  annual_rate: z.number().min(0),
  term_months: z.number().int().min(1),
  start_date: z.string().min(1),
  asset_account_id: z.string().optional(),
  liability_account_id: z.string().optional(),
  interest_account_id: z.string().min(1),
  cash_account_id: z.string().min(1),
  notes: z.string().optional(),
})

export type CreateLoanInput = z.infer<typeof createLoanSchema>
