import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useProfiles(role?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['profiles', role, page, limit],
    queryFn: () => apiFetch<{ profiles: unknown[]; pagination: unknown }>(`/api/profiles?${params.toString()}`),
  });
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => apiFetch<unknown>(`/api/profiles?userId=${userId}`),
    enabled: !!userId,
  });
}
