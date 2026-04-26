import { z } from 'zod';

export const lineSchema = z.object({
  account_id: z.string().uuid('Cuenta requerida'),
  debit: z.number().min(0),
  credit: z.number().min(0),
  memo: z.string().optional(),
}).refine((l) => l.debit > 0 || l.credit > 0, {
  message: 'Ingresa débito o crédito',
}).refine((l) => !(l.debit > 0 && l.credit > 0), {
  message: 'Una línea debe tener débito O crédito, no ambos',
});

export const entrySchema = z.object({
  entry_date: z.string().min(1, 'Fecha requerida'),
  description: z.string().min(1, 'Descripción requerida'),
  reference: z.string().optional(),
  currency_code: z.string(),
  exchange_rate: z.number().positive(),
  lines: z.array(lineSchema).min(2, 'Mínimo 2 líneas'),
}).refine((e) => {
  const totalDebit = e.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = e.lines.reduce((s, l) => s + (l.credit || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.0001;
}, { message: 'Total débito debe igualar total crédito', path: ['lines'] });

export type EntryInput = z.infer<typeof entrySchema>;
export type LineInput = z.infer<typeof lineSchema>;
