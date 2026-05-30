import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useTransactions(userId?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['transactions', userId, page, limit],
    queryFn: () => apiFetch<{ transactions: unknown[]; pagination: unknown }>(`/api/transactions?${params.toString()}`),
    enabled: !!userId,
  });
}
