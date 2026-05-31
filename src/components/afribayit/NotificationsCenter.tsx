'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Bell,
  Bot,
  Check,
  CheckCircle,
  ClipboardList,
  Coins,
  Crown,
  Eye,
  Gift,
  Home,
  Lightbulb,
  Lock,
  Mail,
  MessageCircle,
  Moon,
  Reply,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  User,
  Users,
  X,
  ExternalLink,
  BarChart3,
  CreditCard,
  Megaphone,
} from 'lucide-react';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Tab configuration with French labels
const filterTabs = [
  { key: 'all', label: 'Tout', icon: Bell },
  { key: 'unread', label: 'Non lus', icon: Mail },
  { key: 'transaction', label: 'Transactions', icon: Coins },
  { key: 'announcement', label: 'Annonces', icon: Megaphone },
  { key: 'community', label: 'Communaute', icon: Users },
  { key: 'rebecca', label: 'Rebecca', icon: Bot },
] as const;

type FilterTabKey = typeof filterTabs[number]['key'];

// Notification type to icon mapping
const typeIconMap: Record<string, React.ElementType> = {
  transaction: Coins,
  message: MessageCircle,
  alert: Bell,
  system: ClipboardList,
  promotion: Gift,
  community: Users,
  rebecca: Bot,
  certification: CheckCircle,
  profile: User,
  premium: Crown,
  security: Lock,
  property: Home,
  announcement: Megaphone,
  // Premium-specific notification types
  profile_view: Eye,
  matching_inverse: TrendingUp,
  performance_weekly: BarChart3,
  inmail_credit: CreditCard,
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
  property: '#003087',
  announcement: '#D4AF37',
  profile_view: '#9333ea',
  matching_inverse: '#00A651',
  performance_weekly: '#009CDE',
  inmail_credit: '#D4AF37',
};

// Quick action type definitions
type QuickAction = 'reply' | 'view' | 'validate' | 'dismiss';

interface NotificationQuickAction {
  type: QuickAction;
  label: string;
  icon: React.ElementType;
}

function getQuickActions(notif: Record<string, unknown>): NotificationQuickAction[] {
  const notifType = String(notif.type ?? notif.category ?? 'system');
  const actions: NotificationQuickAction[] = [];

  switch (notifType) {
    case 'message':
    case 'community':
      actions.push({ type: 'reply', label: 'Repondre', icon: Reply });
      actions.push({ type: 'view', label: 'Voir', icon: ExternalLink });
      break;
    case 'transaction':
      actions.push({ type: 'validate', label: 'Valider', icon: CheckCircle });
      actions.push({ type: 'view', label: 'Details', icon: ExternalLink });
      break;
    case 'property':
      actions.push({ type: 'view', label: 'Voir le bien', icon: ExternalLink });
      break;
    case 'announcement':
      actions.push({ type: 'view', label: 'Lire', icon: ExternalLink });
      break;
    case 'rebecca':
      actions.push({ type: 'reply', label: 'Repondre', icon: Reply });
      break;
    case 'profile_view':
    case 'matching_inverse':
      actions.push({ type: 'view', label: 'Voir', icon: Eye });
      break;
    default:
      actions.push({ type: 'view', label: 'Voir', icon: ExternalLink });
  }

  actions.push({ type: 'dismiss', label: 'Ignorer', icon: X });
  return actions;
}

// Preference categories
const preferenceCategories = [
  { key: 'property', label: 'Immobilier', icon: Home, desc: 'Alertes de biens, prix, disponibilite' },
  { key: 'community', label: 'Communaute', icon: Users, desc: 'Posts, reponses, groupes, evenements' },
  { key: 'escrow', label: 'Escrow', icon: Lock, desc: 'Transactions, paiements, liberations' },
  { key: 'academy', label: 'Academie', icon: Star, desc: 'Cours, certificats, progression' },
  { key: 'marketing', label: 'Marketing', icon: Gift, desc: 'Promotions, offres, parrainage' },
] as const;

