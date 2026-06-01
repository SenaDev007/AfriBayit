'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Coins,
  MessageCircle,
  ClipboardList,
  Gift,
  Users,
  Bot,
  CheckCircle,
  User,
  Crown,
  Lock,
  Home,
  Megaphone,
  Eye,
  TrendingUp,
  BarChart3,
  CreditCard,
  X,
  ExternalLink,
} from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtime';
import { useAuthStore } from '@/stores/authStore';

// ── Types ──────────────────────────────────────────────────────────────

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category?: string;
  actionUrl?: string;
  priority?: string;
  createdAt: string;
}

// ── Icon Mapping ──────────────────────────────────────────────────────

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

// ── Toast Item Component ──────────────────────────────────────────────

function ToastItem({
  notification,
  onDismiss,
  onAction,
}: {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
  onAction: (url: string) => void;
}) {
  const notifType = notification.type || 'system';
  const IconComponent = typeIconMap[notifType] || Bell;
  const color = typeColors[notifType] || '#6b7280';

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleAction = () => {
    if (notification.actionUrl) {
      onAction(notification.actionUrl);
    }
    onDismiss(notification.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-sm w-full pointer-events-auto"
    >
      {/* Color accent bar */}
      <div className="h-1" style={{ backgroundColor: color }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}15` }}
          >
            <IconComponent className="w-5 h-5" style={{ color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">
              {notification.title}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {notification.message}
            </p>

            {/* Action button */}
            {notification.actionUrl && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAction}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: `${color}10`,
                  color: color,
                }}
              >
                <ExternalLink className="w-3 h-3" />
                Voir
              </motion.button>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(notification.id)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5, ease: 'linear' }}
          className="h-0.5 mt-3 rounded-full"
          style={{ backgroundColor: `${color}30` }}
        />
      </div>
    </motion.div>
  );
}

// ── Main NotificationToast Component ──────────────────────────────────

export default function NotificationToast() {
  const { user } = useAuthStore();
  const userId = user?.id;
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const maxToasts = 3;

  // Subscribe to real-time notifications
  useRealtimeNotifications(userId, {
    onNewNotification: useCallback((data: any) => {
      const toast: ToastNotification = {
        id: data.id || `toast-${Date.now()}`,
        title: data.title || 'Nouvelle notification',
        message: data.message || '',
        type: data.type || data.category || 'system',
        category: data.category,
        actionUrl: data.actionUrl,
        priority: data.priority,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      setToasts(prev => {
        // Prevent duplicates
        if (prev.some(t => t.id === toast.id)) return prev;
        // Keep only the latest maxToasts notifications
        const updated = [toast, ...prev].slice(0, maxToasts);
        return updated;
      });
    }, []),
  });

  // Also listen for the custom event dispatched by NotificationCenter
  useEffect(() => {
    const handleRealtimeNotification = (event: Event) => {
      const customEvent = event as CustomEvent;
      const data = customEvent.detail;
      if (!data) return;

      const toast: ToastNotification = {
        id: data.id || `toast-${Date.now()}`,
        title: data.title || 'Nouvelle notification',
        message: data.message || '',
        type: data.type || data.category || 'system',
        category: data.category,
        actionUrl: data.actionUrl,
        priority: data.priority,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      setToasts(prev => {
        if (prev.some(t => t.id === toast.id)) return prev;
        const updated = [toast, ...prev].slice(0, maxToasts);
        return updated;
      });
    };

    window.addEventListener('afribayit:realtime-notification', handleRealtimeNotification);
    return () => {
      window.removeEventListener('afribayit:realtime-notification', handleRealtimeNotification);
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAction = useCallback((url: string) => {
    window.dispatchEvent(new CustomEvent('afribayit:navigate', { detail: url }));
  }, []);

  if (!userId) return null;

  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            notification={toast}
            onDismiss={dismissToast}
            onAction={handleAction}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Global NotificationToast provider - add this to your root layout
 * to enable real-time notification toasts across the entire app
 */
export function NotificationToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NotificationToast />
    </>
  );
}
