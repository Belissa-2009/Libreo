import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { useLoan } from '@/features/loans/hooks/useLoans'
import { ScheduleTable } from '@/features/loans/components/ScheduleTable'
import { ExtraPaymentDialog } from '@/features/loans/components/ExtraPaymentDialog'
import { frequencyLabels, periodicRateFromAnnual } from '@/features/loans/rates'

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: loan, isLoading } = useLoan(id ?? null)
  const [extraOpen, setExtraOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!loan) {
    return <p className="text-muted-foreground p-6">Préstamo no encontrado.</p>
  }

  const maxVersion = Math.max(...(loan.schedule.map((s) => s.version ?? 1)), 1)
  const active = loan.schedule.filter((s) => s.version === maxVersion)
  const paid = active.filter((s) => s.status === 'paid')
  const paidPrincipal = paid.reduce((s, r) => s + Number(r.principal_portion), 0)
  const balance = Number(loan.principal) - paidPrincipal
  const totalInterest = active.reduce((s, r) => s + Number(r.interest_portion), 0)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/loans"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{loan.counterparty}</h1>
            <Badge variant={loan.type === 'received' ? 'destructive' : 'default'}>
              {loan.type === 'received' ? 'Recibido' : 'Otorgado'}
            </Badge>
            <Badge variant="outline">{loan.currency_code}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {loan.term_months} cuotas {frequencyLabels[loan.frequency]} · {periodicRateFromAnnual(Number(loan.annual_rate), loan.frequency).toFixed(2)}% {frequencyLabels[loan.frequency]} · desde {loan.start_date}
          </p>
        </div>
        <Button variant="outline" onClick={() => setExtraOpen(true)}>
          <CreditCard className="mr-2 h-4 w-4" />
          Abono extra
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Capital</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(Number(loan.principal))}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Saldo</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(balance)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Interés total</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{fmt(totalInterest)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Cuotas pagadas</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{paid.length} / {active.length}</p></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Amortización</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="pt-4">
          <ScheduleTable loanId={loan.id} schedule={loan.schedule} />
        </TabsContent>

        <TabsContent value="payments" className="pt-4">
          {loan.payments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Sin pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loan.payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.payment_date}</TableCell>
                      <TableCell>
                        <Badge variant={p.type === 'extra' ? 'secondary' : 'outline'}>
                          {p.type === 'extra' ? 'Extraordinario' : 'Regular'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(Number(p.amount))}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.notes ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ExtraPaymentDialog loanId={loan.id} open={extraOpen} onOpenChange={setExtraOpen} />
    </div>
  )
}
