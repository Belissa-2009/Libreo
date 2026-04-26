import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { entrySchema, type EntryInput } from '../schemas';
import type { Account } from '@/features/accounts/api';
import type { EntryWithLines } from '../api';
import { calcTotals } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  accounts: Account[];
  currencies: { code: string; name: string }[];
  baseCurrency: string;
  initial?: EntryWithLines;
  onSubmit: (data: EntryInput) => Promise<void>;
  onCancel: () => void;
}

function toFixed(n: number) {
  return parseFloat(n.toFixed(2));
}

export function JournalEntryForm({
  accounts,
  currencies,
  baseCurrency,
  initial,
  onSubmit,
  onCancel,
}: Props) {
  // Only leaf accounts (no children)
  const leafAccounts = useMemo(() => {
    const hasChildren = new Set(accounts.map((a) => a.parent_id).filter(Boolean));
    return accounts.filter((a) => !hasChildren.has(a.id) && a.is_active);
  }, [accounts]);

  const today = new Date().toISOString().slice(0, 10);

  const defaultValues: EntryInput = initial
    ? {
        entry_date: initial.entry_date,
        description: initial.description,
        reference: initial.reference ?? '',
        currency_code: initial.currency_code,
        exchange_rate: initial.exchange_rate,
        lines: initial.journal_lines
          .sort((a, b) => a.position - b.position)
          .map((l) => ({
            account_id: l.account_id,
            debit: l.debit,
            credit: l.credit,
            memo: l.memo ?? '',
          })),
      }
    : {
        entry_date: today,
        description: '',
        reference: '',
        currency_code: baseCurrency,
        exchange_rate: 1,
        lines: [
          { account_id: '', debit: 0, credit: 0, memo: '' },
          { account_id: '', debit: 0, credit: 0, memo: '' },
        ],
      };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntryInput>({
    resolver: zodResolver(entrySchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');
  const currencyCode = watch('currency_code');
  const { totalDebit, totalCredit, diff } = calcTotals(lines ?? []);
  const balanced = diff < 0.0001;

  // When currency changes back to base, reset exchange rate
  useEffect(() => {
    if (currencyCode === baseCurrency) {
      setValue('exchange_rate', 1);
    }
  }, [currencyCode, baseCurrency, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Header fields */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="entry-date">Fecha</Label>
          <Input id="entry-date" type="date" {...register('entry_date')} />
          {errors.entry_date && <p className="text-xs text-destructive">{errors.entry_date.message}</p>}
        </div>
        <div className="col-span-2 space-y-1 sm:col-span-2">
          <Label htmlFor="entry-desc">Descripción</Label>
          <Input id="entry-desc" {...register('description')} placeholder="Descripción del asiento" />
          {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="entry-ref">Referencia (opcional)</Label>
          <Input id="entry-ref" {...register('reference')} placeholder="Ej: FAC-001" />
        </div>
      </div>

      {/* Currency row */}
      <div className="flex gap-3 flex-wrap">
        <div className="space-y-1">
          <Label>Moneda</Label>
          <Controller
            control={control}
            name="currency_code"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} – {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {currencyCode !== baseCurrency && (
          <div className="space-y-1">
            <Label>Tasa de cambio</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              className="w-28"
              {...register('exchange_rate', { valueAsNumber: true })}
            />
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Líneas</p>
        {typeof errors.lines?.message === 'string' && (
          <p className="text-xs text-destructive">{errors.lines.message}</p>
        )}

        {/* Desktop table header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_120px_100px_100px_32px] gap-2 text-xs text-muted-foreground px-1">
          <span>Cuenta</span>
          <span>Memo</span>
          <span>Débito</span>
          <span>Crédito</span>
          <span />
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-md border p-3 sm:p-0 sm:border-0 sm:grid sm:grid-cols-[1fr_120px_100px_100px_32px] sm:items-center sm:gap-2"
          >
            {/* Account select */}
            <Controller
              control={control}
              name={`lines.${index}.account_id`}
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Selecciona cuenta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {leafAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.code} · {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              placeholder="Memo"
              className="h-8 text-xs"
              {...register(`lines.${index}.memo`)}
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-8 text-xs"
              {...register(`lines.${index}.debit`, { valueAsNumber: true })}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setValue(`lines.${index}.debit`, toFixed(val));
                if (val > 0) setValue(`lines.${index}.credit`, 0);
              }}
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="h-8 text-xs"
              {...register(`lines.${index}.credit`, { valueAsNumber: true })}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setValue(`lines.${index}.credit`, toFixed(val));
                if (val > 0) setValue(`lines.${index}.debit`, 0);
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive sm:flex hidden"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="sm:hidden text-destructive self-end h-7"
              onClick={() => remove(index)}
              disabled={fields.length <= 2}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Quitar
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ account_id: '', debit: 0, credit: 0, memo: '' })}
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar línea
        </Button>
      </div>

      {/* Footer totals */}
      <div
        className={cn(
          'flex flex-wrap gap-4 rounded-md px-4 py-3 text-sm border',
          balanced ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-destructive/50 bg-destructive/5'
        )}
      >
        <span>Débito: <strong>{totalDebit.toFixed(2)}</strong></span>
        <span>Crédito: <strong>{totalCredit.toFixed(2)}</strong></span>
        <span className={cn(diff > 0.0001 && 'text-destructive font-semibold')}>
          Diferencia: <strong>{diff.toFixed(2)}</strong>
        </span>
        {!balanced && <span className="text-destructive text-xs">⚠ El asiento no está balanceado</span>}
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || !balanced}>
          {isSubmitting ? 'Guardando...' : 'Guardar asiento'}
        </Button>
      </div>
    </form>
  );
}
