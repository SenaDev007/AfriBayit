'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifications as mockNotifications } from '@/lib/mockData';

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
};

const typeColors: Record<string, string> = {
  transaction: '#00A651',
  message: '#009CDE',
  alert: '#D4AF37',
  system: '#6b7280',
  promotion: '#D93025',
};

export default function NotificationsCenter({ isOpen, onClose }: NotificationsCenterProps) {
  const [notifs, setNotifs] = useState(mockNotifications);
  const [filter, setFilter] = useState<string>('all');

  const unreadCount = notifs.filter(n => !n.read).length;

  const filtered = filter === 'all' ? notifs : notifs.filter(n => n.type === filter);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
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
                  <button onClick={markAllRead} className="text-xs text-[#003087] font-medium hover:underline">
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
                    {f === 'all' ? 'Toutes' : typeIcons[f] + ' ' + f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification List */}
            <div className="divide-y">
              {filtered.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notif.read ? 'bg-[#003087]/3' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${typeColors[notif.type]}10` }}
                    >
                      <span className="text-lg">{typeIcons[notif.type]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">{notif.title}</h4>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-[#003087] rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(notif.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
