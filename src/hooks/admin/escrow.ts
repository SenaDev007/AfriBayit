import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Escrow Admin Hooks ============

export interface AdminEscrowFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminEscrowAccount {
  id: string;
  transactionId: string;
  balance: number;
  heldAmount: number;
  releasedAmount: number;
  refundedAmount: number;
  currency: string;
  status: string;
  fundedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  transaction: {
    id: string;
    propertyId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    commission: number;
    currency: string;
    country: string;
    status: string;
    escrowReference: string | null;
    disputeReason: string | null;
    property: {
      id: string;
      title: string;
      type: string;
      city: string;
      country: string;
    };
    buyer: {
      id: string;
      name: string;
      email: string;
    };
    seller: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface AdminEscrowResponse {
  accounts: AdminEscrowAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalHeld: number;
    activeDisputes: number;
    releasedToday: number;
    avgHoldTimeHours: number;
  };
}

export function useAdminEscrow(filters: AdminEscrowFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminEscrowResponse>({
    queryKey: ['admin-escrow', filters],
    queryFn: () => api.get<AdminEscrowResponse>(`/api/admin/escrow?${params.toString()}`),
  });
}

export function useEscrowTransition(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetStatus: string; actorType?: string; reason?: string }) =>
      apiPatch(`/api/escrow/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-escrow'] });
    },
  });
}

