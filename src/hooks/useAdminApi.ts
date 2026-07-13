'use client';

<<<<<<< HEAD
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
=======
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

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

<<<<<<< HEAD
=======
export interface LeaseDetail extends Lease {
  tenant: { id: string; name: string; email: string; phone: string; avatar: string | null };
  owner: { id: string; name: string; email: string; phone: string; avatar: string | null };
  property: { id: string; title: string; city: string; quartier: string; address: string | null; images: string | null; type: string; surface: number; bedrooms: number; bathrooms: number };
  rentPayments: any[];
  documents: any[];
  inventories: any[];
  transaction: { id: string; status: string; amount: number } | null;
  securityDeposit: number;
  leaseTermMonths: number;
  furnished: boolean;
  chargesIncluded: boolean;
  tenantSignedAt: string | null;
  ownerSignedAt: string | null;
  signedAt: string | null;
}

>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
export interface LeaseStats {
  active: number;
  pendingSignature: number;
  latePayment: number;
  terminated: number;
  monthlyRevenue: number;
}

export interface InvestmentStats {
<<<<<<< HEAD
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
=======
  kpis: { investors: number; totalCapital: number; activePriceAlerts: number; avgScore: number; };
  topProperties: Array<{ id: string; title: string; city: string; score: number; investorCount: number; totalInvested: number; transaction: string; }>;
  recentAlerts: Array<{ id: string; propertyTitle: string; type: string; threshold: number | null; currentPrice: number | null; triggeredAt: string | null; userName?: string; }>;
}

export interface RebeccaStats {
  kpis: { conversations24h: number; totalMessages: number; messages30d: number; estimatedCostEur: number; tokensConsumed: number; };
  channels: Array<{ name: string; status: string; conversations24h: number; avgLatency: string; }>;
  fraudAlerts: { count: number; recent: any[] };
  documentAnalysis: { documentsAnalyzed: number; ocrAccuracy: number; anomaliesDetected: number; };
}

export interface ConversationTimeseriesPoint {
  date: string;
  count: number;
  uniqueConversations: number;
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
}

export interface RolesDistribution {
  totalUsers: number;
  multiRoleUsers: number;
  singleRoleUsers: number;
  byPrimaryRole: Array<{ role: string; count: number }>;
  byRoleOccurrence: Array<{ role: string; count: number }>;
}

export interface UserWithRoles {
<<<<<<< HEAD
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
=======
  id: string; email: string; name: string; role: string; roles: string[];
  country: string | null; city: string | null; kycLevel: number; verified: boolean; createdAt: string;
}

export interface CommissionStats {
  commissions: Array<{ type: string; transaction: string; rate: number; isLive: boolean; transactionCount: number; totalVolume: number; totalCommission: number; min: number; max: number; }>;
  totals: { totalCommission: number; totalVolume: number; avgRate: number; transactionCount: number; };
  byCountry: Array<{ country: string; commission: number; volume: number; count: number; }>;
}

export interface SettingsPayments {
  providers: Array<{ name: string; type: string; envVar: string; configured: boolean; masked: string | null; status: string; }>;
  volumeByType: Array<{ type: string; volume: number; count: number; }>;
}

export interface SettingsKycLevels {
  levels: Array<{ level: number; name: string; maxTx: number; canPublish: boolean; canBuy: boolean; label: string; userCount: number; }>;
}

export interface SettingsCountry {
  code: string; name: string; flag: string; subdomain: string; status: string;
  users: number; properties: number;
}

export interface SettingsPremiumTier {
  name: string; price: number; properties: number; boost: boolean; stats: boolean; label: string;
  activeSubscribers: number; monthlyRevenue: number;
}

// ─── Leases ───────────────────────────────────────────────────────────────
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

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

<<<<<<< HEAD
// ─── Investments hooks (CDC §5.1 + §8.3.1) ─────────────────────────────────
=======
export function useAdminLeaseDetail(id: string | null) {
  return useQuery<LeaseDetail>({
    queryKey: ['admin', 'leases', id],
    queryFn: () => apiFetch<LeaseDetail>(`/admin/leases/${id}`, { auth: true }),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

// ─── Investments ──────────────────────────────────────────────────────────
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

export function useAdminInvestmentsStats() {
  return useQuery<InvestmentStats>({
    queryKey: ['admin', 'investments', 'stats'],
    queryFn: () => apiFetch<InvestmentStats>('/admin/investments/stats', { auth: true }),
<<<<<<< HEAD
    staleTime: 60 * 1000,
  });
}

// ─── Rebecca IA hooks (CDC §8.2 + §8.3.3 + §8.3.4) ─────────────────────────
=======
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // poll every 30s for real-time alerts
  });
}

