import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

interface PropertyFilters {
  type?: string;
  transaction?: string;
  city?: string;
  country?: string;
  minPrice?: string;
  maxPrice?: string;
  verified?: string;
  geoTrust?: string;
  page?: number;
  limit?: number;
}

export function useProperties(filters: PropertyFilters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.transaction) params.set('transaction', filters.transaction);
  if (filters.city) params.set('city', filters.city);
  if (filters.country) params.set('country', filters.country);
  if (filters.minPrice) params.set('minPrice', filters.minPrice);
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
  if (filters.verified) params.set('verified', filters.verified);
  if (filters.geoTrust) params.set('geoTrust', filters.geoTrust);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 12));

  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => apiFetch<{ properties: unknown[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/properties?${params.toString()}`),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => apiFetch<unknown>(`/api/properties/${id}`),
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
