import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { CountryCode } from '@/contexts/CountryContext';

// ============ Types ============

export interface AdminStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    byCountry: Record<string, number>;
    recent7d: number;
    recent30d: number;
  };
  properties: {
    total: number;
    byStatus: Record<string, number>;
    byCountry: Record<string, number>;
    pending: number;
  };
  transactions: {
    total: number;
    totalVolume: number;
    totalCommission: number;
    byStatus: Record<string, number>;
  };
  escrow: {
    active: number;
    totalHeld: number;
  };
  kyc: {
    pending: number;
  };
  revenue: {
    monthly: Array<{ month: string; amount: number }>;
  };
  platform: {
    activeUsers24h: number;
    uptime: number;
  };
}

export interface AdminUserFilters {
  role?: string;
  country?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  country: string | null;
  city: string | null;
  kycLevel: number;
  score: number;
  reputation: string;
  verified: boolean;
  premiumTier: string | null;
  walletBalance: number;
  escrowHeld: number;
  afriPoints: number;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    properties: number;
    transactions: number;
    reviews: number;
  };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminPropertyFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminTransactionFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============ Stats Hook ============

export function useAdminStats(country?: CountryCode | 'ALL') {
  const params = new URLSearchParams();
  if (country && country !== 'ALL') params.set('country', country);

  return useQuery<AdminStats>({
    queryKey: ['admin-stats', country],
    queryFn: () => apiFetch<AdminStats>(`/api/admin/stats?${params.toString()}`),
    refetchInterval: 30000,
  });
}

// ============ Users Hooks ============

export function useAdminUsers(filters: AdminUserFilters = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.country) params.set('country', filters.country);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery<AdminUsersResponse>({
    queryKey: ['admin-users', filters],
    queryFn: () => apiFetch<AdminUsersResponse>(`/api/admin/users?${params.toString()}`),
  });
}

