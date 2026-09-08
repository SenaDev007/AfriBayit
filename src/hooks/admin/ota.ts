import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

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
    queryFn: () => api.get(`/api/admin/ota?${params.toString()}`),
  });
}

