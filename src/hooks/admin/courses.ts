import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

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
    queryFn: () => api.get(`/api/admin/courses?${params.toString()}`),
  });
}

