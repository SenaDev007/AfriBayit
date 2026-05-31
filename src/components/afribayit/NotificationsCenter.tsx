'use client';

import React, { useState, useEffect } from 'react';
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

export default function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [filter, setFilter] = useState<string>('all');

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
            className="w-full sm:w-96 h-full bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#2C2E2F]">Notifications</h2>
                  <p className="text-xs text-gray-500">{unreadCount} non lue{unreadCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0 || markReadMutation.isPending}
                    className="text-xs text-[#003087] font-medium hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tout marquer lu
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 overflow-x-auto">
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
            </div>

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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
