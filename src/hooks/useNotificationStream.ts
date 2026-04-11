"use client";

import { useEffect, useRef, useCallback } from "react";

export interface StreamNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

interface StreamPayload {
  notifications: StreamNotification[];
  unreadCount: number;
}

interface UseNotificationStreamOptions {
  enabled?: boolean;
  onNotification?: (payload: StreamPayload) => void;
  onInit?: (payload: StreamPayload) => void;
}

/**
 * SSE hook for live notifications (CDC §8.x)
 * Automatically reconnects on close with exponential backoff.
 */
export function useNotificationStream({
  enabled = true,
  onNotification,
  onInit,
}: UseNotificationStreamOptions = {}) {
  const esRef = useRef<EventSource | null>(null);
  const lastIdRef = useRef<string | undefined>(undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(2000);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const url = `/api/notifications/stream${lastIdRef.current ? `?lastId=${lastIdRef.current}` : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("init", (e) => {
      try {
        const payload: StreamPayload = JSON.parse(e.data);
        if (payload.notifications.length > 0) {
          lastIdRef.current = payload.notifications[0].id;
        }
        onInit?.(payload);
        reconnectDelay.current = 2000; // reset backoff on success
      } catch {}
    });

    es.addEventListener("notification", (e) => {
      try {
        const payload: StreamPayload = JSON.parse(e.data);
        if (payload.notifications.length > 0) {
          lastIdRef.current = payload.notifications[0].id;
        }
        onNotification?.(payload);
      } catch {}
    });

    es.addEventListener("close", () => {
      es.close();
      scheduleReconnect();
    });

    es.onerror = () => {
      es.close();
      scheduleReconnect();
    };
  }, [onNotification, onInit]);

  function scheduleReconnect() {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 30_000);
      connect();
    }, reconnectDelay.current);
  }

  useEffect(() => {
    if (!enabled) return;
    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, [enabled, connect]);
}
