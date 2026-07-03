import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

export function useTransactions(userId?: string, country?: CountryCode, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['transactions', userId, country, page, limit],
    queryFn: () => api.get<{ transactions: unknown[]; pagination: unknown }>(`/api/transactions?${params.toString()}`),
    enabled: !!userId,
  });
}
