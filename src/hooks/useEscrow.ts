import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPatch } from '@/lib/api';

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

export function useEscrowDetail(id: string) {
  return useQuery({
    queryKey: ['escrow-detail', id],
    queryFn: () => apiFetch<{ transaction: unknown }>(`/api/escrow/${id}`),
    enabled: !!id,
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

export function useTransitionEscrow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetStatus, actorType, reason, metadata }: {
      id: string;
      targetStatus: string;
      actorType?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    }) =>
      apiPatch(`/api/escrow/${id}`, {
        targetStatus,
        actorType: actorType || 'buyer',
        reason,
        metadata,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrow'] });
      queryClient.invalidateQueries({ queryKey: ['escrow-detail', variables.id] });
    },
  });
}
