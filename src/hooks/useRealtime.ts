// AfriBayit — useRealtime Hook
// React hook for Pusher real-time communication
// Replaces Socket.io with Pusher (Vercel serverless compatible)

'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  getPusherClient,
  subscribeToChannel,
  bindEvent,
  unsubscribe,
  disconnectPusherClient,
  isPusherConnected,
} from '@/lib/realtime/pusher-client';
import {
  userChannel,
  escrowChannel,
  chatChannel,
  propertyChannel,
  RealtimeEvents,
} from '@/lib/realtime/channels';
import type { Channel } from 'pusher-js';

// ── Types ──────────────────────────────────────────────────────────────

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  actionUrl?: string;
  priority?: string;
  createdAt: string;
}

interface EscrowUpdateData {
  transactionId: string;
  status: string;
  message: string;
  amount?: number;
  currency?: string;
}

interface ChatMessageData {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: string;
  createdAt: string;
}

interface PropertyUpdateData {
  propertyId: string;
  viewCount: number;
  status?: string;
  price?: number;
}

// ── Main Hook ──────────────────────────────────────────────────────────

interface UseRealtimeOptions {
  userId?: string;
  autoConnect?: boolean;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { userId, autoConnect = true } = options;

  // Lazy initializer: check Pusher connection state on first render
  const [connected, setConnected] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const client = getPusherClient();
      return client?.connection.state === 'connected';
    } catch {
      return false;
    }
  });

  // Subscribe to Pusher connection state changes
  useEffect(() => {
    if (!userId || !autoConnect) return;

    const client = getPusherClient();
    if (!client) return;

    const handleStateChange = ({ current }: { current: string }) => {
      setConnected(current === 'connected');
    };

    client.connection.bind('state_change', handleStateChange);

    return () => {
      client.connection.unbind('state_change', handleStateChange);
    };
  }, [userId, autoConnect]);

  return {
    connected,
  };
}

/**
 * Subscribe to a specific event on a Pusher channel
 * Standalone hook for binding to any Pusher channel + event
 */
export function useRealtimeEvent(
  channelName: string,
  event: string,
  callback: (data: any) => void
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!channelName || !event) return;

    const unbind = bindEvent(channelName, event, (data: any) => {
      callbackRef.current(data);
    });

    return () => {
      if (unbind) {
        unbind();
      }
    };
  }, [channelName, event]);
}

// ── Specialized Hooks ──────────────────────────────────────────────────

/**
 * Subscribe to user notification channel
 * Provides real-time notification delivery
 */
export function useRealtimeNotifications(
  userId: string | undefined,
  callbacks?: {
    onNewNotification?: (data: NotificationData) => void;
    onNotificationRead?: (data: { id: string }) => void;
    onCountUpdate?: (data: { unreadCount: number }) => void;
  }
) {
  const unbindRefs = useRef<Array<() => void>>([]);
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channelName = userChannel(userId);

    // Bind to notification events
    const unbindNew = bindEvent(
      channelName,
      RealtimeEvents.NOTIFICATION_NEW,
      (data: NotificationData) => {
        setLastNotification(data);
        callbacks?.onNewNotification?.(data);

        // Dispatch a global event for other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('afribayit:notification', { detail: data })
          );
        }
      }
    );

    const unbindRead = bindEvent(
      channelName,
      RealtimeEvents.NOTIFICATION_READ,
      (data: { id: string }) => {
        callbacks?.onNotificationRead?.(data);
      }
    );

    const unbindCount = bindEvent(
      channelName,
      RealtimeEvents.NOTIFICATION_COUNT_UPDATE,
      (data: { unreadCount: number }) => {
        callbacks?.onCountUpdate?.(data);

        // Dispatch for badge updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('afribayit:notification-count', { detail: data })
          );
        }
      }
    );

    // Store unbind functions
    const allUnbinds = [unbindNew, unbindRead, unbindCount].filter(Boolean) as Array<() => void>;
    unbindRefs.current = allUnbinds;

    return () => {
      allUnbinds.forEach(unbind => unbind());
      unsubscribe(channelName);
    };
  }, [userId, callbacks?.onNewNotification, callbacks?.onNotificationRead, callbacks?.onCountUpdate]);

  return {
    lastNotification,
  };
}

/**
 * Subscribe to escrow status updates
 */
