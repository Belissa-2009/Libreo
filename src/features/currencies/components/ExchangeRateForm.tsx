import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertExchangeRate } from '@/features/currencies/api'
import { CURRENCIES } from '@/lib/money'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  from_currency: z.string().min(1),
  to_currency: z.string().min(1),
  rate: z.number().min(0.000001),
  rate_date: z.string().min(1),
})
type FormValues = z.infer<typeof schema>

interface Props {
  bookId: string
  baseCurrency: string
  onClose: () => void
}

export function ExchangeRateForm({ bookId, baseCurrency, onClose }: Props) {
  const qc = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const currencyOptions = Object.keys(CURRENCIES)

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      from_currency: currencyOptions.find(c => c !== baseCurrency) ?? '',
      to_currency: baseCurrency,
      rate: 1,
      rate_date: today,
    },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      upsertExchangeRate({ book_id: bookId, ...values }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-rates', bookId] })
      onClose()
    },
  })

  const fromCurrency = watch('from_currency')
  const toCurrency = watch('to_currency')
  const rateVal = watch('rate')

  return (
    <form onSubmit={handleSubmit(v => mutation.mutate(v))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Moneda origen</Label>
          <Controller
            control={control}
            name="from_currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.from_currency && <p className="text-xs text-destructive">{errors.from_currency.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Moneda destino</Label>
          <Controller
            control={control}
            name="to_currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
          {errors.to_currency && <p className="text-xs text-destructive">{errors.to_currency.message}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Tasa</Label>
        <Input type="number" step="0.000001" min="0.000001" {...register('rate', { valueAsNumber: true })} />
        <p className="text-xs text-muted-foreground">
          1 {fromCurrency} = {rateVal} {toCurrency}
        </p>
        {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Fecha</Label>
        <Input type="date" {...register('rate_date')} />
        {errors.rate_date && <p className="text-xs text-destructive">{errors.rate_date.message}</p>}
      </div>
      {mutation.error && (
        <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
      )}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar tasa'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ExchangeRateDialog(props: Props) {
  return (
    <Dialog open onOpenChange={open => !open && props.onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva tasa de cambio</DialogTitle>
        </DialogHeader>
        <ExchangeRateForm {...props} />
      </DialogContent>
    </Dialog>
  )
}
