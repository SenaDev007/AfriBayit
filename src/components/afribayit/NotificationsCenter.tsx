'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications, useMarkNotificationRead } from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const typeIcons: Record<string, string> = {
  transaction: '💰',
  message: '💬',
  alert: '🔔',
  system: '⚙️',
  promotion: '🎁',
  community: '👥',
  rebecca: '🤖',
  certification: '✅',
  profile: '👤',
  premium: '👑',
  security: '🔒',
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

// Notification categories for preferences
const preferenceCategories = [
  { key: 'property', label: 'Immobilier', icon: '🏠', desc: 'Alertes de biens, prix, disponibilité' },
  { key: 'community', label: 'Communauté', icon: '👥', desc: 'Posts, réponses, groupes, événements' },
  { key: 'escrow', label: 'Escrow', icon: '🔒', desc: 'Transactions, paiements, libérations' },
  { key: 'academy', label: 'Académie', icon: '📚', desc: 'Cours, certificats, progression' },
  { key: 'marketing', label: 'Marketing', icon: '🎁', desc: 'Promotions, offres, parrainage' },
] as const;

// Notification channels for toggles
const preferenceChannels = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'sms', label: 'SMS', icon: '💬' },
  { key: 'push', label: 'Push', icon: '📱' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '📲' },
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

export default function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [filter, setFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'notifications' | 'preferences'>('notifications');
  const [preferences, setPreferences] = useState<PreferencesMap>(defaultPreferences);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, isError } = useNotifications(userId, 1, 50);
  const markReadMutation = useMarkNotificationRead();

  const notifications = (data?.notifications ?? []) as Record<string, unknown>[];
  const unreadCount = notifications.filter(n => !n.read).length;

  const filtered = filter === 'all' ? notifications : notifications.filter(n => String(n.type) === filter || String(n.category) === filter);

  const markAllRead = () => {
    notifications.filter(n => !n.read).forEach(n => {
      markReadMutation.mutate(String(n.id));
    });
  };

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

  // Save preferences (simulated — in production would call API)
  const savePreferences = useCallback(async () => {
    setSaving(true);
    try {
      // In production: await apiPost('/api/notifications/preferences', preferences);
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
    } catch {
      // Ignore parse errors
    }
  }, []);

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
            className="w-full sm:w-[420px] h-full bg-white shadow-2xl overflow-y-auto"
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
                    <button
                      onClick={markAllRead}
                      disabled={unreadCount === 0 || markReadMutation.isPending}
                      className="text-xs text-[#003087] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Tout marquer lu
                    </button>
                  )}
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-white text-[#003087] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🔔 Notifications
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'preferences'
                      ? 'bg-white text-[#003087] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  ⚙️ Préférences
                </button>
              </div>

              {/* Filters (only on notifications tab) */}
              {activeTab === 'notifications' && (
                <div className="flex gap-1.5 overflow-x-auto mt-3">
                  {['all', 'transaction', 'message', 'alert', 'promotion'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
                        filter === f ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {f === 'all' ? 'Toutes' : (typeIcons[f] ?? '📋') + ' ' + f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ====== NOTIFICATIONS TAB ====== */}
            {activeTab === 'notifications' && (
              <>
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
                    <span className="text-3xl block mb-2">🔔</span>
                    <p className="text-sm text-gray-500">Aucune notification</p>
                  </div>
                )}

                {/* Notification List */}
                {!isLoading && !isError && (
                  <div className="divide-y">
                    {filtered.map((notif) => {
                      const notifType = String(notif.type ?? notif.category ?? 'system');
                      const notifRead = Boolean(notif.read);
                      const notifDate = String(notif.createdAt ?? notif.date ?? '');
                      return (
                        <motion.div
                          key={String(notif.id)}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notifRead ? 'bg-[#003087]/3' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${typeColors[notifType] || '#6b7280'}10` }}
                            >
                              <span className="text-lg">{typeIcons[notifType] || '📋'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">{String(notif.title ?? '')}</h4>
                                {!notifRead && (
                                  <span className="w-2 h-2 bg-[#003087] rounded-full shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(notif.message ?? '')}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {notifDate ? new Date(notifDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ====== PREFERENCES TAB ====== */}
            {activeTab === 'preferences' && (
              <div className="p-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1">
                    Canaux de notification
                  </h3>
                  <p className="text-xs text-gray-500 mb-5">
                    Choisissez comment vous souhaitez recevoir les alertes pour chaque catégorie.
                  </p>

                  {/* Channel header legend */}
                  <div className="grid grid-cols-[1fr_repeat(4,_48px)] gap-2 mb-3 items-center">
                    <div />
                    {preferenceChannels.map(ch => (
                      <div key={ch.key} className="text-center">
                        <span className="text-sm">{ch.icon}</span>
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
                          {/* Category info */}
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.icon}</span>
                            <div>
                              <p className="text-xs font-semibold text-[#2C2E2F]">{cat.label}</p>
                              <p className="text-[9px] text-gray-400 hidden sm:block">{cat.desc}</p>
                            </div>
                          </div>

                          {/* Channel toggles */}
                          {preferenceChannels.map(ch => {
                            const isActive = preferences[cat.key]?.[ch.key] ?? false;
                            return (
                              <div key={ch.key} className="flex justify-center">
                                <button
                                  onClick={() => toggleChannel(cat.key, ch.key)}
                                  className={`relative w-10 h-5 rounded-full transition-colors ${
                                    isActive ? 'bg-[#00A651]' : 'bg-gray-300'
                                  }`}
                                  aria-label={`${ch.label} pour ${cat.label}: ${isActive ? 'Activé' : 'Désactivé'}`}
                                >
                                  <motion.div
                                    layout
                                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                                    style={{ left: isActive ? '1.25rem' : '0.125rem' }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                  />
                                </button>
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
                      Tout désactiver
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
                    {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
                  </motion.button>

                  {/* Info notice */}
                  <div className="mt-4 p-3 bg-[#009CDE]/5 border border-[#009CDE]/10 rounded-xl">
                    <p className="text-[10px] text-[#009CDE] leading-relaxed">
                      💡 Les notifications de sécurité (connexion, KYC, escrow) sont toujours actives par email et push pour protéger votre compte.
                    </p>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
