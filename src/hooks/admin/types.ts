import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
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

