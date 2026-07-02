// P3.7-2 — Single notification item with hover-revealed quick actions.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { typeColors, typeIconMap } from './constants';
import { formatTimeAgo, getQuickActions } from './utils';
import type { NotificationData, QuickAction } from './types';

interface NotificationItemProps {
  notif: NotificationData;
  onAction: (notif: NotificationData, action: QuickAction) => void;
  actionLoading: string | null;
}

export default function NotificationItem({ notif, onAction, actionLoading }: NotificationItemProps) {
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
      className={`p-4 hover:bg-gray-50 transition-colors ${!notifRead ? 'bg-[#003087]/3' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${typeColors[notifType] || '#6b7280'}10` }}
        >
          <IconComponent
            className="w-4 h-4"
            style={{ color: typeColors[notifType] || '#6b7280' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">
              {String(notif.title ?? '')}
            </h4>
            {!notifRead && <span className="w-2 h-2 bg-[#003087] rounded-full shrink-0" />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{String(notif.message ?? '')}</p>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-gray-400">{formatTimeAgo(notifDate)}</p>
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
                  {quickActions.map((action) => (
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

// Reusable skeleton loader for the notifications list.
export function NotificationItemSkeleton() {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-40 mb-1" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}
