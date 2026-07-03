import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';
import type { CountryCode } from '@/contexts/CountryContext';

export function useProfiles(role?: string, country?: CountryCode, page = 1, limit = 12) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (country) params.set('country', country);
  params.set('page', String(page));
  params.set('limit', String(limit));

  return useQuery({
    queryKey: ['profiles', role, country, page, limit],
    queryFn: () => api.get<{ profiles: unknown[]; pagination: unknown }>(`/api/profiles?${params.toString()}`),
  });
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.get<unknown>(`/api/profiles?userId=${userId}`),
    enabled: !!userId,
  });
}

export function useFollowProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { profileUserId: string }) =>
      apiPost('/api/chat/conversations', {
        type: 'user_to_user',
        participantIds: [data.profileUserId],
        metadata: { action: 'follow' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
