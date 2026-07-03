import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => api.get<{ conversations: unknown[] }>(`/api/messages?search=`),
    enabled: !!userId,
    refetchInterval: 10000, // Poll every 10s for new conversations
  });
}

export function useChatMessages(conversationId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['chat-messages', conversationId, page, limit],
    queryFn: () => api.get<{ messages: unknown[]; pagination: unknown }>(`/api/messages/${conversationId}?page=${page}&limit=${limit}`),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5s for new messages
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, ...data }: { conversationId?: string; recipientId?: string; senderId?: string; content: string; messageType?: string }) =>
      apiPost('/api/messages', { conversationId, ...data }),
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
