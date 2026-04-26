import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/AuthProvider';

export interface UserPreferences {
  default_currency_code: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  default_currency_code: 'DOP',
};

async function fetchPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('default_currency_code')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return DEFAULT_PREFERENCES;
  return { default_currency_code: data.default_currency_code };
}

async function upsertPreferences(
  userId: string,
  prefs: UserPreferences
): Promise<void> {
  const { error } = await supabase.from('user_preferences').upsert(
    { user_id: userId, ...prefs },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: preferences = DEFAULT_PREFERENCES, isLoading } = useQuery({
    queryKey: ['user_preferences', user?.id],
    queryFn: () => fetchPreferences(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const mutation = useMutation({
    mutationFn: (prefs: UserPreferences) => upsertPreferences(user!.id, prefs),
    onSuccess: (_data, variables) => {
      qc.setQueryData(['user_preferences', user?.id], variables);
    },
  });

  return {
    preferences,
    isLoading,
    defaultCurrencyCode: preferences.default_currency_code,
    savePreferences: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
