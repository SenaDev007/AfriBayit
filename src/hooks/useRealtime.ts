// AfriBayit — useRealtime Hook
// React hook for Socket.io real-time communication

'use client';

import { useEffect, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket, isSocketConnected } from '@/lib/realtime/client';

interface UseRealtimeOptions {
  userId?: string;
  autoConnect?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { userId, autoConnect = true } = options;

  useEffect(() => {
    if (!userId || !autoConnect) return;

    connectSocket(userId);

    return () => {
      disconnectSocket();
    };
  }, [userId, autoConnect]);

  /**
   * Subscribe to a socket event
   * Returns an unsubscribe function
   */
  const onEvent = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  /**
   * Emit a socket event
   */
  const emitEvent = useCallback((event: string, ...args: any[]) => {
    const socket = getSocket();
    socket.emit(event, ...args);
  }, []);

  /**
   * Join a conversation room
   */
  const joinConversation = useCallback((conversationId: string) => {
    emitEvent('join-conversation', conversationId);
  }, [emitEvent]);

  /**
   * Leave a conversation room
   */
  const leaveConversation = useCallback((conversationId: string) => {
    emitEvent('leave-conversation', conversationId);
  }, [emitEvent]);

  /**
   * Send a typing indicator
   */
  const sendTyping = useCallback((conversationId: string) => {
    emitEvent('typing', conversationId);
  }, [emitEvent]);

  /**
   * Send a stop-typing indicator
   */
  const sendStopTyping = useCallback((conversationId: string) => {
    emitEvent('stop-typing', conversationId);
  }, [emitEvent]);

  /**
   * Send a message to a conversation
   */
  const sendMessage = useCallback((conversationId: string, content: string, type = 'text') => {
    emitEvent('send-message', { conversationId, content, type });
  }, [emitEvent]);

  /**
   * Mark a message as read
   */
  const markRead = useCallback((conversationId: string, messageId: string) => {
    emitEvent('mark-read', { conversationId, messageId });
  }, [emitEvent]);

  return {
    onEvent,
    emitEvent,
    joinConversation,
    leaveConversation,
    sendTyping,
    sendStopTyping,
    sendMessage,
    markRead,
    isConnected: isSocketConnected(),
  };
}
