import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Content Hooks ============

export interface AdminContentFilters {
  country?: string;
}

export function useAdminContent(filters: AdminContentFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);

  return useQuery({
    queryKey: ['admin-content', filters],
    queryFn: () => api.get<Record<string, unknown>>(`/api/admin/content?${params.toString()}`),
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sectionKey: string; itemKey: string; value: string; country?: string }) =>
      apiPatch('/api/admin/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    },
  });
}

