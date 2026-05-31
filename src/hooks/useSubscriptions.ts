import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPatch } from '@/lib/api';

export function useSubscriptions(userId?: string, country?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (country) params.set('country', country);

  return useQuery({
    queryKey: ['subscriptions', userId, country, page, limit],
    queryFn: () => apiFetch<{ subscriptions: unknown[]; pagination: unknown }>(`/api/subscriptions?${params.toString()}`),
    enabled: !!userId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { planType: string; priceXof: number; currency?: string; startDate?: string; endDate?: string; autoRenew?: boolean; paymentRef?: string }) =>
      apiPost('/api/subscriptions', {
        ...data,
        startDate: data.startDate || new Date().toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiPatch(`/api/subscriptions/${id}`, { status: 'cancelled', autoRenew: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}
