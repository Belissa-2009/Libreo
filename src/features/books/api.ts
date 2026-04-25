import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type MemberRole = Database['public']['Enums']['member_role'];

export type BookWithRole = {
  id: string;
  name: string;
  base_currency: string;
  owner_id: string;
  created_at: string;
  role: MemberRole;
};

export type Member = {
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profiles: { full_name: string } | null;
};

export type Invitation = Database['public']['Tables']['invitations']['Row'];

export async function listBooks(): Promise<BookWithRole[]> {
  const { data, error } = await supabase
    .from('book_members')
    .select('role, books(id, name, base_currency, owner_id, created_at)')
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.books as Database['public']['Tables']['books']['Row']),
    role: row.role,
  }));
}

export async function createBook(name: string, base_currency: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_book', {
    p_name: name,
    p_base_currency: base_currency,
  });
  if (error) throw error;
  return data as string;
}

export async function updateBook(id: string, updates: { name?: string; base_currency?: string }) {
  const { error } = await supabase.from('books').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

export async function listMembers(bookId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('book_members')
    .select('user_id, role, joined_at, profiles(full_name)')
    .eq('book_id', bookId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function createInvitation(
  bookId: string,
  email: string,
  role: MemberRole
): Promise<{ token: string; url: string }> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('invitations').insert({
    book_id: bookId,
    email: email.toLowerCase(),
    role,
    token,
    expires_at: expiresAt,
  });
  if (error) throw error;

  const url = `${window.location.origin}/accept-invitation?token=${token}`;
  return { token, url };
}

export async function revokeInvitation(id: string) {
  const { error } = await supabase.from('invitations').delete().eq('id', id);
  if (error) throw error;
}

export async function listInvitations(bookId: string): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('book_id', bookId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function removeMember(bookId: string, userId: string) {
  const { error } = await supabase
    .from('book_members')
    .delete()
    .eq('book_id', bookId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateMemberRole(bookId: string, userId: string, role: MemberRole) {
  const { error } = await supabase
    .from('book_members')
    .update({ role })
    .eq('book_id', bookId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function acceptInvitation(token: string): Promise<{ book_id: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Sesión requerida');

  const resp = await supabase.functions.invoke('accept-invitation', {
    body: { token },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (resp.error) throw new Error(resp.error.message);
  if (resp.data?.error) throw new Error(resp.data.error);
  return resp.data as { book_id: string };
}
