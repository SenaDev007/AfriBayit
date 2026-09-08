import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Guesthouses Hooks ============

export interface AdminGuesthouseFilters {
  country?: string;
  certificationStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminGuesthouses(filters: AdminGuesthouseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.certificationStatus) params.set('certificationStatus', filters.certificationStatus);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-guesthouses', filters],
    queryFn: () => api.get(`/api/admin/guesthouses?${params.toString()}`),
  });
}

