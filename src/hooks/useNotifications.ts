import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPatch } from '@/lib/api';

export function useNotifications(userId?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['notifications', userId, page, limit],
    queryFn: () => apiFetch<{ notifications: unknown[]; pagination: unknown }>(`/api/notifications?${params.toString()}`),
    enabled: !!userId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPatch(`/api/notifications/${id}`, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
