import { Link } from 'react-router'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAuth } from '@/features/auth/AuthProvider'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useIncomeStatement, useMonthlySummary } from '@/features/reports/hooks/useReports'
import { KpiCard } from '@/features/reports/components/KpiCard'
import { Skeleton } from '@/components/ui/skeleton'

function today() {
  return new Date().toISOString().slice(0, 10)
}
function firstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function fmt(n: number) {
  return new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n)
}

export default function HomePage() {
  const { user } = useAuth()
  const { activeBookId } = useActiveBook()
  const name = user?.user_metadata?.full_name ?? user?.email ?? ''

  const { data: isRows = [], isLoading: isLoadingIS } = useIncomeStatement(
    activeBookId ?? null,
    firstOfMonth(),
    today(),
  )
  const { data: monthlySummary = [], isLoading: isLoadingChart } = useMonthlySummary(activeBookId ?? null, 6)

  const totalIncome = isRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = isRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const netIncome = totalIncome - totalExpense

  const chartData = monthlySummary.map(r => ({
    name: r.month.slice(5), // MM
    Ingresos: Number(r.income),
    Gastos: Number(r.expense),
  }))

  if (!activeBookId) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-semibold">Hola, {name}</h1>
        <p className="text-muted-foreground mt-1">
          <Link to="/books" className="underline">Selecciona o crea un libro contable</Link> para comenzar.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {name}</h1>
        <p className="text-muted-foreground text-sm">mes actual</p>
      </div>

      {isLoadingIS ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard title="Ingresos del mes" value={fmt(totalIncome)} highlight="positive" />
          <KpiCard title="Gastos del mes" value={fmt(totalExpense)} highlight="negative" />
          <KpiCard
            title={netIncome >= 0 ? 'Utilidad del mes' : 'Pérdida del mes'}
            value={fmt(netIncome)}
            highlight={netIncome >= 0 ? 'positive' : 'negative'}
          />
        </div>
      )}

      <div>
        <h2 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">Ingresos vs Gastos (últimos 6 meses)</h2>
        {isLoadingChart ? (
          <Skeleton className="h-48 w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos suficientes para mostrar el gráfico.</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? fmt(v) : v, '']} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
