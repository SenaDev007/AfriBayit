import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

export function useGuesthouses(city?: string, country?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['guesthouses', city, country, page, limit],
    queryFn: () => api<{ guesthouses: unknown[]; pagination: unknown }>(`/api/guesthouses?${params.toString()}`),
  });
}

export function useGuesthouse(id: string) {
  return useQuery({
    queryKey: ['guesthouse', id],
    queryFn: () => api<unknown>(`/api/guesthouses/${id}`),
    enabled: !!id,
  });
}

export function useGuesthouseRooms(guesthouseId: string) {
  return useQuery({
    queryKey: ['guesthouse-rooms', guesthouseId],
    queryFn: () => api<{ rooms: unknown[] }>(`/api/guesthouses/${guesthouseId}/rooms`),
    enabled: !!guesthouseId,
  });
}

export function useGuesthouseBookings(guesthouseId: string, status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  return useQuery({
    queryKey: ['guesthouse-bookings', guesthouseId, status],
    queryFn: () => api<{ bookings: unknown[]; pagination: unknown }>(`/api/guesthouses/${guesthouseId}/bookings?${params.toString()}`),
    enabled: !!guesthouseId,
  });
}

export function useCreateBooking(guesthouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      roomId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      totalPrice: number;
      currency?: string;
      breakfastIncluded?: boolean;
      paymentRef?: string;
      paymentProvider?: string;
    }) => apiPost(`/api/guesthouses/${guesthouseId}/bookings`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guesthouse-bookings', guesthouseId] });
      queryClient.invalidateQueries({ queryKey: ['guesthouse', guesthouseId] });
    },
  });
}
