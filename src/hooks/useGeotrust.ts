import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

export function useGeometers(city?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['geotrust', city, country, page, limit],
    queryFn: () => api<{ geometers: unknown[]; pagination: unknown }>(`/api/geotrust?${params.toString()}`),
  });
}

export function useGeometerMissions(propertyId?: string) {
  const params = new URLSearchParams();
  if (propertyId) params.set('propertyId', propertyId);

  return useQuery({
    queryKey: ['geotrust-missions', propertyId],
    queryFn: () => api<{ missions: unknown[] }>(`/api/geotrust/missions?${params.toString()}`),
  });
}

export function useGeometerReports(geometerId: string) {
  return useQuery({
    queryKey: ['geotrust-reports', geometerId],
    queryFn: () => api<{ reports: unknown[] }>(`/api/geotrust/${geometerId}/reports`),
    enabled: !!geometerId,
  });
}

export function useCreateGeotrustMission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { geometerId: string; serviceCode: string; propertyId?: string; notes?: string; price?: number; [key: string]: unknown }) =>
      apiPost('/api/geotrust/missions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geotrust-missions'] });
    },
  });
}
