// P3.7-2 — NotificationsCenter orchestrator.
// Owns all state (filters, tabs, preferences, silent hours, premium
// toggles), SWR queries, mutations, and the realtime subscription.
// Delegates rendering to NotificationList, PreferencesPanel,
// PremiumPanel, and SilentHoursPanel.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
} from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { Bell, Check, Moon, Crown, Shield, Wifi, WifiOff, X } from 'lucide-react';
import NotificationList from './NotificationList';
import PreferencesPanel from './PreferencesPanel';
import PremiumPanel from './PremiumPanel';
import SilentHoursPanel from './SilentHoursPanel';
import { defaultPreferences, filterTabs } from './constants';
import { groupNotifications } from './utils';
import type {
  ActiveTab,
  CategoryKey,
  ChannelKey,
  FilterTabKey,
  NotificationsCenterProps,
  NotificationData,
  PreferencesMap,
  QuickAction,
} from './types';

export default function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [activeFilter, setActiveFilter] = useState<FilterTabKey>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('notifications');
  const [preferences, setPreferences] = useState<PreferencesMap>(defaultPreferences);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Silent hours state
  const [silentHoursEnabled, setSilentHoursEnabled] = useState(true);
  const [silentStart, setSilentStart] = useState(22); // 22h
  const [silentEnd, setSilentEnd] = useState(7); // 7h

  // Premium notifications enabled state
  const [premiumEnabled, setPremiumEnabled] = useState<Record<string, boolean>>({
    profile_view: true,
    matching_inverse: true,
    performance_weekly: true,
    inmail_credit: true,
  });

  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useNotifications(userId, 1, 50);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();

  // Real-time notification subscription via Pusher
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const onNewNotificationRef = useRef<((data: unknown) => void) | undefined>(undefined);

  onNewNotificationRef.current = (data: unknown) => {
    // Invalidate notification queries to trigger a refresh
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    // Dispatch global event for NotificationToast and badge updates
    window.dispatchEvent(new CustomEvent('afribayit:realtime-notification', { detail: data }));
  };

  const { lastNotification } = useRealtimeNotifications(userId, {
    onNewNotification: useCallback((data: unknown) => {
      onNewNotificationRef.current?.(data);
    }, []),
    onCountUpdate: useCallback((data: { unreadCount: number }) => {
      window.dispatchEvent(new CustomEvent('afribayit:notification-count', { detail: data }));
    }, []),
  });
  // Reference lastNotification so the hook's side effects are kept alive.
  void lastNotification;

  const notifications = (data?.notifications ?? []) as NotificationData[];

  // Filter notifications based on active filter tab
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => {
      const notifType = String(n.type ?? n.category ?? 'system');
      return notifType === activeFilter;
    });
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Group notifications (favoris/views/likes collapse into a single entry)
  const grouped = useMemo(() => groupNotifications(filtered), [filtered]);

  // ─── Handlers ───
  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate(undefined);
  }, [markAllReadMutation]);

  const toggleChannel = useCallback((category: CategoryKey, channel: ChannelKey) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  }, []);

  const savePreferences = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem('afribayit-notification-prefs', JSON.stringify(preferences));
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  const saveSilentHours = useCallback(() => {
    localStorage.setItem(
      'afribayit-silent-hours',
      JSON.stringify({
        enabled: silentHoursEnabled,
        start: silentStart,
        end: silentEnd,
      })
    );
  }, [silentHoursEnabled, silentStart, silentEnd]);

  const handleQuickAction = useCallback(
    async (notif: NotificationData, action: QuickAction) => {
      const notifId = String(notif.id);
      setActionLoading(notifId);

      try {
        // Mark as read first
        if (!notif.read) {
          markReadMutation.mutate(notifId);
        }

        switch (action) {
          case 'reply': {
            const actionUrl = String(notif.actionUrl ?? '/messages');
            window.dispatchEvent(new CustomEvent('afribayit:navigate', { detail: actionUrl }));
            break;
          }
          case 'view': {
            const actionUrl = String(notif.actionUrl ?? '#');
            window.dispatchEvent(new CustomEvent('afribayit:navigate', { detail: actionUrl }));
            break;
          }
          case 'validate': {
            window.dispatchEvent(new CustomEvent('afribayit:validate-transaction', { detail: notifId }));
            break;
          }
          case 'dismiss':
            // Just mark as read - already done above
            break;
        }
      } finally {
        setActionLoading(null);
      }
    },
    [markReadMutation]
  );

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  // Load preferences/silent hours/premium from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('afribayit-notification-prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }
      const silentSaved = localStorage.getItem('afribayit-silent-hours');
      if (silentSaved) {
        const parsed = JSON.parse(silentSaved);
        setSilentHoursEnabled(parsed.enabled ?? true);
        setSilentStart(parsed.start ?? 22);
        setSilentEnd(parsed.end ?? 7);
      }
      const premiumSaved = localStorage.getItem('afribayit-premium-notifs');
      if (premiumSaved) {
        setPremiumEnabled(JSON.parse(premiumSaved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const isPremiumUser = !!user?.role?.includes('premium') || !!user?.role?.includes('pro');

  const handlePremiumToggle = (key: string, checked: boolean) => {
    setPremiumEnabled((prev) => {
      const next = { ...prev, [key]: checked };
      localStorage.setItem('afribayit-premium-notifs', JSON.stringify(next));
      return next;
    });
  };

  // ─── Render ───
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40 flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full sm:w-[460px] h-full bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-[#2C2E2F]">Notifications</h2>
                    {process.env.NEXT_PUBLIC_PUSHER_KEY && (
                      <span
                        className="flex items-center gap-1"
                        title={realtimeConnected ? 'Temps reel connecte' : 'Temps reel deconnecte'}
                      >
                        {realtimeConnected ? (
                          <Wifi className="w-3.5 h-3.5 text-[#00A651]" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-gray-300" />
                        )}
                      </span>
                    )}
                  </div>
                  {activeTab === 'notifications' && (
                    <p className="text-xs text-gray-500">
                      {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === 'notifications' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0 || markAllReadMutation.isPending}
                      className="flex items-center gap-1 text-xs text-[#003087] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Tout marquer comme lu
                    </motion.button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                {[
                  { key: 'notifications' as const, label: 'Notifications', icon: Bell },
                  { key: 'preferences' as const, label: 'Preferences', icon: Shield },
                  { key: 'premium' as const, label: 'Premium', icon: Crown },
                  { key: 'silent' as const, label: 'Silence', icon: Moon },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      activeTab === tab.key
                        ? 'bg-white text-[#003087] shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Filter Tabs (only on notifications tab) */}
              {activeTab === 'notifications' && (
                <div className="flex gap-1 overflow-x-auto mt-3 pb-1">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                        activeFilter === tab.key
                          ? 'bg-[#003087] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <tab.icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab content */}
            {activeTab === 'notifications' && (
              <NotificationList
                filtered={filtered}
                grouped={grouped}
                isLoading={isLoading}
                isError={isError}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                onAction={handleQuickAction}
                actionLoading={actionLoading}
              />
            )}

            {activeTab === 'preferences' && (
              <PreferencesPanel
                preferences={preferences}
                onToggleChannel={toggleChannel}
                onSetAll={setPreferences}
                onSave={savePreferences}
                saving={saving}
              />
            )}

            {activeTab === 'premium' && (
              <PremiumPanel
                premiumEnabled={premiumEnabled}
                onToggle={handlePremiumToggle}
                isPremiumUser={isPremiumUser}
              />
            )}

            {activeTab === 'silent' && (
              <SilentHoursPanel
                enabled={silentHoursEnabled}
                start={silentStart}
                end={silentEnd}
                onToggleEnabled={(checked) => {
                  setSilentHoursEnabled(checked);
                  saveSilentHours();
                }}
                onChangeStart={(v) => {
                  setSilentStart(v);
                  saveSilentHours();
                }}
                onChangeEnd={(v) => {
                  setSilentEnd(v);
                  saveSilentHours();
                }}
                onApplyPreset={(start, end) => {
                  setSilentStart(start);
                  setSilentEnd(end);
                  saveSilentHours();
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
