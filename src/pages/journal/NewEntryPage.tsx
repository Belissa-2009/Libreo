import { useNavigate } from 'react-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useActiveBook } from '@/features/books/useActiveBook';
import { createEntry } from '@/features/journal/api';
import type { EntryInput } from '@/features/journal/schemas';
import { JournalEntryForm } from '@/features/journal/components/JournalEntryForm';
import { useAccounts } from '@/features/accounts/hooks/useAccounts';
import { useUserPreferences } from '@/features/profile/hooks/useUserPreferences';
import { supabase } from '@/lib/supabase';
import { listBooks } from '@/features/books/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewEntryPage() {
  const { activeBookId } = useActiveBook();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { defaultCurrencyCode } = useUserPreferences();

  const { data: books } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });
  const myBook = books?.find((b) => b.id === activeBookId);

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
      await createEntry(activeBookId!, data);
      qc.invalidateQueries({ queryKey: ['entries', activeBookId] });
      toast.success('Asiento creado');
      navigate('/journal');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear asiento');
      throw err;
    }
  };

  if (!activeBookId) {
    return <div className="p-4 text-muted-foreground">Selecciona un libro.</div>;
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Nuevo asiento</h1>
      </div>
      <JournalEntryForm
        accounts={accounts ?? []}
        currencies={currencies ?? []}
        baseCurrency={myBook?.base_currency ?? 'DOP'}
        defaultCurrencyCode={defaultCurrencyCode}
        bookId={activeBookId}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/journal')}
      />
    </div>
  );
}
