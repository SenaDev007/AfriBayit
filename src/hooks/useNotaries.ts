import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

export function useNotaries(specialty?: string, zone?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (specialty) params.set('specialty', specialty);
  if (zone) params.set('zone', zone);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['notaries', specialty, zone, country, page, limit],
    queryFn: () => api.get<{ notaries: unknown[]; pagination: unknown }>(`/api/notaries?${params.toString()}`),
  });
}

export function useNotary(id: string) {
  return useQuery({
    queryKey: ['notary', id],
    queryFn: () => api.get<unknown>(`/api/notaries/${id}`),
    enabled: !!id,
  });
}
