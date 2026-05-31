import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';
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
    queryFn: () => apiFetch<PropertiesResponse>(`/api/properties?${params.toString()}`),
  });
}

export function useProperty(id: string) {
  return useQuery<PropertyDetailResponse>({
    queryKey: ['property', id],
    queryFn: () => apiFetch<PropertyDetailResponse>(`/api/properties/${id}`),
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

// Re-export PropertyData for convenience
export type { PropertyData };
