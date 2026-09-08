import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Ambassadors Hooks ============

export interface AdminAmbassadorFilters {
  tab?: string;
  tier?: string;
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminAmbassadorResponse {
  ambassadors: Array<{
    id: string;
    name: string;
    email: string;
    country: string;
    tier: string;
    referrals: number;
    earnings: number;
    status: string;
  }>;
  commissions: Array<{
    id: string;
    ambassadorName: string;
    referralName: string;
    amount: number;
    status: string;
    date: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { totalAmbassadors: number; totalCommissions: number; totalEarnings: number; byTier: Record<string, number> };
}

export function useAdminAmbassadors(filters: AdminAmbassadorFilters = {}) {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.tier) params.set('tier', filters.tier);
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminAmbassadorResponse>({
    queryKey: ['admin-ambassadors', filters],
    queryFn: () => api.get<AdminAmbassadorResponse>(`/api/admin/ambassadors?${params.toString()}`),
  });
}

