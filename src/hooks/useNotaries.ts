import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useNotaries(specialty?: string, zone?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (specialty) params.set('specialty', specialty);
  if (zone) params.set('zone', zone);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['notaries', specialty, zone, page, limit],
    queryFn: () => apiFetch<{ notaries: unknown[]; pagination: unknown }>(`/api/notaries?${params.toString()}`),
  });
}

export function useNotary(id: string) {
  return useQuery({
    queryKey: ['notary', id],
    queryFn: () => apiFetch<unknown>(`/api/notaries/${id}`),
    enabled: !!id,
  });
}
