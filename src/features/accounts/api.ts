import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type Account = Database['public']['Tables']['accounts']['Row'];
export type AccountType = Database['public']['Enums']['account_type'];

export async function listAccounts(bookId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('book_id', bookId)
    .order('code');
  if (error) throw error;
  return data ?? [];
}

export async function createAccount(
  account: Omit<Database['public']['Tables']['accounts']['Insert'], 'id' | 'created_at'>
): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert(account)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAccount(
  id: string,
  updates: Database['public']['Tables']['accounts']['Update']
): Promise<void> {
  const { error } = await supabase.from('accounts').update(updates).eq('id', id);
  if (error) throw error;
}

export async function toggleAccountActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from('accounts').update({ is_active }).eq('id', id);
  if (error) throw error;
}

export async function deleteAccount(id: string): Promise<void> {
  // Check if account has journal lines first
  const { count, error: countError } = await supabase
    .from('journal_lines')
    .select('id', { count: 'exact', head: true })
    .eq('account_id', id);

  if (countError) throw countError;

  if ((count ?? 0) > 0) {
    throw new Error('No se puede eliminar: la cuenta tiene asientos contables. Desactívala en su lugar.');
  }

  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}
