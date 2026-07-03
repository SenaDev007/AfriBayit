import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

export interface HotelFilters {
  city?: string;
  country?: string;
  stars?: number;
  available?: boolean;
  page?: number;
  limit?: number;
}

export function useHotels(city?: string, country?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['hotels', city, country, page, limit],
    queryFn: () => api.get<{ hotels: unknown[]; pagination: unknown }>(`/api/hotels?${params.toString()}`),
  });
}

export function useHotelsFiltered(filters: HotelFilters) {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.country) params.set('country', filters.country);
  if (filters.stars) params.set('stars', String(filters.stars));
  if (filters.available !== undefined) params.set('available', String(filters.available));
  params.set('page', String(filters.page || 1));
  params.set('limit', String(filters.limit || 12));

  return useQuery({
    queryKey: ['hotels', filters.city, filters.country, filters.stars, filters.available, filters.page, filters.limit],
    queryFn: () => api.get<{ hotels: unknown[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/hotels?${params.toString()}`),
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: ['hotel', id],
    queryFn: () => api.get<unknown>(`/api/hotels/${id}`),
    enabled: !!id,
  });
}

export function useHotelRooms(hotelId: string) {
  return useQuery({
    queryKey: ['hotel-rooms', hotelId],
    queryFn: () => api.get<unknown[]>(`/api/hotels/${hotelId}/rooms`),
    enabled: !!hotelId,
  });
}

export function useHotelReviews(hotelId: string) {
  return useQuery({
    queryKey: ['hotel-reviews', hotelId],
    queryFn: () => api.get<{ reviews: unknown[] }>(`/api/hotels/${hotelId}/reviews`),
    enabled: !!hotelId,
  });
}

export function useCreateHotelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { hotelId: string; checkIn: string; checkOut: string; guests: number; specialRequests?: string; [key: string]: unknown }) =>
      apiPost(`/api/hotels/${data.hotelId}/bookings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotel-bookings'] });
    },
  });
}
