'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';
import { apiPost, apiFetch, apiPatch } from '@/lib/api';
import { timeAgo } from '@/lib/afribayit-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Bot, CheckCircle, ClipboardList, Coins, Crown, Gift, Home, Lock, Mail, MessageCircle, Smartphone, User, Users } from 'lucide-react';

import {  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'unread' | 'transaction' | 'property' | 'community';

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all', label: 'Tout', icon: '<ClipboardList className="w-4 h-4" />' },
  { key: 'unread', label: 'Non lu', icon: '' },
  { key: 'transaction', label: 'Transactions', icon: '<Coins className="w-4 h-4" />' },
  { key: 'property', label: 'Propriétés', icon: '<Home className="w-4 h-4" />' },
  { key: 'community', label: 'Communauté', icon: '<Users className="w-4 h-4" />' },
];

const typeIcons: Record<string, string> = {
  transaction: '<Coins className="w-4 h-4" />',
  message: '<MessageCircle className="w-4 h-4" />',
  alert: '<Bell className="w-4 h-4" />',
  system: '',
  promotion: '<Gift className="w-4 h-4" />',
  community: '<Users className="w-4 h-4" />',
  rebecca: '<Bot className="w-4 h-4" />',
  certification: '<CheckCircle className="w-4 h-4" />',
  profile: '<User className="w-4 h-4" />',
  premium: '<Crown className="w-4 h-4" />',
  security: '<Lock className="w-4 h-4" />',
};

const typeColors: Record<string, string> = {
  transaction: '#00A651',
  message: '#009CDE',
  alert: '#D4AF37',
  system: '#6b7280',
  promotion: '#D93025',
  community: '#003087',
  rebecca: '#9333ea',
  certification: '#00A651',
  profile: '#009CDE',
  premium: '#D4AF37',
  security: '#D93025',
};

interface NotificationPref {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPref | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const prefsLoadedRef = useRef(false);

  const { data, isLoading, isError } = useNotifications(userId, 1, 50);
  const markReadMutation = useMarkNotificationRead();

  const notifications = (data?.notifications ?? []) as Record<string, unknown>[];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = notifications.filter((n) => {
    const notifType = String(n.type ?? n.category ?? 'system');
    const notifCategory = String(n.category ?? 'system');
    const notifRead = Boolean(n.read);

    switch (activeTab) {
      case 'unread':
        return !notifRead;
      case 'transaction':
        return notifType === 'transaction' || notifCategory === 'transaction';
      case 'property':
        return notifType === 'alert' || notifCategory === 'property' || notifCategory === 'annonces';
      case 'community':
        return notifType === 'community' || notifCategory === 'community';
      default:
        return true;
    }
  });

  const handleMarkAllRead = async () => {
    try {
      await apiPost('/api/notifications/mark-all-read', {});
    } catch {
      notifications.filter((n) => !n.read).forEach((n) => {
        markReadMutation.mutate(String(n.id));
      });
    }
  };

  const loadPreferences = async () => {
    setPrefsLoading(true);
    try {
      const result = await apiFetch<{ data: NotificationPref }>('/api/notifications/preferences');
      setPrefs(result.data);
    } catch {
      setPrefs({
        in_app: true,
        email: true,
        sms: false,
        push: true,
        whatsapp: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });
    }
    setPrefsLoading(false);
  };

  const handleOpenPrefs = (open: boolean) => {
    setShowPrefs(open);
    if (open && !prefsLoadedRef.current) {
      prefsLoadedRef.current = true;
      loadPreferences();
    }
    if (!open) {
      prefsLoadedRef.current = false;
    }
  };

