import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

export function useArtisans(trade?: string, city?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (trade) params.set('trade', trade);
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['artisans', trade, city, country, page, limit],
    queryFn: () => api<{ artisans: unknown[]; pagination: unknown }>(`/api/artisans?${params.toString()}`),
  });
}

export function useArtisanQuotes(artisanId: string) {
  return useQuery({
    queryKey: ['artisan-quotes', artisanId],
    queryFn: () => api<{ quotes: unknown[] }>(`/api/artisans/${artisanId}/quotes`),
    enabled: !!artisanId,
  });
}

export function useCreateArtisanQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { artisanId: string; [key: string]: unknown }) => apiPost(`/api/artisans/${data.artisanId}/quotes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-quotes'] });
    },
  });
}
