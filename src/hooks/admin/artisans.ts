import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Artisans Hooks ============

export interface AdminArtisanFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminArtisanResponse {
  artisans: Array<{
    id: string;
    name: string;
    avatar: string | null;
    specialty: string;
    country: string;
    city: string;
    rating: number;
    verified: boolean;
    status: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; verified: number; pending: number; byCountry: Record<string, number> };
}

export function useAdminArtisans(filters: AdminArtisanFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminArtisanResponse>({
    queryKey: ['admin-artisans', filters],
    queryFn: () => api.get<AdminArtisanResponse>(`/api/admin/artisans?${params.toString()}`),
  });
}

export function useVerifyArtisan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { verified?: boolean; status?: string }) =>
      apiPatch(`/api/artisans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-artisans'] });
    },
  });
}

