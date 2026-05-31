import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useSubscriptions(userId?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['subscriptions', userId, page, limit],
    queryFn: () => apiFetch<{ subscriptions: unknown[]; pagination: unknown }>(`/api/subscriptions?${params.toString()}`),
    enabled: !!userId,
  });
}
