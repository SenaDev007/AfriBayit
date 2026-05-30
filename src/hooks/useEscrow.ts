import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

export function useEscrowList(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['escrow', page, limit],
    queryFn: () => apiFetch<{ escrowAccounts: unknown[]; pagination: unknown }>(`/api/escrow?page=${page}&limit=${limit}`),
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
