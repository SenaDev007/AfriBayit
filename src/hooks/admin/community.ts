import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Community Hooks ============

export interface AdminCommunityFilters {
  tab?: string;
  category?: string;
  country?: string;
  flagged?: boolean;
  rating?: string;
  page?: number;
  limit?: number;
}

export function useAdminCommunity(filters: AdminCommunityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  if (filters.flagged) params.set('flagged', 'true');
  if (filters.rating) params.set('rating', filters.rating);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-community', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/api/admin/community?${params.toString()}`),
  });
}

