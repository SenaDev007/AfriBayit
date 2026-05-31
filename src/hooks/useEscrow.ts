import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

export function useEscrowList(page = 1, limit = 20, country?: string) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (country) params.set('country', country);

  return useQuery({
    queryKey: ['escrow', page, limit, country],
    queryFn: () => apiFetch<{ escrowAccounts: unknown[]; pagination: unknown }>(`/api/escrow?${params.toString()}`),
  });
}

export function useEscrowLedger(escrowId: string) {
  return useQuery({
    queryKey: ['escrow-ledger', escrowId],
    queryFn: () => apiFetch<{ ledger: unknown[] }>(`/api/escrow/${escrowId}/ledger`),
    enabled: !!escrowId,
  });
}

export function useCreateEscrow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/escrow', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow'] });
    },
  });
}