export function useAdminUser(id: string) {
  return useQuery<{ user: AdminUser & { properties: unknown[]; transactions: unknown[]; kycDocuments: unknown[] } }>({
    queryKey: ['admin-user', id],
    queryFn: () => apiFetch(`/api/admin/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AdminUser>) => apiPatch(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
  });
}

export function useDeleteUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// ============ Properties Hook ============

export function useAdminProperties(filters: AdminPropertyFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-properties', filters],
    queryFn: () => apiFetch(`/api/admin/properties?${params.toString()}`),
  });
}

// ============ Transactions Hook ============

export function useAdminTransactions(filters: AdminTransactionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-transactions', filters],
    queryFn: () => apiFetch(`/api/admin/transactions?${params.toString()}`),
  });
}

// ============ Wallets Hooks ============

export interface AdminWalletFilters {
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export function useAdminWallets(filters: AdminWalletFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.country) params.set('country', filters.country);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-wallets', filters],
    queryFn: () => apiFetch(`/api/admin/wallets?${params.toString()}`),
  });
}

// ============ Subscriptions Hooks ============

export interface AdminSubscriptionFilters {
  planType?: string;
  status?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export function useAdminSubscriptions(filters: AdminSubscriptionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.planType) params.set('planType', filters.planType);
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-subscriptions', filters],
    queryFn: () => apiFetch(`/api/admin/subscriptions?${params.toString()}`),
  });
}

// ============ Hotels Hooks ============

export interface AdminHotelFilters {
  country?: string;
  status?: string;
  connectionLevel?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminHotels(filters: AdminHotelFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.status) params.set('status', filters.status);
  if (filters.connectionLevel) params.set('connectionLevel', filters.connectionLevel);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-hotels', filters],
    queryFn: () => apiFetch(`/api/admin/hotels?${params.toString()}`),
  });
}

// ============ Guesthouses Hooks ============

export interface AdminGuesthouseFilters {
  country?: string;
  certificationStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminGuesthouses(filters: AdminGuesthouseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.certificationStatus) params.set('certificationStatus', filters.certificationStatus);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-guesthouses', filters],
    queryFn: () => apiFetch(`/api/admin/guesthouses?${params.toString()}`),
  });
}

// ============ Community Hooks ============

export interface AdminCommunityFilters {
  tab?: string;
  category?: string;
  country?: string;
  flagged?: boolean;
  rating?: string;
  page?: number;
  limit?: number;
}

export function useAdminCommunity(filters: AdminCommunityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  if (filters.flagged) params.set('flagged', 'true');
  if (filters.rating) params.set('rating', filters.rating);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-community', filters],
    queryFn: () => apiFetch(`/api/admin/community?${params.toString()}`),
  });
}

// ============ Courses Hooks ============

export interface AdminCourseFilters {
  category?: string;
  country?: string;
  level?: string;
  published?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminCourses(filters: AdminCourseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  if (filters.level) params.set('level', filters.level);
  if (filters.published) params.set('published', filters.published);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery({
    queryKey: ['admin-courses', filters],
    queryFn: () => apiFetch(`/api/admin/courses?${params.toString()}`),
  });
}

// ============ Analytics Hooks ============

export interface AdminAnalyticsFilters {
  range?: string;
  country?: string;
}

export function useAdminAnalytics(filters: AdminAnalyticsFilters = {}) {
  const params = new URLSearchParams();
  if (filters.range) params.set('range', filters.range);
  if (filters.country) params.set('country', filters.country);

  return useQuery({
    queryKey: ['admin-analytics', filters],
    queryFn: () => apiFetch(`/api/admin/analytics?${params.toString()}`),
    refetchInterval: 60000,
  });
}

// ============ Admin Action Mutations ============

export function useAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, method, data }: { path: string; method: 'post' | 'patch' | 'delete'; data?: unknown }) => {
      if (method === 'post') return apiPost(path, data);
      if (method === 'patch') return apiPatch(path, data);
      return apiDelete(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-'] });
    },
  });
}

// ============ KYC Hooks ============

export interface AdminKycFilters {
  status?: string;
  country?: string;
  docType?: string;
  page?: number;
  limit?: number;
}

export interface AdminKycDocument {
  id: string;
  userId: string;
  docType: string;
  docUrl: string;
  ocrResult: string | null;
  ocrValid: boolean;
  aiScore: number | null;
  status: string;
  rejectionReason: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    country: string | null;
  };
}

export interface AdminKycResponse {
  documents: AdminKycDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    pending: number;
    avgAiScore: number;
    validatedToday: number;
  };
}

export function useAdminKyc(filters: AdminKycFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.docType) params.set('docType', filters.docType);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminKycResponse>({
    queryKey: ['admin-kyc', filters],
    queryFn: () => apiFetch<AdminKycResponse>(`/api/admin/kyc?${params.toString()}`),
  });
}

export function useValidateKyc(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { status: string; rejectionReason?: string }) =>
      apiPost(`/api/kyc/${id}/validate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
    },
  });
}

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
    queryFn: () => apiFetch<AdminEscrowResponse>(`/api/admin/escrow?${params.toString()}`),
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

