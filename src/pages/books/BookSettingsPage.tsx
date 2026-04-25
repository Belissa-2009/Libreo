import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listMembers,
  listInvitations,
  updateBook,
  revokeInvitation,
} from '@/features/books/api';
import { listBooks } from '@/features/books/api';
import { createBookSchema, type CreateBookForm } from '@/features/books/schemas';
import { MembersList } from '@/features/books/components/MembersList';
import { InviteMemberDialog } from '@/features/books/components/InviteMemberDialog';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Trash2, ArrowLeft } from 'lucide-react';

export default function BookSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: books } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });
  const book = books?.find((b) => b.id === id);

  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('currencies').select('code, name').order('code');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: members } = useQuery({
    queryKey: ['members', id],
    queryFn: () => listMembers(id!),
    enabled: !!id,
  });

  const { data: invitations } = useQuery({
    queryKey: ['invitations', id],
    queryFn: () => listInvitations(id!),
    enabled: !!id,
  });

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } =
    useForm<CreateBookForm>({
      resolver: zodResolver(createBookSchema),
      values: book ? { name: book.name, base_currency: book.base_currency } : undefined,
    });

  const onSubmit = async (data: CreateBookForm) => {
    try {
      await updateBook(id!, data);
      qc.invalidateQueries({ queryKey: ['books', user?.id] });
      toast.success('Libro actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar libro');
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado');
  };

  const handleRevoke = async (invId: string) => {
    try {
      await revokeInvitation(invId);
      qc.invalidateQueries({ queryKey: ['invitations', id] });
      toast.success('Invitación revocada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al revocar');
    }
  };

  if (!book) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Libro no encontrado o sin acceso de admin.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Configuración del libro</h1>
      </div>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="book-name-edit">Nombre</Label>
              <Input id="book-name-edit" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Moneda base</Label>
              <Controller
                control={control}
                name="base_currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(currencies ?? []).map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} – {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Miembros</CardTitle>
            <InviteMemberDialog bookId={id!} />
          </div>
        </CardHeader>
        <CardContent>
          <MembersList
            bookId={id!}
            members={members ?? []}
            currentUserId={user?.id ?? ''}
            isAdmin={book.role === 'admin'}
          />
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {(invitations ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations!.map((inv) => (
                <div key={inv.id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm truncate">{inv.email}</span>
                  <span className="text-xs text-muted-foreground capitalize">{inv.role}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => copyInviteLink(inv.token)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleRevoke(inv.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
