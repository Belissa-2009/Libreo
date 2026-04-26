import { useQuery } from '@tanstack/react-query';
import { listEntries, getEntry, type ListEntriesFilter } from '../api';

export function useEntries(bookId: string | null, filters: ListEntriesFilter = {}) {
  return useQuery({
    queryKey: ['entries', bookId, filters],
    queryFn: () => listEntries(bookId!, filters),
    enabled: !!bookId,
  });
}

export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['entry', id],
    queryFn: () => getEntry(id!),
    enabled: !!id,
  });
}
