import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CountryCode } from '@/contexts/CountryContext';

export function useProfiles(role?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['profiles', role, country, page, limit],
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
