import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Notaries Hooks ============

export interface AdminNotaryFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminNotaryResponse {
  notaries: Array<{
    id: string;
    name: string;
    avatar: string | null;
    license: string;
    specializations: string[];
    country: string;
    city: string;
    rating: number;
    verified: boolean;
    status: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; verified: number; pending: number; avgRating: number };
}

export function useAdminNotaries(filters: AdminNotaryFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminNotaryResponse>({
    queryKey: ['admin-notaries', filters],
    queryFn: () => api.get<AdminNotaryResponse>(`/api/admin/notaries?${params.toString()}`),
  });
}

