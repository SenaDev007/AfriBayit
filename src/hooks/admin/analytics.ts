import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Analytics Hooks ============

export interface AdminAnalyticsFilters {
  range?: string;
  country?: string;
}

export function useAdminAnalytics(filters: AdminAnalyticsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.range) params.set('range', filters.range);
  if (filters.country) params.set('country', filters.country);

  return useQuery({
    queryKey: ['admin-analytics', filters],
    queryFn: () => api.get(`/api/admin/analytics?${params.toString()}`),
    refetchInterval: 60000,
  });
}

