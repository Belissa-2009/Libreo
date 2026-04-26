import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { EntryInput } from './schemas';

export type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
export type JournalLine = Database['public']['Tables']['journal_lines']['Row'];

export type EntryWithLines = JournalEntry & {
  journal_lines: JournalLine[];
};

export interface ListEntriesFilter {
  fromDate?: string;
  toDate?: string;
  accountId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listEntries(
  bookId: string,
  filters: ListEntriesFilter = {}
): Promise<{ entries: EntryWithLines[]; count: number }> {
  const pageSize = filters.pageSize ?? 50;
  const page = filters.page ?? 0;

  let query = supabase
    .from('journal_entries')
    .select('*, journal_lines(*)', { count: 'exact' })
    .eq('book_id', bookId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (filters.fromDate) query = query.gte('entry_date', filters.fromDate);
  if (filters.toDate) query = query.lte('entry_date', filters.toDate);
  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,reference.ilike.%${filters.search}%`);
  }
  if (filters.accountId) {
    // Filter entries that have a line with this account
    const { data: entryIds } = await supabase
      .from('journal_lines')
      .select('entry_id')
      .eq('account_id', filters.accountId);
    const ids = (entryIds ?? []).map((l) => l.entry_id);
    if (ids.length === 0) return { entries: [], count: 0 };
    query = query.in('id', ids);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    entries: (data ?? []) as EntryWithLines[],
    count: count ?? 0,
  };
}

export async function getEntry(id: string): Promise<EntryWithLines> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, journal_lines(*)')
    .eq('id', id)
    .order('position', { referencedTable: 'journal_lines', ascending: true })
    .single();
  if (error) throw error;
  return data as EntryWithLines;
}

export async function createEntry(bookId: string, input: EntryInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_journal_entry', {
    p_book_id: bookId,
    p_entry_date: input.entry_date,
    p_description: input.description,
    p_reference: input.reference || '',
    p_currency_code: input.currency_code,
    p_exchange_rate: input.exchange_rate,
    p_lines: input.lines as unknown as Database['public']['Functions']['create_journal_entry']['Args']['p_lines'],
  });
  if (error) throw error;
  return data as string;
}

export async function updateEntry(entryId: string, input: EntryInput): Promise<void> {
  const { error } = await supabase.rpc('update_journal_entry', {
    p_entry_id: entryId,
    p_entry_date: input.entry_date,
    p_description: input.description,
    p_reference: input.reference || '',
    p_currency_code: input.currency_code,
    p_exchange_rate: input.exchange_rate,
    p_lines: input.lines as unknown as Database['public']['Functions']['update_journal_entry']['Args']['p_lines'],
  });
  if (error) throw error;
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}

export function calcTotals(lines: { debit: number; credit: number }[]) {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  return { totalDebit, totalCredit, diff: Math.abs(totalDebit - totalCredit) };
}
