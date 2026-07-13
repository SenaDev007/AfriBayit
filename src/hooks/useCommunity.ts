import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

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
//
// P0-7 fix: the backend returns the post/group/event object directly (not
// wrapped in `{ data: ... }`). We defensively unwrap with
// `response.data ?? response` so the hooks keep working regardless of
// whether a future backend version starts wrapping responses.

export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: ['community-post', id],
    queryFn: async () => {
      const res: any = await api.get(`/api/community/posts/${id}`);
      // Backend returns the post directly; some legacy routes wrap in `{ data }`.
      const post = res?.data ?? res;
      return { post, data: post };
    },
    enabled: !!id,
  });
}

export function useCommunityPostReplies(id: string) {
  return useQuery({
    queryKey: ['community-post-replies', id],
    queryFn: async () => {
      const res: any = await api.get(`/api/community/posts/${id}/replies`);
      // Backend wraps replies in `{ replies: [...] }`; some legacy routes
      // wrap in `{ data: [...] }`. Unwrap defensively.
      const replies = res?.data ?? res?.replies ?? [];
      const pagination = res?.pagination ?? null;
      return { replies, data: replies, pagination };
    },
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

// P0-7 fix: the backend `POST /community/posts/:id/like` is a TOGGLE —
// it flips the like state and returns the new state. The old hook tried
// to `DELETE` to unlike, which the backend doesn't support. We just POST
// every time and let the backend toggle.
export function useLikePost(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_liked: boolean) =>
      apiPost(`/api/community/posts/${postId}/like`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
  });
}

// P0-7 fix: the moderation endpoint is `POST /community/reports`
// (was `POST /community/moderate`).
export function useReportContent() {
  return useMutation({
    mutationFn: (data: { content: string; contentId?: string; type?: string; reason?: string }) =>
      apiPost('/api/community/reports', data),
  });
}

export function useCommunityGroup(id: string) {
  return useQuery({
    queryKey: ['community-group', id],
    queryFn: async () => {
      const res: any = await api.get(`/api/community/groups/${id}`);
      const group = res?.data ?? res;
      return { group, data: group };
    },
    enabled: !!id,
  });
}

export function useCommunityGroupMembers(id: string) {
  return useQuery({
    queryKey: ['community-group-members', id],
    queryFn: async () => {
      const res: any = await api.get(`/api/community/groups/${id}/members`);
      const members = res?.data ?? res?.members ?? [];
      const pagination = res?.pagination ?? null;
      return { members, data: members, pagination };
    },
    enabled: !!id,
  });
}

// P0-7 fix: the join-group endpoint is `POST /community/groups/:id/join`
// (was `POST /community/groups/:id/members`).
export function useJoinGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost(`/api/community/groups/${groupId}/join`, {}),
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
    queryFn: async () => {
      const res: any = await api.get(`/api/community/events/${id}`);
      const event = res?.data ?? res;
      return { event, data: event };
    },
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
