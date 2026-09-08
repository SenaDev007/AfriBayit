import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Short Term Rentals Hooks ============

export interface AdminShortTermRentalFilters {
  status?: string;
  country?: string;
  search?: string;
  tab?: string;
  page?: number;
  limit?: number;
}

export function useAdminShortTermRentals(filters: AdminShortTermRentalFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  if (filters.tab) params.set('tab', filters.tab);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-short-term-rentals', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/api/admin/short-term-rentals?${params.toString()}`),
  });
}

