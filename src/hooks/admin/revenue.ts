import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Revenue Hooks ============

export interface AdminRevenueResponse {
  totalRevenue: number;
  totalCommission: number;
  transactionCount: number;
  byCountry: Array<{ country: string | null; revenue: number; count: number }>;
  monthlyTrend: Array<{ month: string; revenue: number; commission: number }>;
  bySource: Array<{ source: string; revenue: number }>;
  topAgents: Array<{ agentId: string; agentName: string; revenue: number; commission: number }>;
  subscriptionTiers: Array<{ tier: string | null; count: number; revenue: number }>;
}

export function useAdminRevenue(filters: { period?: string; country?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.period) params.set('period', filters.period);
  if (filters.country) params.set('country', filters.country);
  return useQuery<AdminRevenueResponse>({
    queryKey: ['admin-revenue', filters],
    queryFn: () => api.get<AdminRevenueResponse>(`/api/admin/revenue?${params.toString()}`),
  });
}

