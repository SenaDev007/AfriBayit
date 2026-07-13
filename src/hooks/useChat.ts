import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

// P0-8 fix: the chat endpoints live under `/chat/conversations` and
// `/chat/conversations/:id/messages` (the old `/messages*` routes were
// never implemented on the backend). All endpoints require a JWT.

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => api.get<{ conversations: unknown[] }>(`/api/chat/conversations`),
    enabled: !!userId,
    refetchInterval: 10000, // Poll every 10s for new conversations
  });
}

export function useChatMessages(conversationId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['chat-messages', conversationId, page, limit],
    queryFn: () =>
      api.get<{ messages: unknown[]; pagination: unknown }>(
        `/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
      ),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5s for new messages
  });
}

// P0-8 fix: send message goes to `/chat/conversations/:id/messages`.
// If `conversationId` is omitted the backend would need a separate
// "start conversation + send first message" flow — we fall back to the
// `POST /chat/conversations` endpoint for that case via `useCreateConversation`.
export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      ...data
    }: {
      conversationId?: string;
      recipientId?: string;
      senderId?: string;
      content: string;
      messageType?: string;
    }) => {
      if (!conversationId) {
        // No conversation yet — create one (the backend creates + returns
        // a conversation; the first message must then be sent separately).
        return apiPost('/api/chat/conversations', data);
      }
      return apiPost(`/api/chat/conversations/${conversationId}/messages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
