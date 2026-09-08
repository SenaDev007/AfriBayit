import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';
import type { AdminStats } from './types';

// ============ Stats Hook ============

export function useAdminStats(country?: CountryCode | 'ALL') {
  const params = new URLSearchParams();
  if (country && country !== 'ALL') params.set('country', country);

  return useQuery<AdminStats>({
    queryKey: ['admin-stats', country],
    queryFn: () => api.get<AdminStats>(`/api/admin/stats?${params.toString()}`),
    refetchInterval: 30000,
  });
}

