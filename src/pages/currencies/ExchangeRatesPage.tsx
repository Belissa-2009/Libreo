import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useActiveBook } from '@/features/books/useActiveBook'
import { listBooks } from '@/features/books/api'
import { listExchangeRates, deleteExchangeRate } from '@/features/currencies/api'
import { ExchangeRateDialog } from '@/features/currencies/components/ExchangeRateForm'
import { useAuth } from '@/features/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Trash2 } from 'lucide-react'

export default function ExchangeRatesPage() {
  const { user } = useAuth()
  const { activeBookId } = useActiveBook()
  const [showForm, setShowForm] = useState(false)
  const qc = useQueryClient()

  const { data: books = [] } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  })
  const activeBook = books.find(b => b.id === activeBookId)

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['exchange-rates', activeBookId],
    queryFn: () => listExchangeRates(activeBookId!),
    enabled: !!activeBookId,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ from, to, date }: { from: string; to: string; date: string }) =>
      deleteExchangeRate(activeBookId!, from, to, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exchange-rates', activeBookId] })
      toast.success('Tasa eliminada')
    },
    onError: (e) => toast.error((e as Error).message),
  })

  if (!activeBookId) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground">Selecciona un libro para gestionar tasas de cambio.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tasas de Cambio</h1>
          {activeBook && (
            <p className="text-sm text-muted-foreground">Moneda base: {activeBook.base_currency}</p>
          )}
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nueva tasa
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Desde</th>
                <th className="px-3 py-2 text-left">Hasta</th>
                <th className="px-3 py-2 text-right">Tasa</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={`${r.from_currency}-${r.to_currency}-${r.rate_date}`} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 tabular-nums">{r.rate_date}</td>
                  <td className="px-3 py-2 font-medium">{r.from_currency}</td>
                  <td className="px-3 py-2 font-medium">{r.to_currency}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.rate}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => deleteMutation.mutate({ from: r.from_currency, to: r.to_currency, date: r.rate_date })}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                    No hay tasas registradas. Agrega una tasa para habilitar asientos en moneda extranjera.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && activeBook && (
        <ExchangeRateDialog
          bookId={activeBookId}
          baseCurrency={activeBook.base_currency}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
