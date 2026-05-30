import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

export function useArtisans(trade?: string, city?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (trade) params.set('trade', trade);
  if (city) params.set('city', city);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['artisans', trade, city, page, limit],
    queryFn: () => apiFetch<{ artisans: unknown[]; pagination: unknown }>(`/api/artisans?${params.toString()}`),
  });
}

export function useArtisanQuotes(artisanId: string) {
  return useQuery({
    queryKey: ['artisan-quotes', artisanId],
    queryFn: () => apiFetch<{ quotes: unknown[] }>(`/api/artisans/${artisanId}/quotes`),
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