export function useRealtimeEscrow(
  transactionId: string | undefined,
  callbacks?: {
    onFunded?: (data: EscrowUpdateData) => void;
    onReleased?: (data: EscrowUpdateData) => void;
    onDisputed?: (data: EscrowUpdateData) => void;
    onStatusUpdate?: (data: EscrowUpdateData) => void;
  }
) {
  useEffect(() => {
    if (!transactionId) return;

    const channelName = escrowChannel(transactionId);

    const unbindFunded = bindEvent(channelName, RealtimeEvents.ESCROW_FUNDED, (data: EscrowUpdateData) => {
      callbacks?.onFunded?.(data);
    });

    const unbindReleased = bindEvent(channelName, RealtimeEvents.ESCROW_RELEASED, (data: EscrowUpdateData) => {
      callbacks?.onReleased?.(data);
    });

    const unbindDisputed = bindEvent(channelName, RealtimeEvents.ESCROW_DISPUTED, (data: EscrowUpdateData) => {
      callbacks?.onDisputed?.(data);
    });

    const unbindStatus = bindEvent(channelName, RealtimeEvents.ESCROW_STATUS_UPDATE, (data: EscrowUpdateData) => {
      callbacks?.onStatusUpdate?.(data);
    });

    const allUnbinds = [unbindFunded, unbindReleased, unbindDisputed, unbindStatus].filter(Boolean) as Array<() => void>;

    return () => {
      allUnbinds.forEach(unbind => unbind());
      unsubscribe(channelName);
    };
  }, [transactionId, callbacks?.onFunded, callbacks?.onReleased, callbacks?.onDisputed, callbacks?.onStatusUpdate]);
}

/**
 * Subscribe to chat messages and typing indicators
 */
export function useRealtimeChat(
  conversationId: string | undefined,
  callbacks?: {
    onMessage?: (data: ChatMessageData) => void;
    onTyping?: (data: { userId: string; userName: string }) => void;
    onStopTyping?: (data: { userId: string }) => void;
    onRead?: (data: { userId: string; messageIds: string[] }) => void;
  }
) {
  useEffect(() => {
    if (!conversationId) return;

    const channelName = chatChannel(conversationId);

    const unbindMessage = bindEvent(channelName, RealtimeEvents.CHAT_MESSAGE, (data: ChatMessageData) => {
      callbacks?.onMessage?.(data);
    });

    const unbindTyping = bindEvent(channelName, RealtimeEvents.CHAT_TYPING, (data: { userId: string; userName: string }) => {
      callbacks?.onTyping?.(data);
    });

    const unbindStopTyping = bindEvent(channelName, RealtimeEvents.CHAT_STOP_TYPING, (data: { userId: string }) => {
      callbacks?.onStopTyping?.(data);
    });

    const unbindRead = bindEvent(channelName, RealtimeEvents.CHAT_READ, (data: { userId: string; messageIds: string[] }) => {
      callbacks?.onRead?.(data);
    });

    const allUnbinds = [unbindMessage, unbindTyping, unbindStopTyping, unbindRead].filter(Boolean) as Array<() => void>;

    return () => {
      allUnbinds.forEach(unbind => unbind());
      unsubscribe(channelName);
    };
  }, [conversationId, callbacks?.onMessage, callbacks?.onTyping, callbacks?.onStopTyping, callbacks?.onRead]);
}

/**
 * Subscribe to property updates (view counts, price changes)
 */
export function useRealtimeProperty(
  propertyId: string | undefined,
  callbacks?: {
    onViewCount?: (data: PropertyUpdateData) => void;
    onStatusUpdate?: (data: PropertyUpdateData) => void;
    onPriceChange?: (data: PropertyUpdateData) => void;
  }
) {
  useEffect(() => {
    if (!propertyId) return;

    const channelName = propertyChannel(propertyId);

    const unbindViews = bindEvent(channelName, RealtimeEvents.PROPERTY_VIEW_COUNT, (data: PropertyUpdateData) => {
      callbacks?.onViewCount?.(data);
    });

    const unbindStatus = bindEvent(channelName, RealtimeEvents.PROPERTY_STATUS_UPDATE, (data: PropertyUpdateData) => {
      callbacks?.onStatusUpdate?.(data);
    });

    const unbindPrice = bindEvent(channelName, RealtimeEvents.PROPERTY_PRICE_CHANGE, (data: PropertyUpdateData) => {
      callbacks?.onPriceChange?.(data);
    });

    const allUnbinds = [unbindViews, unbindStatus, unbindPrice].filter(Boolean) as Array<() => void>;

    return () => {
      allUnbinds.forEach(unbind => unbind());
      unsubscribe(channelName);
    };
  }, [propertyId, callbacks?.onViewCount, callbacks?.onStatusUpdate, callbacks?.onPriceChange]);
}

// Re-export for backward compatibility
export { disconnectPusherClient, isPusherConnected };
