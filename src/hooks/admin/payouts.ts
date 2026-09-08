import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Payouts Hooks ============

export interface AdminPayoutFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminPayouts(filters: AdminPayoutFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-payouts', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/api/admin/payouts?${params.toString()}`),
  });
}

export function useProcessPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; action: string; reason?: string }) =>
      apiPatch(`/api/admin/payouts/${data.id}`, { action: data.action, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
  });
}

