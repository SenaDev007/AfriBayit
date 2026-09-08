import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Subscriptions Hooks ============

export interface AdminSubscriptionFilters {
  planType?: string;
  status?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export function useAdminSubscriptions(filters: AdminSubscriptionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.planType) params.set('planType', filters.planType);
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-subscriptions', filters],
    queryFn: () => api.get(`/api/admin/subscriptions?${params.toString()}`),
  });
}

