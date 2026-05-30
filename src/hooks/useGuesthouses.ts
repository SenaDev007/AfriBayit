import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useGuesthouses(city?: string, country?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['guesthouses', city, country, page, limit],
    queryFn: () => apiFetch<{ guesthouses: unknown[]; pagination: unknown }>(`/api/guesthouses?${params.toString()}`),
  });
}

export function useGuesthouse(id: string) {
  return useQuery({
    queryKey: ['guesthouse', id],
    queryFn: () => apiFetch<unknown>(`/api/guesthouses/${id}`),
    enabled: !!id,
  });
}

export function useGuesthouseRooms(guesthouseId: string) {
  return useQuery({
    queryKey: ['guesthouse-rooms', guesthouseId],
    queryFn: () => apiFetch<{ rooms: unknown[] }>(`/api/guesthouses/${guesthouseId}/rooms`),
    enabled: !!guesthouseId,
  });
}
