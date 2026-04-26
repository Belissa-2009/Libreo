import { useNavigate, useParams } from 'react-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useActiveBook } from '@/features/books/useActiveBook';
import { updateEntry } from '@/features/journal/api';
import { useEntry } from '@/features/journal/hooks/useEntries';
import type { EntryInput } from '@/features/journal/schemas';
import { JournalEntryForm } from '@/features/journal/components/JournalEntryForm';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { supabase } from '@/lib/supabase';
import { listBooks } from '@/features/books/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditEntryPage() {
  const { id } = useParams<{ id: string }>();
  const { activeBookId } = useActiveBook();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: books } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });
  const myBook = books?.find((b) => b.id === activeBookId);

  const { data: entry, isLoading } = useEntry(id);
  const { data: accounts } = useAccounts(activeBookId);
  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('currencies').select('code, name').order('code');
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSubmit = async (data: EntryInput) => {
    try {
      await updateEntry(id!, data);
      qc.invalidateQueries({ queryKey: ['entries', activeBookId] });
      qc.invalidateQueries({ queryKey: ['entry', id] });
      toast.success('Asiento actualizado');
      navigate('/journal');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar asiento');
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return <div className="p-4 text-muted-foreground">Asiento no encontrado.</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Editar asiento</h1>
      </div>
      <JournalEntryForm
        accounts={accounts ?? []}
        currencies={currencies ?? []}
        baseCurrency={myBook?.base_currency ?? 'USD'}
        initial={entry}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/journal')}
      />
    </div>
  );
}
