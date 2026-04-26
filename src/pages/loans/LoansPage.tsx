import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useActiveBook } from '@/features/books/useActiveBook'
import { useLoans } from '@/features/loans/hooks/useLoans'
import { LoanCard } from '@/features/loans/components/LoanCard'
import { Plus } from 'lucide-react'

export default function LoansPage() {
  const { activeBookId } = useActiveBook()
  const { data: loans, isLoading } = useLoans(activeBookId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Préstamos</h1>
        {activeBookId && (
          <Button asChild>
            <Link to="/loans/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo préstamo
            </Link>
          </Button>
        )}
      </div>

      {!activeBookId && (
        <p className="text-muted-foreground text-sm">Selecciona un libro para ver los préstamos.</p>
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && loans && loans.length === 0 && (
        <p className="text-muted-foreground text-sm">No hay préstamos registrados.</p>
      )}

      {!isLoading && loans && loans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <Link key={loan.id} to={`/loans/${loan.id}`} className="block">
              <LoanCard loan={loan} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
