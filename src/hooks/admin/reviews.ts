import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

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
    queryFn: () => api.get<AdminReviewResponse>(`/api/admin/reviews?${params.toString()}`),
  });
}

