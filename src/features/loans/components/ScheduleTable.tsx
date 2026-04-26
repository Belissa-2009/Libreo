import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoanSchedule } from '../api'
import { usePayInstallment } from '../hooks/useLoans'
import { toast } from 'sonner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface ScheduleTableProps {
  loanId: string
  schedule: LoanSchedule[]
}

function statusBadge(status: string) {
  if (status === 'paid') return <Badge variant="default">Pagado</Badge>
  if (status === 'cancelled') return <Badge variant="secondary">Cancelado</Badge>
  return <Badge variant="outline">Pendiente</Badge>
}

export function ScheduleTable({ loanId, schedule }: ScheduleTableProps) {
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const payMutation = usePayInstallment(loanId)

  const maxVersion = Math.max(...(schedule.map((s) => s.version ?? 1)), 1)
  const active = schedule.filter((s) => s.version === maxVersion)

  function handlePay() {
    if (!payingId) return
    payMutation.mutate(
      { installmentId: payingId, paymentDate: payDate },
      {
        onSuccess: () => {
          toast.success('Cuota registrada')
          setPayingId(null)
        },
        onError: (e) => toast.error((e as Error).message),
      },
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Capital</TableHead>
              <TableHead className="text-right">Interés</TableHead>
              <TableHead className="text-right">Cuota</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.installment_number}</TableCell>
                <TableCell>{row.due_date}</TableCell>
                <TableCell className="text-right">{fmt(Number(row.principal_portion))}</TableCell>
                <TableCell className="text-right">{fmt(Number(row.interest_portion))}</TableCell>
                <TableCell className="text-right font-medium">
                  {fmt(Number(row.principal_portion) + Number(row.interest_portion))}
                </TableCell>
                <TableCell className="text-right">{fmt(Number(row.balance_after))}</TableCell>
                <TableCell>{statusBadge(row.status)}</TableCell>
                <TableCell>
                  {row.status === 'pending' && (
                    <Button size="sm" variant="outline" onClick={() => setPayingId(row.id)}>
                      Pagar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!payingId} onOpenChange={(o) => !o && setPayingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago de cuota</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Fecha de pago</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingId(null)}>
              Cancelar
            </Button>
            <Button onClick={handlePay} disabled={payMutation.isPending}>
              {payMutation.isPending ? 'Registrando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
