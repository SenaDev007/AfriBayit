import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

export function useHotels(city?: string, country?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['hotels', city, country, page, limit],
    queryFn: () => apiFetch<{ hotels: unknown[]; pagination: unknown }>(`/api/hotels?${params.toString()}`),
  });
}

export function useHotel(id: string) {
  return useQuery({
    queryKey: ['hotel', id],
    queryFn: () => apiFetch<unknown>(`/api/hotels/${id}`),
    enabled: !!id,
  });
}

export function useHotelRooms(hotelId: string) {
  return useQuery({
    queryKey: ['hotel-rooms', hotelId],
    queryFn: () => apiFetch<{ rooms: unknown[] }>(`/api/hotels/${hotelId}/rooms`),
    enabled: !!hotelId,
  });
}

export function useHotelReviews(hotelId: string) {
  return useQuery({
    queryKey: ['hotel-reviews', hotelId],
    queryFn: () => apiFetch<{ reviews: unknown[] }>(`/api/hotels/${hotelId}/reviews`),
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
