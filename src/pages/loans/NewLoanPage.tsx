import { useNavigate } from 'react-router'
import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useAccounts } from '@/features/accounts/hooks/useAccounts'
import { useCreateLoan } from '@/features/loans/hooks/useLoans'
import { createLoanSchema, type CreateLoanInput } from '@/features/loans/schemas'
import { useUserPreferences } from '@/features/profile/hooks/useUserPreferences'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

function AccountSelect({
  accounts,
  value,
  onChange,
  placeholder,
}: {
  accounts: { id: string; name: string; code: string }[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <select
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder ?? 'Selecciona una cuenta'}</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.code} — {a.name}
        </option>
      ))}
    </select>
  )
}

export default function NewLoanPage() {
  const navigate = useNavigate()
  const { activeBookId } = useActiveBook()
  const { data: accounts = [] } = useAccounts(activeBookId)
  const createLoan = useCreateLoan(activeBookId!)
  const [currencies, setCurrencies] = useState<{ code: string; name: string }[]>([])
  const { defaultCurrencyCode, isLoading: prefsLoading } = useUserPreferences()
  const prefsApplied = useRef(false)

  useEffect(() => {
    supabase.from('currencies').select('code, name').order('code').then(({ data }) => {
      if (data) setCurrencies(data)
    })
  }, [])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLoanInput>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      type: 'received',
      counterparty: '',
      currency_code: 'DOP',
      principal: 0,
      annual_rate: 0,
      term_months: 12,
      start_date: new Date().toISOString().slice(0, 10),
      interest_account_id: '',
      cash_account_id: '',
      notes: '',
    },
  })

  // Apply user's preferred currency once preferences finish loading
  useEffect(() => {
    if (!prefsLoading && !prefsApplied.current) {
      prefsApplied.current = true
      setValue('currency_code', defaultCurrencyCode)
    }
  }, [prefsLoading, defaultCurrencyCode, setValue])

  const loanType = watch('type')

  function onSubmit(data: CreateLoanInput) {
    if (!activeBookId) return
    createLoan.mutate(data, {
      onSuccess: (loan) => {
        toast.success('Préstamo creado')
        navigate(`/loans/${loan.id}`)
      },
      onError: (e) => toast.error((e as Error).message),
    })
  }

  if (!activeBookId) {
    return <p className="text-muted-foreground p-6">Selecciona un libro primero.</p>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/loans"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Nuevo préstamo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del préstamo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="received">Recibido (soy deudor)</option>
                    <option value="given">Otorgado (soy acreedor)</option>
                  </select>
                )}
              />
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            {/* Contraparte */}
            <div className="space-y-1.5">
              <Label>Contraparte</Label>
              <Input placeholder="Nombre del banco o persona" {...register('counterparty')} />
              {errors.counterparty && <p className="text-xs text-destructive">{errors.counterparty.message}</p>}
            </div>

            {/* Divisa */}
            <div className="space-y-1.5">
              <Label>Divisa</Label>
              <Controller
                control={control}
                name="currency_code"
                render={({ field }) => (
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <option value="">Selecciona una moneda</option>
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.currency_code && <p className="text-xs text-destructive">{errors.currency_code.message}</p>}
            </div>

            {/* Capital / Tasa / Plazo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Capital</Label>
                <Input type="number" step="0.01" min="0" {...register('principal', { valueAsNumber: true })} />
                {errors.principal && <p className="text-xs text-destructive">{errors.principal.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Tasa anual (%)</Label>
                <Input type="number" step="0.01" min="0" {...register('annual_rate', { valueAsNumber: true })} />
                {errors.annual_rate && <p className="text-xs text-destructive">{errors.annual_rate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Plazo (meses)</Label>
                <Input type="number" step="1" min="1" {...register('term_months', { valueAsNumber: true })} />
                {errors.term_months && <p className="text-xs text-destructive">{errors.term_months.message}</p>}
              </div>
            </div>

            {/* Fecha inicio */}
            <div className="space-y-1.5">
              <Label>Fecha de inicio</Label>
              <Input type="date" {...register('start_date')} />
              {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
            </div>

            {/* Cuentas */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Cuentas contables</p>

              {loanType === 'given' && (
                <div className="space-y-1.5">
                  <Label>Cuenta de activo (cartera de crédito)</Label>
                  <Controller
                    control={control}
                    name="asset_account_id"
                    render={({ field }) => (
                      <AccountSelect accounts={accounts} value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                </div>
              )}

              {loanType === 'received' && (
                <div className="space-y-1.5">
                  <Label>Cuenta de pasivo (préstamo por pagar)</Label>
                  <Controller
                    control={control}
                    name="liability_account_id"
                    render={({ field }) => (
                      <AccountSelect accounts={accounts} value={field.value ?? ''} onChange={field.onChange} />
                    )}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Cuenta de interés *</Label>
                <Controller
                  control={control}
                  name="interest_account_id"
                  render={({ field }) => (
                    <AccountSelect accounts={accounts} value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.interest_account_id && (
                  <p className="text-xs text-destructive">{errors.interest_account_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Cuenta de efectivo / banco *</Label>
                <Controller
                  control={control}
                  name="cash_account_id"
                  render={({ field }) => (
                    <AccountSelect accounts={accounts} value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.cash_account_id && (
                  <p className="text-xs text-destructive">{errors.cash_account_id.message}</p>
                )}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea rows={2} {...register('notes')} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => navigate('/loans')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLoan.isPending}>
                {createLoan.isPending ? 'Creando…' : 'Crear préstamo'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
