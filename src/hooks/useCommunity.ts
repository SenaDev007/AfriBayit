import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost, apiDelete } from '@/lib/api-client';

export function useCommunityPosts(category?: string, country?: string, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['community-posts', category, country, page, limit],
    queryFn: () => api.get<{ posts: unknown[]; pagination: unknown }>(`/api/community/posts?${params.toString()}`),
  });
}

export function useCommunityGroups(type?: string, country?: string) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (country) params.set('country', country);

  return useQuery({
    queryKey: ['community-groups', type, country],
    queryFn: () => api.get<{ groups: unknown[] }>(`/api/community/groups?${params.toString()}`),
  });
}

export function useCommunityEvents(country?: string, city?: string) {
  const params = new URLSearchParams();
  if (country) params.set('country', country);
  if (city) params.set('city', city);

  return useQuery({
    queryKey: ['community-events', country, city],
    queryFn: () => api.get<{ events: unknown[] }>(`/api/community/events?${params.toString()}`),
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

// ============ Detail Page Hooks ============

export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: ['community-post', id],
    queryFn: () => api.get<{ data: unknown }>(`/api/community/posts/${id}`),
    enabled: !!id,
  });
}

export function useCommunityPostReplies(id: string) {
  return useQuery({
    queryKey: ['community-post-replies', id],
    queryFn: () => api.get<{ data: unknown[]; pagination: unknown }>(`/api/community/posts/${id}/replies`),
    enabled: !!id,
  });
}

export function useCreateReply(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string }) =>
      apiPost(`/api/community/posts/${postId}/replies`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-post-replies', postId] });
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
}

export function useLikePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (liked: boolean) => {
      if (liked) {
        return apiDelete(`/api/community/posts/${postId}/like`);
      }
      return apiPost(`/api/community/posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
}

export function useReportContent() {
  return useMutation({
    mutationFn: (data: { content: string; contentId?: string; type?: string; reason?: string }) =>
      apiPost('/api/community/moderate', data),
  });
}

export function useCommunityGroup(id: string) {
  return useQuery({
    queryKey: ['community-group', id],
    queryFn: () => api.get<{ data: unknown }>(`/api/community/groups/${id}`),
    enabled: !!id,
  });
}

export function useCommunityGroupMembers(id: string) {
  return useQuery({
    queryKey: ['community-group-members', id],
    queryFn: () => api.get<{ data: unknown[]; pagination: unknown }>(`/api/community/groups/${id}/members`),
    enabled: !!id,
  });
}

export function useJoinGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost(`/api/community/groups/${groupId}/members`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['community-group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['community-groups'] });
    },
  });
}

export function useCommunityEvent(id: string) {
  return useQuery({
    queryKey: ['community-event', id],
    queryFn: () => api.get<{ data: unknown }>(`/api/community/events/${id}`),
    enabled: !!id,
  });
}

export function useRegisterEvent(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost(`/api/community/events/${eventId}/register`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['community-events'] });
    },
  });
}
