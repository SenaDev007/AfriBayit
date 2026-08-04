// AfriBayit — useRealtime Hook (CDC §3.1.4 — Pusher realtime)
//
// Lazy-loads `pusher-js` only when a consumer actually subscribes, keeps a
// singleton client across hooks, and exposes three focused hooks:
//   1. useRealtimeNotifications — private-user-${userId} channel
//   2. useRealtimeTyping         — private-conversation-${id} channel
//   3. useRealtimePresence       — presence-${roomName} channel
//
// The Pusher client is created with `{ cluster, forceTLS: true }` and reads
// its key from `NEXT_PUBLIC_PUSHER_KEY` / `NEXT_PUBLIC_PUSHER_CLUSTER`.
// All Pusher channel subscriptions are private (auth endpoint provided by
// the backend at `/api/realtime/auth`).

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────

type PusherClient = {
  subscribe: (channelName: string) => PusherChannel;
  unsubscribe: (channelName: string) => void;
  disconnect: () => void;
  bind_global?: (cb: (event: string, data: unknown) => void) => void;
};

type PusherChannel = {
  bind: (event: string, cb: (data: unknown) => void) => PusherChannel;
  unbind: (event?: string, cb?: (data: unknown) => void) => PusherChannel;
  trigger: (event: string, data: unknown) => void;
  members?: { me?: unknown; members?: Map<string, unknown> | Record<string, unknown> };
};

interface UseRealtimeNotificationsOptions {
  onNotification?: (data: unknown) => void;
  onNewNotification?: (data: unknown) => void;
  onCountUpdate?: (data: { unreadCount: number }) => void;
}

interface UseRealtimeTypingOptions {
  onTyping?: (data: { userId: string; name?: string }) => void;
  onStopTyping?: (data: { userId: string }) => void;
}

interface PresenceMember {
  id: string;
  name?: string;
  [key: string]: unknown;
}

// ─── Singleton Pusher client (lazy) ───────────────────────────────────────

let pusherClientPromise: Promise<PusherClient | null> | null = null;
let pusherClient: PusherClient | null = null;
let activeSubscriptions = 0;

async function getPusherClient(): Promise<PusherClient | null> {
  if (pusherClient) return pusherClient;
  if (pusherClientPromise) return pusherClientPromise;

  pusherClientPromise = (async () => {
    if (typeof window === 'undefined') return null;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';
    if (!key) {
      // No Pusher key configured — silently no-op. Consumers handle null by
      // returning empty state.
      return null;
    }

    try {
      const mod = await import('pusher-js');
      // pusher-js exports the class as default in ESM builds, or as
      // `default.default` when imported via CJS interop.
      const Pusher = (mod as any).default ?? (mod as any);
      const client = new Pusher(key, {
        cluster,
        forceTLS: true,
        authEndpoint: '/api/realtime/auth',
        auth: {
          headers: {
            // The api-client adds the bearer token to fetch requests; for
            // Pusher's XHR we manually pull the token from localStorage.
            Authorization: (() => {
              try {
                const token = localStorage.getItem('afribayit_access_token');
                return token ? `Bearer ${token}` : '';
              } catch {
                return '';
              }
            })(),
          },
        },
      } as any);
      pusherClient = client as unknown as PusherClient;
      return pusherClient;
    } catch (err) {
      console.warn('[useRealtime] Failed to initialise Pusher client:', err);
      return null;
    }
  })();

  return pusherClientPromise;
}

function refSubscription(): void {
  activeSubscriptions += 1;
}

function unrefSubscription(): void {
  activeSubscriptions = Math.max(0, activeSubscriptions - 1);
  if (activeSubscriptions === 0 && pusherClient) {
    // Disconnect to free the WebSocket when no hooks are listening.
    try {
      pusherClient.disconnect();
    } catch {
      // ignore
    }
    pusherClient = null;
    pusherClientPromise = null;
  }
}

// ─── Hook 1: useRealtimeNotifications ─────────────────────────────────────

export function useRealtimeNotifications(
  userId: string | undefined,
  options: UseRealtimeNotificationsOptions = {},
) {
  const { onNotification, onNewNotification, onCountUpdate } = options;
  const [lastNotification, setLastNotification] = useState<unknown>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Keep latest callbacks in refs so the effect doesn't resubscribe on
  // every parent re-render. Refs must be updated in an effect (not during
  // render) per React 19 rules.
  const onNotificationRef = useRef(onNotification);
  const onNewNotificationRef = useRef(onNewNotification);
  const onCountUpdateRef = useRef(onCountUpdate);
  useEffect(() => {
    onNotificationRef.current = onNotification;
    onNewNotificationRef.current = onNewNotification;
    onCountUpdateRef.current = onCountUpdate;
  }, [onNotification, onNewNotification, onCountUpdate]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let channelName: string | null = null;

    (async () => {
      const client = await getPusherClient();
      if (!client || cancelled) return;

      channelName = `private-user-${userId}`;
      const channel = client.subscribe(channelName);
      refSubscription();
      setIsConnected(true);

      const handleNotification = (data: unknown) => {
        setLastNotification(data);
        onNotificationRef.current?.(data);
        onNewNotificationRef.current?.(data);
      };

      const handleCountUpdate = (data: unknown) => {
        const unreadCount =
          (data as { unreadCount?: number })?.unreadCount ?? 0;
        onCountUpdateRef.current?.({ unreadCount });
      };

      channel.bind('notification', handleNotification);
      channel.bind('unread-count', handleCountUpdate);

      return () => {
        channel.unbind('notification', handleNotification);
        channel.unbind('unread-count', handleCountUpdate);
      };
    })();

    return () => {
      cancelled = true;
      setIsConnected(false);
      if (channelName && pusherClient) {
        try {
          pusherClient.unsubscribe(channelName);
        } catch {
          // ignore
        }
      }
      unrefSubscription();
    };
  }, [userId]);

  return { lastNotification, isConnected };
}

