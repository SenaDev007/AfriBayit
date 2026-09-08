import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Notifications Hooks ============

export interface AdminNotificationFilters {
  type?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminNotificationResponse {
  notifications: Array<{
    id: string;
    recipientName: string;
    type: string;
    title: string;
    message: string;
    country: string;
    read: boolean;
    createdAt: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; unread: number; byType: Record<string, number> };
}

export function useAdminNotifications(filters: AdminNotificationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminNotificationResponse>({
    queryKey: ['admin-notifications', filters],
    queryFn: () => api.get<AdminNotificationResponse>(`/api/admin/notifications?${params.toString()}`),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId?: string; type: string; title: string; message: string; country?: string }) =>
      apiPost('/api/admin/notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });
}
