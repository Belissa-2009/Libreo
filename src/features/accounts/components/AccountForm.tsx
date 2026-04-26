import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema, type AccountForm } from '../schemas';
import type { Account } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const typeOptions = [
  { value: 'asset', label: 'Activo' },
  { value: 'liability', label: 'Pasivo' },
  { value: 'equity', label: 'Patrimonio' },
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Gasto' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccountForm) => Promise<void>;
  accounts: Account[];
  initial?: Partial<AccountForm>;
  title?: string;
}

export function AccountForm({ open, onClose, onSubmit, accounts, initial, title }: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'asset',
      parent_id: null,
      is_active: true,
      ...initial,
    },
  });

  useEffect(() => {
    if (open) reset({ code: '', name: '', type: 'asset', parent_id: null, is_active: true, ...initial });
  }, [open, initial, reset]);

  const parentId = watch('parent_id');

  // When parent changes, inherit type from parent
  useEffect(() => {
    if (parentId) {
      const parent = accounts.find((a) => a.id === parentId);
      if (parent) setValue('type', parent.type);
    }
  }, [parentId, accounts, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title ?? 'Cuenta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="acc-code">Código</Label>
            <Input id="acc-code" {...register('code')} placeholder="Ej: 1.1.1" />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="acc-name">Nombre</Label>
            <Input id="acc-name" {...register('name')} placeholder="Ej: Caja" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Cuenta padre (opcional)</Label>
            <Controller
              control={control}
              name="parent_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? '__none__'}
                  onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin cuenta padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Sin cuenta padre —</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} · {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!!parentId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {parentId && (
              <p className="text-xs text-muted-foreground">
                Tipo heredado de la cuenta padre.
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
