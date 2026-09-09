export type LoanFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

const periodsPerYear: Record<LoanFrequency, number> = {
  daily: 365,
  weekly: 52,
  biweekly: 26,
  monthly: 12,
}

export const frequencyLabels: Record<LoanFrequency, string> = {
  daily: 'diaria',
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
}

export function periodicRateFromAnnual(annualRate: number, frequency: LoanFrequency): number {
  return annualRate / periodsPerYear[frequency]
}

export function annualRateFromPeriodic(periodicRate: number, frequency: LoanFrequency): number {
  return periodicRate * periodsPerYear[frequency]
}