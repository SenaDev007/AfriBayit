import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => apiFetch<{ conversations: unknown[] }>(`/api/chat/conversations?userId=${userId || ''}`),
    enabled: !!userId,
  });
}

export function useChatMessages(conversationId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['chat-messages', conversationId, page, limit],
    queryFn: () => apiFetch<{ messages: unknown[]; pagination: unknown }>(`/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, ...data }: { conversationId: string; senderId: string; content: string; messageType?: string }) =>
      apiPost(`/api/chat/conversations/${conversationId}/messages`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.conversationId] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost('/api/chat/conversations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
