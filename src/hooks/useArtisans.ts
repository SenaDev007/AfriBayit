import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiPatch } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

/** List artisans with filters */
export function useArtisans(trade?: string, city?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (trade) params.set('trade', trade);
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['artisans', trade, city, country, page, limit],
    queryFn: () => api.get<{ artisans: unknown[]; pagination: unknown }>(`/api/artisans?${params.toString()}`),
  });
}

/** Get artisan detail (profile + services + reviews) */
export function useArtisanDetail(artisanId: string) {
  return useQuery({
    queryKey: ['artisan-detail', artisanId],
    queryFn: () => api.get<{ artisan: unknown }>(`/api/artisans/${artisanId}`),
    enabled: !!artisanId,
  });
}

/** List services offered by an artisan */
export function useArtisanServices(artisanId: string) {
  return useQuery({
    queryKey: ['artisan-services', artisanId],
    queryFn: () => api.get<{ services: unknown[] }>(`/api/artisans/${artisanId}/services`),
    enabled: !!artisanId,
  });
}

/** List quotes received by an artisan */
export function useArtisanQuotes(artisanId: string) {
  return useQuery({
    queryKey: ['artisan-quotes', artisanId],
    queryFn: () => api.get<{ quotes: unknown[] }>(`/api/artisans/${artisanId}/quotes`),
    enabled: !!artisanId,
  });
}

/** Request a quote from an artisan */
export function useCreateArtisanQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { artisanId: string; [key: string]: unknown }) =>
      apiPost(`/api/artisans/${data.artisanId}/quotes`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-quotes'] });
    },
  });
}

/** Artisan responds to a quote */
export function useRespondToQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { quoteId: string; status: string; artisanResponse?: string; quotedPrice?: number; quotedDuration?: string }) =>
      apiPatch(`/api/artisans/quotes/${data.quoteId}/respond`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisan-quotes'] });
    },
  });
}

/** ProMatch: find best artisans for a project */
export function useProMatch() {
  return useMutation({
    mutationFn: (data: { trade?: string; city?: string; country?: string; budget?: number }) =>
      apiPost('/api/artisans/promatch/match', data),
  });
}
