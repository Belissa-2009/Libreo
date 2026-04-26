import { z } from 'zod';

export const accountSchema = z.object({
  code: z.string().min(1, 'Código requerido').max(20),
  name: z.string().min(1, 'Nombre requerido').max(100),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
});
export type AccountForm = z.infer<typeof accountSchema>;
