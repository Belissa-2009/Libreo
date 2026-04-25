import { z } from 'zod';

export const createBookSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  base_currency: z.string().length(3, 'Moneda requerida'),
});
export type CreateBookForm = z.infer<typeof createBookSchema>;

export const updateBookSchema = createBookSchema.partial();
export type UpdateBookForm = z.infer<typeof updateBookSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email('Correo inválido'),
  role: z.enum(['admin', 'editor', 'viewer']),
});
export type InviteMemberForm = z.infer<typeof inviteMemberSchema>;
