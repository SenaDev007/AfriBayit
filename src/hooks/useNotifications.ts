import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPatch } from '@/lib/api';

export function useNotifications(userId?: string, country?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (country) params.set('country', country);

  return useQuery({
    queryKey: ['notifications', userId, country, page, limit],
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

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; message: string; userId?: string; [key: string]: unknown }) =>
      apiPost('/api/notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
