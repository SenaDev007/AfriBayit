"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useNotificationStream } from "@/hooks/useNotificationStream";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  href?: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  message: "💬",
  booking: "📅",
  payment: "🔒",
  review: "⭐",
  system: "✅",
  community: "👥",
  price_alert: "📈",
};

const TYPE_COLOR: Record<string, string> = {
  message: "bg-blue-50 text-blue-600",
  booking: "bg-teal-50 text-teal-600",
  payment: "bg-green-50 text-green-600",
  review: "bg-yellow-50 text-yellow-600",
  system: "bg-amber-50 text-amber-600",
  community: "bg-pink-50 text-pink-600",
  price_alert: "bg-purple-50 text-purple-600",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

interface NotificationBellProps {
  solidNav: boolean;
}

export default function NotificationBell({ solidNav }: NotificationBellProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Fetch when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // SSE — live push notifications (replaces 60s polling)
  useNotificationStream({
    enabled: !!session?.user,
    onInit: ({ notifications: notifs, unreadCount: count }) => {
      setNotifications(notifs);
      setUnreadCount(count);
    },
    onNotification: ({ notifications: newNotifs, unreadCount: count }) => {
      setNotifications((prev) => {
        const ids = new Set(prev.map((n) => n.id));
        return [...newNotifs.filter((n) => !ids.has(n.id)), ...prev].slice(0, 50);
      });
      setUnreadCount(count);
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!session?.user) return null;

  async function markAllRead() {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Silent
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className={cn(
          "relative p-2 rounded-xl transition-colors duration-200",
          solidNav ? "hover:bg-slate-100 text-[#374151]" : "hover:bg-white/10 text-white"
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#003087] text-[15px]">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#003087] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount} non lues
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-[#0070BA] hover:underline font-medium"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">Chargement...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Aucune notification pour le moment
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50",
                    !notif.isRead && "bg-blue-50/40"
                  )}
                  onClick={() => {
                    markRead(notif.id);
                    setOpen(false);
                    if (notif.href) window.location.href = notif.href;
                  }}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base",
                      TYPE_COLOR[notif.type] ?? "bg-gray-50 text-gray-600"
                    )}
                  >
                    {TYPE_ICON[notif.type] ?? "🔔"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-[13px] font-semibold text-[#111827] leading-snug", !notif.isRead && "text-[#003087]")}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0070BA] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block w-full text-center text-[13px] text-[#0070BA] font-medium hover:underline py-0.5"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
