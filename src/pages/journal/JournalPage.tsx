import { useState } from 'react';
import React from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useActiveBook } from '@/features/books/useActiveBook';
import { useAuth } from '@/features/auth/AuthProvider';
import { listBooks } from '@/features/books/api';
import { useEntries } from '@/features/journal/hooks/useEntries';
import { deleteEntry } from '@/features/journal/api';
import { useAccountsMap } from '@/features/accounts/hooks/useAccounts';
import { EntryCard } from '@/features/journal/components/EntryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { ExportButton } from '@/features/reports/components/ExportButton';
import { downloadPdf } from '@/lib/exporters/pdf';
import { downloadXlsx } from '@/lib/exporters/xlsx';
import { toCsv, downloadCsv } from '@/lib/exporters/csv';
import { JournalListPdf } from '@/features/journal/exporters/JournalListPdf';
import { toJournalSheet } from '@/features/reports/exporters/sheets';

export default function JournalPage() {
  const { activeBookId } = useActiveBook();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data: books } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });
  const myBook = books?.find((b) => b.id === activeBookId);
  const canEdit = myBook?.role === 'admin' || myBook?.role === 'editor';

  const filters = { fromDate: fromDate || undefined, toDate: toDate || undefined, search: search || undefined, page, pageSize: 50 };
  const { data, isLoading } = useEntries(activeBookId, filters);
  const accountsMap = useAccountsMap(activeBookId);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este asiento?')) return;
    try {
      await deleteEntry(id);
      qc.invalidateQueries({ queryKey: ['entries', activeBookId] });
      toast.success('Asiento eliminado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  if (!activeBookId) {
    return <div className="p-4 text-muted-foreground">Selecciona un libro.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Libro diario</h1>
        <div className="flex items-center gap-2">
          <ExportButton
            filenameBase={`diario_${fromDate || 'inicio'}_${toDate || 'hoy'}`}
            pdf={() => downloadPdf(`diario_${fromDate || 'inicio'}_${toDate || 'hoy'}.pdf`, React.createElement(JournalListPdf, { bookName: myBook?.name ?? 'Libro', fromDate: fromDate || '—', toDate: toDate || '—', entries: data?.entries ?? [] }))}
            xlsx={() => downloadXlsx(`diario_${fromDate || 'inicio'}_${toDate || 'hoy'}.xlsx`, [toJournalSheet(data?.entries ?? [])])}
            csv={() => downloadCsv(`diario_${fromDate || 'inicio'}_${toDate || 'hoy'}.csv`, toCsv((data?.entries ?? []).map((e) => ({ Fecha: e.entry_date, Descripción: e.description ?? '', Referencia: e.reference ?? '', 'Total Debe': e.journal_lines.reduce((s, l) => s + Number(l.debit ?? 0), 0), Moneda: e.currency_code }))))}
          />
          {canEdit && (
            <Button size="sm" onClick={() => navigate('/journal/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo asiento
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" className="h-8 text-xs w-36" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" className="h-8 text-xs w-36" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Buscar</Label>
          <Input placeholder="Descripción o referencia..." className="h-8 text-xs w-48" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (data?.entries.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay asientos en este período.</p>
          {canEdit && (
            <Button variant="outline" className="mt-4" onClick={() => navigate('/journal/new')}>
              Crear primer asiento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {data!.entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              accountsMap={accountsMap}
              canEdit={canEdit}
              onEdit={() => navigate(`/journal/${entry.id}/edit`)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.count ?? 0) > 50 && (
        <div className="flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {page + 1} · {data?.count} total
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={(page + 1) * 50 >= (data?.count ?? 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
