import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ GeoTrust Hooks ============

export interface AdminGeotrustFilters {
  tab?: string;
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminGeotrustResponse {
  geometers: Array<{
    id: string;
    name: string;
    license: string;
    country: string;
    specializations: string[];
    verified: boolean;
    missionsCount: number;
  }>;
  missions: Array<{
    id: string;
    propertyTitle: string;
    geometerName: string;
    status: string;
    scheduledDate: string;
    completedDate: string | null;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { totalGeometers: number; missionsInProgress: number; missionsCompleted: number; completionRate: number };
}

export function useAdminGeotrust(filters: AdminGeotrustFilters = {}) {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminGeotrustResponse>({
    queryKey: ['admin-geotrust', filters],
    queryFn: () => api.get<AdminGeotrustResponse>(`/api/admin/geotrust?${params.toString()}`),
  });
}

