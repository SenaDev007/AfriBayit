import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Disputes Hooks ============

export interface AdminDisputeFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminDisputes(filters: AdminDisputeFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-disputes', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/api/admin/disputes?${params.toString()}`),
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; buyerPercentage: number; sellerPercentage: number; resolution: string }) =>
      apiPatch(`/api/admin/disputes/${data.id}`, {
        action: 'resolve',
        buyerPercentage: data.buyerPercentage,
        sellerPercentage: data.sellerPercentage,
        resolution: data.resolution,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });
}

export function useEscalateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string }) =>
      apiPatch(`/api/admin/disputes/${data.id}`, { action: 'escalate' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });
}

