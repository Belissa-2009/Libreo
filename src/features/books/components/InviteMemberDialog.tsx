import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { inviteMemberSchema, type InviteMemberForm } from '../schemas';
import { createInvitation } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, UserPlus } from 'lucide-react';

interface Props {
  bookId: string;
}

export function InviteMemberDialog({ bookId }: Props) {
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const qc = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<InviteMemberForm>({
      resolver: zodResolver(inviteMemberSchema),
      defaultValues: { role: 'editor' },
    });

  const onSubmit = async (data: InviteMemberForm) => {
    try {
      const { url } = await createInvitation(bookId, data.email, data.role);
      setInviteLink(url);
      qc.invalidateQueries({ queryKey: ['invitations', bookId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear invitación');
    }
  };

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Link copiado');
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) setInviteLink(null);
    setOpen(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Invitar miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Invitar miembro</DialogTitle>
        </DialogHeader>
        {!inviteLink ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="inv-email">Correo electrónico</Label>
              <Input id="inv-email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select defaultValue="editor" onValueChange={(v) => setValue('role', v as 'admin' | 'editor' | 'viewer')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              Generar link de invitación
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Copia y envía este link al invitado:</p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="text-xs" />
              <Button size="icon" variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setInviteLink(null)}>
              Invitar otro
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