// ============ Property Admin Actions ============

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPatch(`/api/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
    },
  });
}

// ============ Audit Logs Hooks ============

export interface AdminAuditLogFilters {
  actorId?: string;
  action?: string;
  targetType?: string;
  country?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AdminAuditLog {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  country: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AdminAuditLogsResponse {
  data: AdminAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useAdminAuditLogs(filters: AdminAuditLogFilters = {}) {
  const params = new URLSearchParams();
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.action) params.set('action', filters.action);
  if (filters.targetType) params.set('targetType', filters.targetType);
  if (filters.country) params.set('country', filters.country);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));

  return useQuery<AdminAuditLogsResponse>({
    queryKey: ['admin-audit-logs', filters],
    queryFn: () => apiFetch<AdminAuditLogsResponse>(`/api/admin/audit-logs?${params.toString()}`),
  });
}

// ============ Short Term Rentals Hooks ============

export interface AdminShortTermRentalFilters {
  status?: string;
  country?: string;
  search?: string;
  tab?: string;
  page?: number;
  limit?: number;
}

export function useAdminShortTermRentals(filters: AdminShortTermRentalFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  if (filters.tab) params.set('tab', filters.tab);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-short-term-rentals', filters],
    queryFn: () => apiFetch(`/api/admin/short-term-rentals?${params.toString()}`),
  });
}

// ============ Bookings Hooks ============

export interface AdminBookingFilters {
  status?: string;
  country?: string;
  search?: string;
  tab?: string;
  page?: number;
  limit?: number;
}

export function useAdminBookings(filters: AdminBookingFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  if (filters.tab) params.set('tab', filters.tab);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-bookings', filters],
    queryFn: () => apiFetch(`/api/admin/bookings?${params.toString()}`),
  });
}

// ============ Disputes Hooks ============

export interface AdminDisputeFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminDisputes(filters: AdminDisputeFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-disputes', filters],
    queryFn: () => apiFetch(`/api/admin/disputes?${params.toString()}`),
  });
}

export function useResolveDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; buyerPercentage: number; sellerPercentage: number; resolution: string }) =>
      apiPatch(`/api/admin/disputes/${data.id}`, {
        action: 'resolve',
        buyerPercentage: data.buyerPercentage,
        sellerPercentage: data.sellerPercentage,
        resolution: data.resolution,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });
}

export function useEscalateDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string }) =>
      apiPatch(`/api/admin/disputes/${data.id}`, { action: 'escalate' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
  });
}

// ============ Payouts Hooks ============

export interface AdminPayoutFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminPayouts(filters: AdminPayoutFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery({
    queryKey: ['admin-payouts', filters],
    queryFn: () => apiFetch(`/api/admin/payouts?${params.toString()}`),
  });
}

export function useProcessPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; action: string; reason?: string }) =>
      apiPatch(`/api/admin/payouts/${data.id}`, { action: data.action, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    },
  });
}

// ============ Content Hooks ============

export interface AdminContentFilters {
  country?: string;
}

export function useAdminContent(filters: AdminContentFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);

  return useQuery({
    queryKey: ['admin-content', filters],
    queryFn: () => apiFetch(`/api/admin/content?${params.toString()}`),
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sectionKey: string; itemKey: string; value: string; country?: string }) =>
      apiPatch('/api/admin/content', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    },
  });
}

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
    queryFn: () => apiFetch<AdminRevenueResponse>(`/api/admin/revenue?${params.toString()}`),
  });
}

// ============ OTA Hooks ============

export interface AdminOtaProvidersResponse {
  providers: Array<{
    id: string;
    name: string;
    status: string;
    hotelsConnected: number;
    lastSync: string | null;
  }>;
  summary: {
    totalProviders: number;
    totalSyncLogs: number;
    lastSyncAt: string | null;
    parityViolations: number;
  };
}

export interface AdminOtaSyncLog {
  id: string;
  hotelId: string;
  ota: string;
  operation: string;
  status: string;
  roomsUpdated: number | null;
  errorMessage: string | null;
  executedAt: string;
  hotel: { id: string; name: string; country: string | null };
}

export interface AdminOtaSyncLogsResponse {
  syncLogs: AdminOtaSyncLog[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: {
    totalProviders: number;
    totalSyncLogs: number;
    lastSyncAt: string | null;
    parityViolations: number;
  };
}

export interface AdminOtaHotel {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  otaRefs: string | null;
  channelInventory: unknown[];
}

export interface AdminOtaMappingsResponse {
  hotels: AdminOtaHotel[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: {
    totalProviders: number;
    totalSyncLogs: number;
    lastSyncAt: string | null;
    parityViolations: number;
  };
}

export interface AdminOtaParityViolation {
  roomId: string;
  roomType: string;
  hotelId: string;
  hotelName: string;
  country: string;
  rates: Array<{ ota: string; rateXof: number | null }>;
}

export interface AdminOtaParityResponse {
  violations: AdminOtaParityViolation[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: {
    totalProviders: number;
    totalSyncLogs: number;
    lastSyncAt: string | null;
    parityViolations: number;
  };
}

export function useAdminOta(filters: { tab?: string; country?: string; status?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.country) params.set('country', filters.country);
  if (filters.status) params.set('status', filters.status);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 25));
  return useQuery({
    queryKey: ['admin-ota', filters],
    queryFn: () => apiFetch(`/api/admin/ota?${params.toString()}`),
  });
}

// ============ Artisans Hooks ============

export interface AdminArtisanFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminArtisanResponse {
  artisans: Array<{
    id: string;
    name: string;
    avatar: string | null;
    specialty: string;
    country: string;
    city: string;
    rating: number;
    verified: boolean;
    status: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; verified: number; pending: number; byCountry: Record<string, number> };
}

export function useAdminArtisans(filters: AdminArtisanFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminArtisanResponse>({
    queryKey: ['admin-artisans', filters],
    queryFn: () => apiFetch<AdminArtisanResponse>(`/api/admin/artisans?${params.toString()}`),
  });
}

export function useVerifyArtisan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { verified?: boolean; status?: string }) =>
      apiPatch(`/api/artisans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-artisans'] });
    },
  });
}

