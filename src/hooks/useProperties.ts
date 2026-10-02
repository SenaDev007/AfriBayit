import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiDelete } from '@/lib/api-client';
import type { PropertyData, PropertiesResponse, PropertyDetailResponse } from '@/lib/afribayit-utils';

export interface PropertyFilters {
  type?: string;
  transaction?: string;
  city?: string;
  country?: string;
  minPrice?: string;
  maxPrice?: string;
  verified?: string;
  geoTrust?: string;
  premium?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export function useProperties(filters: PropertyFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);
  if (filters.transaction && filters.transaction !== 'all') params.set('transaction', filters.transaction);
  if (filters.city && filters.city !== 'all') params.set('city', filters.city);
  if (filters.country && filters.country !== 'all') params.set('country', filters.country);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.verified) params.set('verified', filters.verified);
  if (filters.geoTrust) params.set('geoTrust', filters.geoTrust);
  if (filters.premium) params.set('premium', filters.premium);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 12));

  return useQuery<PropertiesResponse>({
    queryKey: ['properties', filters],
    queryFn: () => api.get<PropertiesResponse>(`/api/properties?${params.toString()}`),
  });
}

export function useProperty(id: string) {
  return useQuery<PropertyDetailResponse>({
    queryKey: ['property', id],
    queryFn: async () => {
      try {
        // L'API monolithe renvoie { data: property } (cf. /api/properties/[id]).
        // On accepte aussi l'ancien format { property } par robustesse.
        const raw = await api.get<{ data?: PropertyData; property?: PropertyData }>(
          `/api/properties/${id}`,
        );
        return { property: raw?.data ?? raw?.property };
      } catch (err) {
        // 404 = bien supprimé / inexistant → UI « Bien non trouvé »
        // (et non « Erreur de chargement », réservée aux vraies erreurs réseau).
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode?: number }).statusCode === 404) {
          return { property: undefined };
        }
        throw err;
      }
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/properties', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
}

// Re-export PropertyData for convenience
export type { PropertyData };

/** Hook to fetch the current user's own property listings (all statuses) */
export function useMyProperties(userId?: string, page = 1, limit = 50) {
  const params = new URLSearchParams();
  if (userId) params.set('agentId', userId);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery<PropertiesResponse>({
    queryKey: ['my-properties', userId, page, limit],
    queryFn: () => api.get<PropertiesResponse>(`/api/properties?${params.toString()}`),
    enabled: !!userId,
  });
}