// ─── Hook 2: useRealtimeTyping ────────────────────────────────────────────

export function useRealtimeTyping(
  conversationId: string | undefined,
  userId: string | undefined,
  options: UseRealtimeTypingOptions = {},
) {
  const { onTyping, onStopTyping } = options;
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<{ userId: string; name?: string } | null>(null);

  const onTypingRef = useRef(onTyping);
  const onStopTypingRef = useRef(onStopTyping);
  useEffect(() => {
    onTypingRef.current = onTyping;
    onStopTypingRef.current = onStopTyping;
  }, [onTyping, onStopTyping]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    let channelName: string | null = null;

    (async () => {
      const client = await getPusherClient();
      if (!client || cancelled) return;

      channelName = `private-conversation-${conversationId}`;
      const channel = client.subscribe(channelName);
      refSubscription();

      const handleTyping = (data: unknown) => {
        const payload = data as { userId?: string; name?: string };
        if (!payload?.userId) return;
        // Ignore own typing echoes
        if (userId && payload.userId === userId) return;
        setIsTyping(true);
        setTypingUser({ userId: payload.userId, name: payload.name });
        onTypingRef.current?.({ userId: payload.userId, name: payload.name });
      };

      const handleStopTyping = (data: unknown) => {
        const payload = data as { userId?: string };
        if (!payload?.userId) return;
        if (userId && payload.userId === userId) return;
        setIsTyping(false);
        setTypingUser(null);
        onStopTypingRef.current?.({ userId: payload.userId });
      };

      channel.bind('typing', handleTyping);
      channel.bind('stop-typing', handleStopTyping);

      return () => {
        channel.unbind('typing', handleTyping);
        channel.unbind('stop-typing', handleStopTyping);
      };
    })();

    return () => {
      cancelled = false;
      setIsTyping(false);
      setTypingUser(null);
      if (channelName && pusherClient) {
        try {
          pusherClient.unsubscribe(channelName);
        } catch {
          // ignore
        }
      }
      unrefSubscription();
    };
  }, [conversationId, userId]);

  // Broadcast helpers — client triggers are allowed on private channels if
  // the Pusher client is configured with `cluster` + client events.
  const broadcastTyping = useCallback(
    (payload: { userId: string; name?: string }) => {
      if (!conversationId || !pusherClient) return;
      const channelName = `private-conversation-${conversationId}`;
      try {
        const channel = pusherClient.subscribe(channelName);
        channel.trigger('client-typing', payload);
      } catch (err) {
        // Trigger may fail if client events are not enabled — fail silently.
        console.warn('[useRealtimeTyping] broadcastTyping failed:', err);
      }
    },
    [conversationId],
  );

  const broadcastStopTyping = useCallback(
    (payload: { userId: string }) => {
      if (!conversationId || !pusherClient) return;
      const channelName = `private-conversation-${conversationId}`;
      try {
        const channel = pusherClient.subscribe(channelName);
        channel.trigger('client-stop-typing', payload);
      } catch (err) {
        console.warn('[useRealtimeTyping] broadcastStopTyping failed:', err);
      }
    },
    [conversationId],
  );

  return {
    isTyping,
    typingUser,
    setIsTyping,
    broadcastTyping,
    broadcastStopTyping,
  };
}

// ─── Hook 3: useRealtimePresence ──────────────────────────────────────────

export function useRealtimePresence(roomName: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceMember[]>([]);
  const [me, setMe] = useState<PresenceMember | null>(null);

  useEffect(() => {
    if (!roomName) return;
    let cancelled = false;
    let channelName: string | null = null;

    (async () => {
      const client = await getPusherClient();
      if (!client || cancelled) return;

      channelName = `presence-${roomName}`;
      const channel = client.subscribe(channelName) as PusherChannel & {
        bind: (event: string, cb: (data: unknown) => void) => PusherChannel;
        members?: {
          me?: PresenceMember;
          members?: Map<string, PresenceMember> | Record<string, PresenceMember>;
        };
      };
      refSubscription();

      const snapshotMembers = () => {
        const members = channel.members?.members;
        if (!members) {
          setOnlineUsers([]);
          return;
        }
        let list: PresenceMember[];
        if (members instanceof Map) {
          list = Array.from(members.values()) as PresenceMember[];
        } else {
          list = Object.values(members);
        }
        setOnlineUsers(list);
        const myInfo = channel.members?.me as PresenceMember | undefined;
        setMe(myInfo ?? null);
      };

      channel.bind('pusher:subscription_succeeded', snapshotMembers);
      channel.bind('pusher:member_added', snapshotMembers);
      channel.bind('pusher:member_removed', snapshotMembers);

      return () => {
        channel.unbind('pusher:subscription_succeeded', snapshotMembers);
        channel.unbind('pusher:member_added', snapshotMembers);
        channel.unbind('pusher:member_removed', snapshotMembers);
      };
    })();

    return () => {
      cancelled = false;
      setOnlineUsers([]);
      setMe(null);
      if (channelName && pusherClient) {
        try {
          pusherClient.unsubscribe(channelName);
        } catch {
          // ignore
        }
      }
      unrefSubscription();
    };
  }, [roomName]);

  return { onlineUsers, me, count: onlineUsers.length };
}

// Default export for backwards compatibility — exposes the three hooks as
// a single object so legacy imports like `import * as useRealtime` still
// work.
const useRealtime = {
  useRealtimeNotifications,
  useRealtimeTyping,
  useRealtimePresence,
};
export default useRealtime;
