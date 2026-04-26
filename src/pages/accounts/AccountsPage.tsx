import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useActiveBook } from '@/features/books/useActiveBook';
import { useAccounts, useAccountTree, type AccountNode } from '@/features/accounts/hooks/useAccounts';
import { createAccount, updateAccount, toggleAccountActive, deleteAccount } from '@/features/accounts/api';
import type { AccountForm } from '@/features/accounts/schemas';
import { AccountTree } from '@/features/accounts/components/AccountTree';
import { AccountForm as AccountFormDialog } from '@/features/accounts/components/AccountForm';
import { useAuth } from '@/features/auth/AuthProvider';
import { listBooks } from '@/features/books/api';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import type { Account } from '@/features/accounts/api';

const typeFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'asset', label: 'Activo' },
  { value: 'liability', label: 'Pasivo' },
  { value: 'equity', label: 'Patrimonio' },
  { value: 'income', label: 'Ingresos' },
  { value: 'expense', label: 'Gastos' },
];

export default function AccountsPage() {
  const { activeBookId } = useActiveBook();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const { data: books } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: listBooks,
    enabled: !!user,
  });
  const myBook = books?.find((b) => b.id === activeBookId);
  const canEdit = myBook?.role === 'admin' || myBook?.role === 'editor';

  const { data: accounts, isLoading } = useAccounts(activeBookId);
  const tree = useAccountTree(activeBookId);

  const filtered = (accounts ?? []).filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Build a filtered tree if search or type filter active
  const showTree = !search && typeFilter === 'all';

  const handleCreate = async (data: AccountForm) => {
    try {
      await createAccount({ ...data, book_id: activeBookId!, parent_id: data.parent_id ?? null });
      qc.invalidateQueries({ queryKey: ['accounts', activeBookId] });
      toast.success('Cuenta creada');
      setFormOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear cuenta');
    }
  };

  const handleEdit = async (data: AccountForm) => {
    if (!editing) return;
    try {
      await updateAccount(editing.id, { ...data, parent_id: data.parent_id ?? null });
      qc.invalidateQueries({ queryKey: ['accounts', activeBookId] });
      toast.success('Cuenta actualizada');
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleToggle = async (node: AccountNode) => {
    try {
      await toggleAccountActive(node.id, !node.is_active);
      qc.invalidateQueries({ queryKey: ['accounts', activeBookId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDelete = async (node: AccountNode) => {
    try {
      await deleteAccount(node.id);
      qc.invalidateQueries({ queryKey: ['accounts', activeBookId] });
      toast.success('Cuenta eliminada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar cuenta');
    }
  };

  if (!activeBookId) {
    return <div className="p-4 text-muted-foreground">Selecciona un libro para ver las cuentas.</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Plan de cuentas</h1>
        {canEdit && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva cuenta
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="flex-wrap h-auto">
            {typeFilters.map((f) => (
              <TabsTrigger key={f.value} value={f.value} className="text-xs">
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : showTree ? (
        <AccountTree
          nodes={tree}
          canEdit={canEdit}
          onEdit={(node) => setEditing(node)}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      ) : (
        <div>
          {filtered.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/40 group"
            >
              <span className="text-sm font-mono text-muted-foreground w-16 shrink-0">{a.code}</span>
              <span className="text-sm flex-1">{a.name}</span>
              {canEdit && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(a)}>
                    <span className="sr-only">Editar</span>✏️
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      <AccountFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        accounts={accounts ?? []}
        title="Nueva cuenta"
      />

      {/* Edit form */}
      {editing && (
        <AccountFormDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
          accounts={(accounts ?? []).filter((a) => a.id !== editing.id)}
          title="Editar cuenta"
          initial={{
            code: editing.code,
            name: editing.name,
            type: editing.type,
            parent_id: editing.parent_id,
            is_active: editing.is_active,
          }}
        />
      )}
    </div>
  );
}
