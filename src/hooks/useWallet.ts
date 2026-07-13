import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

export interface WalletSummary {
  balance: number;
  escrowHeld: number;
  pendingPayout: number;
  afriPoints: number;
  currency: string;
  kycLevel: number;
  name: string;
  avatar: string | null;
  score: number;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  currency: string;
  status: string;
  reference: string | null;
  providerRef: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface WalletData {
  summary: WalletSummary;
  transactions: WalletTransaction[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

// P0-2 fix: the wallet endpoint is user-scoped (`/users/me/wallet`).
// The backend resolves the user from the JWT, so we no longer pass
// `userId` as a query param (that would be an IDOR risk). We keep
// `userId` in the query key as a cache-busting handle and for the
// `enabled` gate so callers can opt out of fetching until ready.
export function useWallet(userId?: string, country?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (country) params.set('country', country);

  return useQuery({
    queryKey: ['wallet', userId, country, page, limit],
    queryFn: () => api.get<WalletData>(`/api/users/me/wallet?${params.toString()}`),
    enabled: !!userId,
  });
}

export function useCreateWalletTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; amount: number; currency?: string; providerRef?: string; metadata?: Record<string, unknown> }) =>
      apiPost('/api/wallet', {
        ...data,
        balanceAfter: 0, // will be computed server-side
        status: data.type === 'deposit' ? 'completed' : 'pending',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
}
