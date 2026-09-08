import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';
import type { AdminUserFilters, AdminUser, AdminUsersResponse } from './types';

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
    queryFn: () => api.get<AdminUsersResponse>(`/api/admin/users?${params.toString()}`),
  });
}

export function useAdminUser(id: string) {
  return useQuery<{ user: AdminUser & { properties: unknown[]; transactions: unknown[]; kycDocuments: unknown[] } }>({
    queryKey: ['admin-user', id],
    queryFn: () => api.get(`/api/admin/users/${id}`),
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

