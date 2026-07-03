import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

export function useNotifications(userId?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['notifications', userId, page, limit],
    queryFn: () => api<{ notifications: unknown[]; unreadCount: number; pagination: unknown }>(`/api/notifications?${params.toString()}`),
    enabled: !!userId,
    refetchInterval: 30000, // Poll every 30s for new notifications
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

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category?: string) => apiPost('/api/notifications/mark-all-read', { category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => api<{ data: Record<string, unknown> }>('/api/notifications/preferences'),
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
