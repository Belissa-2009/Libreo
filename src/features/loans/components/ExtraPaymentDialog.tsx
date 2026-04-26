import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePreviewExtraPayment, useApplyExtraPayment } from '../hooks/useLoans'
import type { PaymentStrategy } from '../api'
import { toast } from 'sonner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface ExtraPaymentDialogProps {
  loanId: string
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function ExtraPaymentDialog({ loanId, open, onOpenChange }: ExtraPaymentDialogProps) {
  const [amount, setAmount] = useState('')
  const [strategy, setStrategy] = useState<PaymentStrategy>('reduce_term')
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [preview, setPreview] = useState<{
    new_term: number
    new_installment: number
    saved_installments: number
  } | null>(null)

  const previewMutation = usePreviewExtraPayment()
  const applyMutation = useApplyExtraPayment(loanId)

  function handlePreview() {
    const a = parseFloat(amount)
    if (isNaN(a) || a <= 0) return
    previewMutation.mutate(
      { loanId, amount: a, strategy },
      { onSuccess: setPreview, onError: (e) => toast.error((e as Error).message) },
    )
  }

  function handleApply() {
    const a = parseFloat(amount)
    if (isNaN(a) || a <= 0) return
    applyMutation.mutate(
      { paymentDate: payDate, amount: a, strategy },
      {
        onSuccess: () => {
          toast.success('Abono extraordinario aplicado')
          onOpenChange(false)
          setPreview(null)
          setAmount('')
        },
        onError: (e) => toast.error((e as Error).message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abono extraordinario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Fecha de pago</Label>
            <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Monto</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setPreview(null) }}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Estrategia</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={strategy}
              onChange={(e) => { setStrategy(e.target.value as PaymentStrategy); setPreview(null) }}
            >
              <option value="reduce_term">Reducir plazo</option>
              <option value="reduce_installment">Reducir cuota</option>
            </select>
          </div>

          {preview && (
            <div className="rounded-md border p-3 space-y-1 text-sm bg-muted/40">
              <p><span className="font-medium">Nuevo plazo:</span> {preview.new_term} cuotas</p>
              <p><span className="font-medium">Nueva cuota:</span> {fmt(preview.new_installment)}</p>
              <p><span className="font-medium">Cuotas ahorradas:</span> {preview.saved_installments}</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="secondary" onClick={handlePreview} disabled={previewMutation.isPending}>
            {previewMutation.isPending ? 'Calculando…' : 'Vista previa'}
          </Button>
          <Button onClick={handleApply} disabled={applyMutation.isPending || !preview}>
            {applyMutation.isPending ? 'Aplicando…' : 'Aplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