  return (
    <>
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
              className="w-full sm:w-[420px] h-full bg-white shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b bg-[#003087] text-white">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold font-display">Notifications</h2>
                    <p className="text-xs text-white/70">
                      {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPrefs(true)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      title="Préférences"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0}
                      className="text-xs font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Tout marquer lu
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.key
                          ? 'bg-white text-[#003087]'
                          : 'bg-white/15 text-white/80 hover:bg-white/25'
                      }`}
                    >
                      {tab.icon} {tab.label}
                      {tab.key === 'unread' && unreadCount > 0 && (
                        <span className="ml-1 bg-[#D4AF37] text-[#003087] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification List */}
              <ScrollArea className="flex-1">
                {isError && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-[#D93025]">Erreur lors du chargement des notifications</p>
                  </div>
                )}

                {isLoading && (
                  <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-40 mb-1" />
                            <Skeleton className="h-3 w-full mb-1" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && !isError && filtered.length === 0 && (
                  <div className="p-8 text-center">
                    <span className="text-4xl block mb-3"><Bell className="w-4 h-4" /></span>
                    <p className="text-sm text-gray-500 font-medium">Aucune notification</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeTab === 'unread' ? 'Toutes vos notifications sont lues' : 'Les notifications importantes apparaîtront ici'}
                    </p>
                  </div>
                )}

                {!isLoading && !isError && (
                  <div className="divide-y">
                    {filtered.map((notif, index) => {
                      const notifType = String(notif.type ?? notif.category ?? 'system');
                      const notifRead = Boolean(notif.read);
                      const notifDate = String(notif.createdAt ?? '');
                      const notifActionUrl = String(notif.actionUrl ?? '');

                      return (
                        <motion.div
                          key={String(notif.id)}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notifRead ? 'bg-[#003087]/[0.03]' : ''
                          }`}
                          onClick={() => {
                            if (!notifRead) {
                              markReadMutation.mutate(String(notif.id));
                            }
                            if (notifActionUrl && notifActionUrl !== 'undefined') {
                              window.location.href = notifActionUrl;
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${typeColors[notifType] || '#6b7280'}15` }}
                            >
                              <span className="text-lg">{typeIcons[notifType] || '<ClipboardList className="w-4 h-4" />'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">{String(notif.title ?? '')}</h4>
                                {!notifRead && (
                                  <span className="w-2 h-2 bg-[#003087] rounded-full shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(notif.message ?? '')}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-[10px] text-gray-400">
                                  {notifDate ? timeAgo(notifDate) : ''}
                                </p>
                                {notif.channels && (
                                  <div className="flex gap-1">
                                    {(JSON.parse(String(notif.channels) || '[]') as string[]).slice(0, 3).map((ch) => (
                                      <span key={ch} className="text-[9px] text-gray-300">
                                        {ch === 'email' ? '<Mail className="w-4 h-4" />' : ch === 'sms' ? '<Smartphone className="w-4 h-4" />' : ch === 'push' ? '<Bell className="w-4 h-4" />' : ch === 'whatsapp' ? '<MessageCircle className="w-4 h-4" />' : ''}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Preferences Modal */}
      <Dialog open={showPrefs} onOpenChange={handleOpenPrefs}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#003087]">Préférences de notification</DialogTitle>
          </DialogHeader>

          {prefsLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : prefs ? (
            <div className="space-y-4 p-2">
              <h3 className="text-sm font-semibold text-[#2C2E2F]">Canaux de notification</h3>

              {[
                { key: 'in_app' as const, label: 'In-App', desc: 'Notifications dans l\'application' },
                { key: 'email' as const, label: 'E-mail', desc: 'Notifications par e-mail' },
                { key: 'sms' as const, label: 'SMS', desc: 'Notifications par SMS' },
                { key: 'push' as const, label: 'Push', desc: 'Notifications push sur votre appareil' },
                { key: 'whatsapp' as const, label: 'WhatsApp', desc: 'Messages WhatsApp Business' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-[#2C2E2F]">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Switch
                    checked={prefs[item.key]}
                    onCheckedChange={(checked) => {
                      const newPrefs = { ...prefs, [item.key]: checked };
                      setPrefs(newPrefs);
                      apiPatch('/api/notifications/preferences', newPrefs).catch(() => {});
                    }}
                  />
                </div>
              ))}

              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-[#2C2E2F] mb-2">Heures calmes</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Pendant ces heures, seules les notifications urgentes et de sécurité seront envoyées.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Début</label>
                    <input
                      type="time"
                      value={prefs.quietHoursStart || '22:00'}
                      onChange={(e) => {
                        const newPrefs = { ...prefs, quietHoursStart: e.target.value };
                        setPrefs(newPrefs);
                        apiPatch('/api/notifications/preferences', newPrefs).catch(() => {});
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Fin</label>
                    <input
                      type="time"
                      value={prefs.quietHoursEnd || '07:00'}
                      onChange={(e) => {
                        const newPrefs = { ...prefs, quietHoursEnd: e.target.value };
                        setPrefs(newPrefs);
                        apiPatch('/api/notifications/preferences', newPrefs).catch(() => {});
                      }}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