// Notification channels for toggles
const preferenceChannels = [
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'sms', label: 'SMS', icon: MessageCircle },
  { key: 'push', label: 'Push', icon: Smartphone },
  { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
] as const;

type ChannelKey = typeof preferenceChannels[number]['key'];
type CategoryKey = typeof preferenceCategories[number]['key'];
type PreferencesMap = Record<CategoryKey, Record<ChannelKey, boolean>>;

const defaultPreferences: PreferencesMap = {
  property: { email: true, sms: false, push: true, whatsapp: false },
  community: { email: false, sms: false, push: true, whatsapp: false },
  escrow: { email: true, sms: true, push: true, whatsapp: false },
  academy: { email: true, sms: false, push: true, whatsapp: false },
  marketing: { email: false, sms: false, push: false, whatsapp: false },
};

// Premium notification types
const premiumNotificationTypes = [
  { key: 'profile_view', label: 'Qui a consulte votre profil', icon: Eye, desc: 'Soyez alerte quand on visite votre profil' },
  { key: 'matching_inverse', label: 'Matching inverse', icon: TrendingUp, desc: 'Biens correspondant a vos criteres inverses' },
  { key: 'performance_weekly', label: 'Performance hebdomadaire', icon: BarChart3, desc: 'Rapport hebdo de vos performances' },
  { key: 'inmail_credit', label: 'Credits InMail', icon: CreditCard, desc: 'Solde et expiration de vos credits' },
] as const;

// Helper to group similar notifications
function groupNotifications(notifications: Record<string, unknown>[]): Array<Record<string, unknown> | { isGroup: true; groupKey: string; groupLabel: string; count: number; notifications: Record<string, unknown>[] }> {
  const groups: Map<string, { items: Record<string, unknown>[]; label: string }> = new Map();
  const singles: Array<Record<string, unknown> | { isGroup: true; groupKey: string; groupLabel: string; count: number; notifications: Record<string, unknown>[] }> = [];
  const processed = new Set<string>();

  for (const notif of notifications) {
    const id = String(notif.id);
    if (processed.has(id)) continue;
    processed.add(id);

    const notifType = String(notif.type ?? notif.category ?? 'system');
    const notifRead = Boolean(notif.read);
    const title = String(notif.title ?? '');

    // Try to find similar notifications to group
    const groupKey = `${notifType}:${notifRead ? 'read' : 'unread'}:${title.replace(/\d+/g, 'X')}`;

    // Check for common groupable patterns
    const favorisMatch = title.match(/(\d+)\s*personnes?\s+ont\s+ajoute.*favoris/i);
    const viewMatch = title.match(/(\d+)\s*personnes?\s+ont\s+consult/i);
    const likeMatch = title.match(/(\d+)\s+likes?/i);

    if (favorisMatch || viewMatch || likeMatch) {
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          items: [],
          label: favorisMatch
            ? 'personnes ont ajoute votre bien aux favoris'
            : viewMatch
              ? 'personnes ont consulte votre profil'
              : 'interactions sur votre contenu',
        });
      }
      groups.get(groupKey)!.items.push(notif);
    } else {
      singles.push(notif);
    }
  }

  // Convert groups with 2+ items to grouped entries
  for (const [, group] of groups) {
    if (group.items.length >= 2) {
      singles.unshift({
        isGroup: true,
        groupKey: `group-${group.items.map(i => String(i.id)).join('-')}`,
        groupLabel: `${group.items.length} ${group.label}`,
        count: group.items.length,
        notifications: group.items,
      });
    } else {
      singles.push(...group.items);
    }
  }

  return singles;
}

