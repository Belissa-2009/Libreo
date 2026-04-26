import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Loan, LoanSchedule } from '../api'

const fmt = (n: number) =>
  new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

interface LoanCardProps {
  loan: Loan
  schedule?: LoanSchedule[]
  onClick?: () => void
}

export function LoanCard({ loan, schedule = [], onClick }: LoanCardProps) {
  const pending = schedule.filter((s) => s.status === 'pending')
  const paid = schedule.filter((s) => s.status === 'paid')
  const next = pending.sort((a, b) => a.due_date.localeCompare(b.due_date))[0]

  const totalInstallments = schedule.length
  const paidCount = paid.length
  const pct = totalInstallments ? Math.round((paidCount / totalInstallments) * 100) : 0

  const paidPrincipal = paid.reduce((s, r) => s + Number(r.principal_portion), 0)
  const balance = Number(loan.principal) - paidPrincipal

  return (
    <Card className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={onClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base truncate">{loan.counterparty}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-xs">{loan.currency_code}</Badge>
            <Badge variant={loan.type === 'received' ? 'destructive' : 'default'}>
              {loan.type === 'received' ? 'Recibido' : 'Otorgado'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Capital</span>
          <span className="font-medium">{fmt(Number(loan.principal))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Saldo</span>
          <span className="font-medium">{fmt(balance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tasa anual</span>
          <span>{Number(loan.annual_rate)}%</span>
        </div>
        {next && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Próxima cuota</span>
            <span>{next.due_date}</span>
          </div>
        )}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{paidCount} / {totalInstallments} cuotas</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
