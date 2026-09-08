import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Hotels Hooks ============

export interface AdminHotelFilters {
  country?: string;
  status?: string;
  connectionLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminHotels(filters: AdminHotelFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.status) params.set('status', filters.status);
  if (filters.connectionLevel) params.set('connectionLevel', filters.connectionLevel);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-hotels', filters],
    queryFn: () => api.get(`/api/admin/hotels?${params.toString()}`),
  });
}

