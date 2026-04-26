import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { listAccounts, type Account } from '../api';

export function useAccounts(bookId: string | null) {
  return useQuery({
    queryKey: ['accounts', bookId],
    queryFn: () => listAccounts(bookId!),
    enabled: !!bookId,
  });
}

export function useAccountsMap(bookId: string | null): Record<string, Account> {
  const { data } = useAccounts(bookId);
  return useMemo(() => {
    const map: Record<string, Account> = {};
    for (const acc of data ?? []) {
      map[acc.id] = acc;
    }
    return map;
  }, [data]);
}

export type AccountNode = Account & { children: AccountNode[] };

export function useAccountTree(bookId: string | null): AccountNode[] {
  const { data } = useAccounts(bookId);
  return useMemo(() => {
    const accounts = data ?? [];
    const nodeMap: Record<string, AccountNode> = {};
    for (const acc of accounts) {
      nodeMap[acc.id] = { ...acc, children: [] };
    }
    const roots: AccountNode[] = [];
    for (const acc of accounts) {
      if (acc.parent_id && nodeMap[acc.parent_id]) {
        nodeMap[acc.parent_id].children.push(nodeMap[acc.id]);
      } else {
        roots.push(nodeMap[acc.id]);
      }
    }
    return roots;
  }, [data]);
}
