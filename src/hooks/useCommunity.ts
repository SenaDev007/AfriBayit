import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

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
