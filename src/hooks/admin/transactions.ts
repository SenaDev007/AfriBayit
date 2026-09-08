import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';
import type { AdminTransactionFilters } from './types';

// ============ Transactions Hook ============

export function useAdminTransactions(filters: AdminTransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-transactions', filters],
    queryFn: () => api.get(`/api/admin/transactions?${params.toString()}`),
  });
}

