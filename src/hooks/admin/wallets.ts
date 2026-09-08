import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Wallets Hooks ============

export interface AdminWalletFilters {
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export function useAdminWallets(filters: AdminWalletFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.country) params.set('country', filters.country);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-wallets', filters],
    queryFn: () => api.get(`/api/admin/wallets?${params.toString()}`),
  });
}

