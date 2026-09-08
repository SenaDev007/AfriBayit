import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Admin Action Mutations ============

export function useAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method, data }: { path: string; method: 'post' | 'patch' | 'delete'; data?: unknown }) => {
      if (method === 'post') return apiPost(path, data);
      if (method === 'patch') return apiPatch(path, data);
      return apiDelete(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-'] });
    },
  });
}

