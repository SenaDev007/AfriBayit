import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch } from '@/lib/api-client';

export function useEscrowList(page = 1, limit = 20, country?: string) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (country) params.set('country', country);

  // P0-5 fix: the backend `/escrow` endpoint returns `{ transactions, pagination }`
  // (it lists the user's transactions that have an escrow account). The
  // previous shape (`{ escrowAccounts }`) never existed — the hook was
  // always reading `undefined`. We now read `transactions` and alias it
  // as `escrowAccounts` for backward compatibility with any consumer that
  // still reads that field.
  return useQuery({
    queryKey: ['escrow', page, limit, country],
    queryFn: async () => {
      const res = await api.get<{
        transactions?: unknown[];
        escrowAccounts?: unknown[];
        pagination: unknown;
      }>(`/api/escrow?${params.toString()}`);
      // Normalize: always expose `transactions` (the real backend shape)
      // and an `escrowAccounts` alias so legacy consumers keep working.
      const transactions = res.transactions ?? res.escrowAccounts ?? [];
      return { ...res, transactions, escrowAccounts: transactions };
    },
  });
}

export function useEscrowDetail(id: string) {
  return useQuery({
    queryKey: ['escrow-detail', id],
    queryFn: () => api.get<{ transaction: unknown }>(`/api/escrow/${id}`),
    enabled: !!id,
  });
}

export function useEscrowLedger(escrowId: string) {
  return useQuery({
    queryKey: ['escrow-ledger', escrowId],
    queryFn: () => api.get<{ ledger: unknown[] }>(`/api/escrow/${escrowId}/ledger`),
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
