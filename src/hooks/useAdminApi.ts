'use client';

/**
 * useAdminApi — React Query hooks for the admin endpoints
 *
 * Centralizes data-fetching for the admin pages so each page doesn't
 * reinvent its own fetch logic. All hooks:
 *   - Use apiFetch (handles JWT + 401 refresh)
 *   - Have sensible cache keys
 *   - Return the standard { data, isLoading, error } shape from React Query
 *   - Poll where it makes sense (Rebecca fraud alerts: 30s)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api-client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Lease {
  id: string;
  leaseRef: string | null;
  status: string;
  monthlyRent: number;
  currency: string;
  startDate: string;
  endDate: string;
  country: string;
  tenant: { id: string; name: string; email: string; avatar: string | null };
  owner: { id: string; name: string; email: string; avatar: string | null };
  property: { id: string; title: string; city: string; quartier: string; images: string | null };
  _count: { rentPayments: number; documents: number; inventories: number };
}

export interface LeaseStats {
  active: number;
  pendingSignature: number;
  latePayment: number;
  terminated: number;
  monthlyRevenue: number;
}

export interface InvestmentStats {
  kpis: {
    investors: number;
    totalCapital: number;
    activePriceAlerts: number;
    avgScore: number;
  };
  topProperties: Array<{
    id: string;
    title: string;
    city: string;
    score: number;
    investorCount: number;
    totalInvested: number;
    transaction: string;
  }>;
  recentAlerts: Array<{
    id: string;
    propertyTitle: string;
    type: string;
    threshold: number | null;
    currentPrice: number | null;
    triggeredAt: string | null;
    userName?: string;
  }>;
}

export interface RebeccaStats {
  kpis: {
    conversations24h: number;
    totalMessages: number;
    messages30d: number;
    estimatedCostEur: number;
    tokensConsumed: number;
  };
  channels: Array<{
    name: string;
    status: string;
    conversations24h: number;
    avgLatency: string;
  }>;
  fraudAlerts: { count: number; recent: any[] };
  documentAnalysis: {
    documentsAnalyzed: number;
    ocrAccuracy: number;
    anomaliesDetected: number;
  };
}

export interface RolesDistribution {
  totalUsers: number;
  multiRoleUsers: number;
  singleRoleUsers: number;
  byPrimaryRole: Array<{ role: string; count: number }>;
  byRoleOccurrence: Array<{ role: string; count: number }>;
}

export interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  country: string | null;
  city: string | null;
  kycLevel: number;
  verified: boolean;
  createdAt: string;
}

export interface CommissionStats {
  commissions: Array<{
    type: string;
    transaction: string;
    rate: number;
    isLive: boolean;
    transactionCount: number;
    totalVolume: number;
    totalCommission: number;
    min: number;
    max: number;
  }>;
  totals: {
    totalCommission: number;
    totalVolume: number;
    avgRate: number;
    transactionCount: number;
  };
  byCountry: Array<{
    country: string;
    commission: number;
    volume: number;
    count: number;
  }>;
}

// ─── Leases hooks (CDC §5.1) ───────────────────────────────────────────────

export function useAdminLeases(params?: { status?: string; search?: string; country?: string }) {
  return useQuery<Lease[]>({
    queryKey: ['admin', 'leases', params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.search) qs.set('search', params.search);
      if (params?.country) qs.set('country', params.country);
      return apiFetch<Lease[]>(`/admin/leases?${qs.toString()}`, { auth: true });
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminLeaseStats() {
  return useQuery<LeaseStats>({
    queryKey: ['admin', 'leases', 'stats'],
    queryFn: () => apiFetch<LeaseStats>('/admin/leases/stats', { auth: true }),
    staleTime: 60 * 1000,
  });
}

// ─── Investments hooks (CDC §5.1 + §8.3.1) ─────────────────────────────────

export function useAdminInvestmentsStats() {
  return useQuery<InvestmentStats>({
    queryKey: ['admin', 'investments', 'stats'],
    queryFn: () => apiFetch<InvestmentStats>('/admin/investments/stats', { auth: true }),
    staleTime: 60 * 1000,
  });
}

// ─── Rebecca IA hooks (CDC §8.2 + §8.3.3 + §8.3.4) ─────────────────────────

export function useAdminRebeccaStats() {
  return useQuery<RebeccaStats>({
    queryKey: ['admin', 'rebecca', 'stats'],
    queryFn: () => apiFetch<RebeccaStats>('/admin/rebecca/stats', { auth: true }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // poll every 30s for live monitoring
  });
}

export function useAdminRebeccaFraudAlerts(take = 20) {
  return useQuery({
    queryKey: ['admin', 'rebecca', 'fraud-alerts', take],
    queryFn: () => apiFetch(`/admin/rebecca/fraud-alerts?take=${take}`, { auth: true }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ─── Multi-roles management hooks (CDC §3.1.1) ─────────────────────────────

export function useAdminUsersRoles(params?: { search?: string; role?: string; country?: string }) {
  return useQuery<UserWithRoles[]>({
    queryKey: ['admin', 'users-roles', params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.search) qs.set('search', params.search);
      if (params?.role) qs.set('role', params.role);
      if (params?.country) qs.set('country', params.country);
      return apiFetch<UserWithRoles[]>(`/admin/users-roles?${qs.toString()}`, { auth: true });
    },
    staleTime: 30 * 1000,
  });
}

export function useAdminRolesDistribution() {
  return useQuery<RolesDistribution>({
    queryKey: ['admin', 'roles', 'distribution'],
    queryFn: () => apiFetch<RolesDistribution>('/admin/roles/distribution', { auth: true }),
    staleTime: 60 * 1000,
  });
}

export function useAdminRoleMutations() {
  const qc = useQueryClient();

  const addRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`, {
        method: 'POST',
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users-roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'roles', 'distribution'] });
    },
  });

  const removeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`, {
        method: 'DELETE',
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users-roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'roles', 'distribution'] });
    },
  });

  const setPrimaryRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/primary-role/${encodeURIComponent(role)}`, {
        method: 'PATCH',
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users-roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'roles', 'distribution'] });
    },
  });

  return { addRole, removeRole, setPrimaryRole };
}

// ─── Commissions hooks (CDC §6.2) ──────────────────────────────────────────

export function useAdminCommissions() {
  return useQuery<CommissionStats>({
    queryKey: ['admin', 'settings', 'commissions'],
    queryFn: () => apiFetch<CommissionStats>('/admin/settings/commissions', { auth: true }),
    staleTime: 60 * 1000,
  });
}
