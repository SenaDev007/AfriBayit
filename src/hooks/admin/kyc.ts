import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

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
    queryFn: () => api.get<AdminKycResponse>(`/api/admin/kyc?${params.toString()}`),
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