// Time formatting helper
function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [activeFilter, setActiveFilter] = useState<FilterTabKey>('all');
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences' | 'premium' | 'silent'>('notifications');
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

  const { data, isLoading, isError } = useNotifications(userId, 1, 50);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllRead();

  const notifications = (data?.notifications ?? []) as Record<string, unknown>[];

  // Filter notifications based on active tab
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => {
      const notifType = String(n.type ?? n.category ?? 'system');
      return notifType === activeFilter;
    });
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Group notifications
  const grouped = useMemo(() => groupNotifications(filtered), [filtered]);

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    markAllReadMutation.mutate(undefined);
  }, [markAllReadMutation]);

  // Toggle a channel for a category
  const toggleChannel = useCallback((category: CategoryKey, channel: ChannelKey) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  }, []);

  // Save preferences
  const savePreferences = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem('afribayit-notification-prefs', JSON.stringify(preferences));
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setSaving(false);
    }
  }, [preferences]);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('afribayit-notification-prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences(prev => ({ ...prev, ...parsed }));
      }
      // Load silent hours config
      const silentSaved = localStorage.getItem('afribayit-silent-hours');
      if (silentSaved) {
        const parsed = JSON.parse(silentSaved);
        setSilentHoursEnabled(parsed.enabled ?? true);
        setSilentStart(parsed.start ?? 22);
        setSilentEnd(parsed.end ?? 7);
      }
      // Load premium config
      const premiumSaved = localStorage.getItem('afribayit-premium-notifs');
      if (premiumSaved) {
        setPremiumEnabled(JSON.parse(premiumSaved));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save silent hours when changed
  const saveSilentHours = useCallback(() => {
    localStorage.setItem('afribayit-silent-hours', JSON.stringify({
      enabled: silentHoursEnabled,
      start: silentStart,
      end: silentEnd,
    }));
  }, [silentHoursEnabled, silentStart, silentEnd]);

  // Handle quick action on notification
  const handleQuickAction = useCallback(async (notif: Record<string, unknown>, action: QuickAction) => {
    const notifId = String(notif.id);
    setActionLoading(notifId);

    try {
      // Mark as read first
      if (!notif.read) {
        markReadMutation.mutate(notifId);
      }

      switch (action) {
        case 'reply': {
          // In production: navigate to conversation or open reply modal
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
          // In production: call API to validate transaction
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
  }, [markReadMutation]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  // Render notification icon
  const renderNotifIcon = (notifType: string) => {
    const IconComponent = typeIconMap[notifType] || ClipboardList;
    return <IconComponent className="w-4 h-4" />;
  };

  // Format time range for silent hours display
  const formatSilentRange = () => {
    const startStr = `${String(silentStart).padStart(2, '0')}h`;
    const endStr = `${String(silentEnd).padStart(2, '0')}h`;
    return `${startStr} - ${endStr}`;
  };

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
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F]">Notifications</h2>
                  {activeTab === 'notifications' && (
                    <p className="text-xs text-gray-500">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</p>
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
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                ].map(tab => (
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

            {/* ====== NOTIFICATIONS TAB ====== */}
            {activeTab === 'notifications' && (
              <div className="flex-1 overflow-y-auto">
                {/* Error State */}
                {isError && (
                  <div className="p-6 text-center">
                    <p className="text-sm text-[#D93025]">Erreur lors du chargement des notifications</p>
                  </div>
                )}

                {/* Loading State */}
                {isLoading && (
                  <div className="divide-y">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
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

                {/* Empty State */}
                {!isLoading && !isError && filtered.length === 0 && (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Aucune notification</p>
                    <p className="text-xs text-gray-400 mt-1">Vos notifications apparaissent ici</p>
                  </div>
                )}

                {/* Notification List */}
                {!isLoading && !isError && (
                  <div className="divide-y">
                    {grouped.map((item, idx) => {
                      // Grouped notification
                      if ('isGroup' in item && item.isGroup) {
                        const group = item as { isGroup: true; groupKey: string; groupLabel: string; count: number; notifications: Record<string, unknown>[] };
                        const isExpanded = expandedGroups.has(group.groupKey);
                        return (
                          <div key={group.groupKey}>
                            <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-[#003087]/3"
                              onClick={() => toggleGroup(group.groupKey)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#003087]/10">
                                  <Users className="w-4 h-4 text-[#003087]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-[#003087] truncate">
                                      {group.count} {group.groupLabel}
                                    </h4>
                                    <span className="w-2 h-2 bg-[#D4AF37] rounded-full shrink-0" />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {isExpanded ? 'Cliquez pour reduire' : 'Cliquez pour voir les details'}
                                  </p>
                                </div>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronIcon className="w-4 h-4 text-gray-400" />
                                </motion.div>
                              </div>
                            </motion.div>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden bg-gray-50"
                                >
                                  {group.notifications.map((notif) => (
                                    <NotificationItem
                                      key={String(notif.id)}
                                      notif={notif}
                                      onAction={handleQuickAction}
                                      actionLoading={actionLoading}
                                    />
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      // Single notification
                      const notif = item as Record<string, unknown>;
                      return (
                        <NotificationItem
                          key={String(notif.id)}
                          notif={notif}
                          onAction={handleQuickAction}
                          actionLoading={actionLoading}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ====== PREFERENCES TAB ====== */}
            {activeTab === 'preferences' && (
              <div className="flex-1 overflow-y-auto p-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1">
                    Canaux de notification
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Choisissez comment vous souhaitez recevoir les alertes pour chaque categorie.
                  </p>

                  {/* Channel header legend */}
                  <div className="grid grid-cols-[1fr_repeat(4,_48px)] gap-2 mb-3 items-center">
                    <div />
                    {preferenceChannels.map(ch => (
                      <div key={ch.key} className="text-center">
                        <ch.icon className="w-4 h-4 mx-auto text-gray-400" />
                        <p className="text-[8px] text-gray-400 font-medium">{ch.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Category rows */}
                  <div className="space-y-2">
                    {preferenceCategories.map((cat, catIdx) => (
                      <motion.div
                        key={cat.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: catIdx * 0.06, duration: 0.3, ease: easeOut }}
                        className="p-3 rounded-2xl bg-gray-50 border border-gray-100"
                      >
                        <div className="grid grid-cols-[1fr_repeat(4,_48px)] gap-2 items-center">
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4 text-[#003087]" />
                            <div>
                              <p className="text-xs font-semibold text-[#2C2E2F]">{cat.label}</p>
                              <p className="text-[9px] text-gray-400 hidden sm:block">{cat.desc}</p>
                            </div>
                          </div>

                          {preferenceChannels.map(ch => {
                            const isActive = preferences[cat.key]?.[ch.key] ?? false;
                            return (
                              <div key={ch.key} className="flex justify-center">
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={() => toggleChannel(cat.key, ch.key)}
                                  aria-label={`${ch.label} pour ${cat.label}: ${isActive ? 'Active' : 'Desactive'}`}
                                  className="data-[state=checked]:bg-[#00A651]"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => {
                        const allOn: PreferencesMap = {} as PreferencesMap;
                        for (const cat of preferenceCategories) {
                          allOn[cat.key] = { email: true, sms: true, push: true, whatsapp: true };
                        }
                        setPreferences(allOn);
                      }}
                      className="flex-1 py-2.5 text-xs font-medium text-[#003087] border border-[#003087]/20 rounded-xl hover:bg-[#003087]/5 transition-colors"
                    >
                      Tout activer
                    </button>
                    <button
                      onClick={() => {
                        const allOff: PreferencesMap = {} as PreferencesMap;
                        for (const cat of preferenceCategories) {
                          allOff[cat.key] = { email: false, sms: false, push: false, whatsapp: false };
                        }
                        setPreferences(allOff);
                      }}
                      className="flex-1 py-2.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Tout desactiver
                    </button>
                  </div>

                  {/* Save button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={savePreferences}
                    disabled={saving}
                    className="w-full mt-4 py-3 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Enregistrement...' : 'Enregistrer les preferences'}
                  </motion.button>

                  <div className="mt-4 p-3 bg-[#009CDE]/5 border border-[#009CDE]/10 rounded-xl">
                    <p className="text-[10px] text-[#009CDE] leading-relaxed flex items-start gap-1">
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                      Les notifications de securite (connexion, KYC, escrow) sont toujours actives par email et push pour proteger votre compte.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* ====== PREMIUM TAB ====== */}
            {activeTab === 'premium' && (
              <div className="flex-1 overflow-y-auto p-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="font-display text-base font-bold text-[#2C2E2F]">
                      Notifications Premium
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-5">
                    Notifications exclusives pour les membres Premium et Pro.
                  </p>

                  <div className="space-y-3">
                    {premiumNotificationTypes.map((type, idx) => (
                      <motion.div
                        key={type.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08, duration: 0.3, ease: easeOut }}
                        className="p-4 rounded-2xl bg-gradient-to-r from-[#003087]/5 to-[#D4AF37]/5 border border-[#D4AF37]/10"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#D4AF37]/10">
                              <type.icon className="w-5 h-5 text-[#D4AF37]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#2C2E2F]">{type.label}</p>
                              <p className="text-[10px] text-gray-500">{type.desc}</p>
                            </div>
                          </div>
                          <Switch
                            checked={premiumEnabled[type.key] ?? false}
                            onCheckedChange={(checked) => {
                              setPremiumEnabled(prev => ({ ...prev, [type.key]: checked }));
                              localStorage.setItem('afribayit-premium-notifs', JSON.stringify({
                                ...premiumEnabled,
                                [type.key]: checked,
                              }));
                            }}
                            className="data-[state=checked]:bg-[#D4AF37]"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {!user?.role?.includes('premium') && !user?.role?.includes('pro') && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="mt-5 p-4 bg-[#003087] rounded-2xl text-white"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-5 h-5 text-[#D4AF37]" />
                        <h4 className="font-semibold text-sm">Passez en Premium</h4>
                      </div>
                      <p className="text-xs text-white/80 mb-3">
                        Debloquez les notifications avancees : qui consulte votre profil, matching inverse, et plus encore.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-2.5 bg-[#D4AF37] text-[#003087] rounded-xl text-sm font-semibold hover:bg-[#e5c249] transition-colors"
                      >
                        Decouvrir Premium
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}

            {/* ====== SILENT HOURS TAB ====== */}
            {activeTab === 'silent' && (
              <div className="flex-1 overflow-y-auto p-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Moon className="w-5 h-5 text-[#003087]" />
                    <h3 className="font-display text-base font-bold text-[#2C2E2F]">
                      Heures silencieuses
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-5">
                    Configurez une plage horaire pendant laquelle vous ne recevez pas de notifications.
                  </p>

                  {/* Enable toggle */}
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">Ne pas deranger</p>
                        <p className="text-[10px] text-gray-500">Desactive les notifications pendant vos heures de repos</p>
                      </div>
                      <Switch
                        checked={silentHoursEnabled}
                        onCheckedChange={(checked) => {
                          setSilentHoursEnabled(checked);
                          saveSilentHours();
                        }}
                        className="data-[state=checked]:bg-[#003087]"
                      />
                    </div>
                  </div>

                  {/* Time range selector */}
                  {silentHoursEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {/* Visual time display */}
                      <div className="p-6 rounded-2xl bg-[#003087]/5 border border-[#003087]/10 text-center">
                        <Moon className="w-8 h-8 text-[#003087] mx-auto mb-2" />
                        <p className="text-2xl font-bold text-[#003087]">{formatSilentRange()}</p>
                        <p className="text-xs text-gray-500 mt-1">Plage silencieuse</p>
                      </div>

                      {/* Start hour slider */}
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-[#2C2E2F]">Debut</p>
                          <p className="text-sm font-bold text-[#003087]">{String(silentStart).padStart(2, '0')}h</p>
                        </div>
                        <Slider
                          value={[silentStart]}
                          onValueChange={([v]) => {
                            setSilentStart(v);
                            saveSilentHours();
                          }}
                          min={18}
                          max={23}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                          <span>18h</span>
                          <span>23h</span>
                        </div>
                      </div>

                      {/* End hour slider */}
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-[#2C2E2F]">Fin</p>
                          <p className="text-sm font-bold text-[#003087]">{String(silentEnd).padStart(2, '0')}h</p>
                        </div>
                        <Slider
                          value={[silentEnd]}
                          onValueChange={([v]) => {
                            setSilentEnd(v);
                            saveSilentHours();
                          }}
                          min={5}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                          <span>5h</span>
                          <span>10h</span>
                        </div>
                      </div>

                      {/* Quick presets */}
                      <div>
                        <p className="text-xs font-medium text-[#2C2E2F] mb-2">Presets rapides</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Standard (22h-7h)', start: 22, end: 7 },
                            { label: 'Couche-tot (21h-6h)', start: 21, end: 6 },
                            { label: 'Noctambule (23h-8h)', start: 23, end: 8 },
                            { label: 'Sieste (13h-15h)', start: 13, end: 15 },
                          ].map(preset => (
                            <motion.button
                              key={preset.label}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setSilentStart(preset.start);
                                setSilentEnd(preset.end);
                                saveSilentHours();
                              }}
                              className={`p-2.5 rounded-xl text-[10px] font-medium transition-colors border ${
                                silentStart === preset.start && silentEnd === preset.end
                                  ? 'bg-[#003087] text-white border-[#003087]'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#003087]/30'
                              }`}
                            >
                              {preset.label}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl">
                        <p className="text-[10px] text-[#D4AF37] leading-relaxed flex items-start gap-1">
                          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                          Les alertes de securite et transactions escrow ne sont jamais silenciees, meme pendant les heures de repos.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ====== Sub-components ======

/** Chevron icon for expand/collapse */
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/** Individual notification item with quick actions */
function NotificationItem({
  notif,
  onAction,
  actionLoading,
}: {
  notif: Record<string, unknown>;
  onAction: (notif: Record<string, unknown>, action: QuickAction) => void;
  actionLoading: string | null;
}) {
  const [showActions, setShowActions] = useState(false);
  const notifType = String(notif.type ?? notif.category ?? 'system');
  const notifRead = Boolean(notif.read);
  const notifDate = String(notif.createdAt ?? notif.date ?? '');
  const IconComponent = typeIconMap[notifType] || ClipboardList;
  const quickActions = getQuickActions(notif);
  const isLoading = actionLoading === String(notif.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 hover:bg-gray-50 transition-colors ${
        !notifRead ? 'bg-[#003087]/3' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${typeColors[notifType] || '#6b7280'}10` }}
        >
          <IconComponent className="w-4 h-4" style={{ color: typeColors[notifType] || '#6b7280' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">{String(notif.title ?? '')}</h4>
            {!notifRead && (
              <span className="w-2 h-2 bg-[#003087] rounded-full shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(notif.message ?? '')}</p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-gray-400">
              {formatTimeAgo(notifDate)}
            </p>
            {/* Quick actions */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1"
                >
                  {quickActions.map(action => (
                    <motion.button
                      key={action.type}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(notif, action.type);
                      }}
                      disabled={isLoading}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                        action.type === 'dismiss'
                          ? 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                          : action.type === 'validate'
                            ? 'hover:bg-green-50 text-[#00A651]'
                            : 'hover:bg-[#003087]/5 text-[#003087]'
                      }`}
                      title={action.label}
                    >
                      <action.icon className="w-3.5 h-3.5" />
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