export function useAdminInvestmentsRecentAlerts(take = 10) {
  return useQuery({
    queryKey: ['admin', 'investments', 'recent-alerts', take],
    queryFn: () => apiFetch(`/admin/investments/recent-alerts?take=${take}`, { auth: true }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ─── Rebecca IA ───────────────────────────────────────────────────────────
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

export function useAdminRebeccaStats() {
  return useQuery<RebeccaStats>({
    queryKey: ['admin', 'rebecca', 'stats'],
    queryFn: () => apiFetch<RebeccaStats>('/admin/rebecca/stats', { auth: true }),
    staleTime: 30 * 1000,
<<<<<<< HEAD
    refetchInterval: 30 * 1000, // poll every 30s for live monitoring
=======
    refetchInterval: 30 * 1000,
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
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

<<<<<<< HEAD
// ─── Multi-roles management hooks (CDC §3.1.1) ─────────────────────────────
=======
export function useAdminRebeccaTimeseries() {
  return useQuery<ConversationTimeseriesPoint[]>({
    queryKey: ['admin', 'rebecca', 'timeseries'],
    queryFn: () => apiFetch<ConversationTimeseriesPoint[]>('/admin/rebecca/conversations-timeseries', { auth: true }),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// ─── Multi-roles ──────────────────────────────────────────────────────────
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

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
<<<<<<< HEAD

  const addRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`, {
        method: 'POST',
        auth: true,
      }),
=======
  const addRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`, { method: 'POST', auth: true }),
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users-roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'roles', 'distribution'] });
    },
  });
<<<<<<< HEAD

  const removeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`, {
        method: 'DELETE',
        auth: true,
      }),
=======
  const removeRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/roles/${encodeURIComponent(role)}`, { method: 'DELETE', auth: true }),
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users-roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'roles', 'distribution'] });
    },
  });
<<<<<<< HEAD

  const setPrimaryRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/primary-role/${encodeURIComponent(role)}`, {
        method: 'PATCH',
        auth: true,
      }),
=======
  const setPrimaryRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiFetch(`/admin/users/${userId}/primary-role/${encodeURIComponent(role)}`, { method: 'PATCH', auth: true }),
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users-roles'] });
      qc.invalidateQueries({ queryKey: ['admin', 'roles', 'distribution'] });
    },
  });
<<<<<<< HEAD

  return { addRole, removeRole, setPrimaryRole };
}

// ─── Commissions hooks (CDC §6.2) ──────────────────────────────────────────
=======
  return { addRole, removeRole, setPrimaryRole };
}

// ─── Settings ─────────────────────────────────────────────────────────────
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

export function useAdminCommissions() {
  return useQuery<CommissionStats>({
    queryKey: ['admin', 'settings', 'commissions'],
    queryFn: () => apiFetch<CommissionStats>('/admin/settings/commissions', { auth: true }),
    staleTime: 60 * 1000,
  });
}
<<<<<<< HEAD
=======

export function useAdminSettingsPayments() {
  return useQuery<SettingsPayments>({
    queryKey: ['admin', 'settings', 'payments'],
    queryFn: () => apiFetch<SettingsPayments>('/admin/settings/payments', { auth: true }),
    staleTime: 60 * 1000,
  });
}

export function useAdminSettingsKycLevels() {
  return useQuery<SettingsKycLevels>({
    queryKey: ['admin', 'settings', 'kyc-levels'],
    queryFn: () => apiFetch<SettingsKycLevels>('/admin/settings/kyc-levels', { auth: true }),
    staleTime: 60 * 1000,
  });
}

export function useAdminSettingsCountries() {
  return useQuery<SettingsCountry[]>({
    queryKey: ['admin', 'settings', 'countries'],
    queryFn: () => apiFetch<SettingsCountry[]>('/admin/settings/countries', { auth: true }),
    staleTime: 60 * 1000,
  });
}

export function useAdminSettingsPremiumTiers() {
  return useQuery<SettingsPremiumTier[]>({
    queryKey: ['admin', 'settings', 'premium-tiers'],
    queryFn: () => apiFetch<SettingsPremiumTier[]>('/admin/settings/premium-tiers', { auth: true }),
    staleTime: 60 * 1000,
  });
}
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