// ============ Notaries Hooks ============

export interface AdminNotaryFilters {
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminNotaryResponse {
  notaries: Array<{
    id: string;
    name: string;
    avatar: string | null;
    license: string;
    specializations: string[];
    country: string;
    city: string;
    rating: number;
    verified: boolean;
    status: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; verified: number; pending: number; avgRating: number };
}

export function useAdminNotaries(filters: AdminNotaryFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminNotaryResponse>({
    queryKey: ['admin-notaries', filters],
    queryFn: () => apiFetch<AdminNotaryResponse>(`/api/admin/notaries?${params.toString()}`),
  });
}

// ============ GeoTrust Hooks ============

export interface AdminGeotrustFilters {
  tab?: string;
  status?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminGeotrustResponse {
  geometers: Array<{
    id: string;
    name: string;
    license: string;
    country: string;
    specializations: string[];
    verified: boolean;
    missionsCount: number;
  }>;
  missions: Array<{
    id: string;
    propertyTitle: string;
    geometerName: string;
    status: string;
    scheduledDate: string;
    completedDate: string | null;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { totalGeometers: number; missionsInProgress: number; missionsCompleted: number; completionRate: number };
}

export function useAdminGeotrust(filters: AdminGeotrustFilters = {}) {
  const params = new URLSearchParams();
  if (filters.tab) params.set('tab', filters.tab);
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminGeotrustResponse>({
    queryKey: ['admin-geotrust', filters],
    queryFn: () => apiFetch<AdminGeotrustResponse>(`/api/admin/geotrust?${params.toString()}`),
  });
}

// ============ Reviews Hooks ============

export interface AdminReviewFilters {
  country?: string;
  rating?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminReviewResponse {
  reviews: Array<{
    id: string;
    userName: string;
    propertyTitle: string;
    rating: number;
    comment: string;
    country: string;
    createdAt: string;
    flagged: boolean;
    hidden: boolean;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; avgRating: number; fiveStars: number; flagged: number };
}

export function useAdminReviews(filters: AdminReviewFilters = {}) {
  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.rating) params.set('rating', filters.rating);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminReviewResponse>({
    queryKey: ['admin-reviews', filters],
    queryFn: () => apiFetch<AdminReviewResponse>(`/api/admin/reviews?${params.toString()}`),
  });
}

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
    queryFn: () => apiFetch<AdminAmbassadorResponse>(`/api/admin/ambassadors?${params.toString()}`),
  });
}

// ============ Notifications Hooks ============

export interface AdminNotificationFilters {
  type?: string;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminNotificationResponse {
  notifications: Array<{
    id: string;
    recipientName: string;
    type: string;
    title: string;
    message: string;
    country: string;
    read: boolean;
    createdAt: string;
  }>;
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; unread: number; byType: Record<string, number> };
}

export function useAdminNotifications(filters: AdminNotificationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 20));

  return useQuery<AdminNotificationResponse>({
    queryKey: ['admin-notifications', filters],
    queryFn: () => apiFetch<AdminNotificationResponse>(`/api/admin/notifications?${params.toString()}`),
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId?: string; type: string; title: string; message: string; country?: string }) =>
      apiPost('/api/admin/notifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });
}
