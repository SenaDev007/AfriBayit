import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

/** List user's transactions */
export function useTransactions(userId?: string, country?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['transactions', userId, country, page, limit],
    queryFn: () => api.get<{ transactions: any[]; pagination: any }>(`/api/transactions?${params.toString()}`),
  });
}

/** Initiate a purchase on a property — creates Transaction + EscrowAccount */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { propertyId: string }) =>
      apiPost<{ transaction: any; escrow: any; message: string; nextStep: string; paymentUrl: string }>(
        `/api/properties/${data.propertyId}/purchase`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['escrow'] });
    },
  });
}
