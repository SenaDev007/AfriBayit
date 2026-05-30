import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

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

export function useWallet(userId?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['wallet', userId, page, limit],
    queryFn: () => apiFetch<WalletData>(`/api/wallet?${params.toString()}`),
    enabled: !!userId,
  });
}
