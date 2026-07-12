import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

export interface PriceAlert {
  id: string;
  userId: string;
  name: string;
  country?: string;
  city?: string;
  propertyType?: string;
  transaction: string;
  maxPrice?: number;
  minSurface?: number;
  minInvestmentScore?: number;
  minRoiPct?: number;
  active: boolean;
  isActive: boolean;
  lastMatchedAt?: string;
  matchCount: number;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: string;
  unreadCount?: number;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  propertyId: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyCity: string;
  propertyCountry: string;
  investmentScore?: number;
  matchReason: string;
  isRead: boolean;
  createdAt: string;
  alert?: { id: string; name: string };
}

export interface CreateAlertInput {
  name: string;
  country?: string;
  city?: string;
  propertyType?: string;
  transaction?: string;
  maxPrice?: number;
  minSurface?: number;
  minInvestmentScore?: number;
  minRoiPct?: number;
  notifyEmail?: boolean;
  notifyPush?: boolean;
}

/** List the current user's price alerts */
export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get<{ alerts: PriceAlert[] }>(`/api/alerts`),
  });
}

/** List alert match notifications */
export function useAlertNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['alert-notifications', unreadOnly],
    queryFn: () => api.get<{ notifications: AlertNotification[] }>(
      `/api/alerts/notifications${unreadOnly ? '?unread=true' : ''}`,
    ),
  });
}

/** Create a new price alert */
export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlertInput) => apiPost<PriceAlert>(`/api/alerts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/** Delete a price alert */
export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => apiDelete(`/api/alerts/${alertId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-notifications'] });
    },
  });
}

/** Toggle alert active state */
export function useToggleAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { alertId: string; active: boolean }) =>
      apiPatch<PriceAlert>(`/api/alerts/${data.alertId}`, { active: data.active, isActive: data.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

/** Mark a notification as read */
export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => apiPost(`/api/alerts/notifications/${notificationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-notifications'] });
    },
  });
}

/** Mark all notifications as read */
export function useMarkAllAlertsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost(`/api/alerts/notifications/read-all`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-notifications'] });
    },
  });
}
