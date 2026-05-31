import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

export function useCommunityPosts(category?: string, country?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['community-posts', category, country, page, limit],
    queryFn: () => apiFetch<{ posts: unknown[]; pagination: unknown }>(`/api/community/posts?${params.toString()}`),
  });
}

export function useCommunityGroups(type?: string, country?: string) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (country) params.set('country', country);

  return useQuery({
    queryKey: ['community-groups', type, country],
    queryFn: () => apiFetch<{ groups: unknown[] }>(`/api/community/groups?${params.toString()}`),
  });
}

export function useCommunityEvents(country?: string, city?: string) {
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  if (city) params.set('city', city);

  return useQuery({
    queryKey: ['community-events', country, city],
    queryFn: () => apiFetch<{ events: unknown[] }>(`/api/community/events?${params.toString()}`),
  });
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; category?: string; tags?: string[]; [key: string]: unknown }) =>
      apiPost('/api/community/posts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
}

export function useRegisterCommunityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { eventId: string; userId?: string }) =>
      apiPost(`/api/community/events/${data.eventId}/register`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-events'] });
    },
  });
}
