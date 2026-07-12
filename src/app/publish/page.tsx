'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useAuthStore } from '@/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Ban } from 'lucide-react';
import SafeModule from '@/components/safe/SafeModule';


const PropertyPublishModule = dynamic(() => import('@/components/afribayit/PropertyPublishModule'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50/30 pt-20 pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  ),
});

export default function PublishPage() {
  const { onNavigate } = useAfriBayitNav();
  const { user, isAuthenticated } = useAuthStore();

  const showNotice = useMemo(() => {
    return !!(isAuthenticated && user?.role === 'agent' && (user as unknown as Record<string, unknown>).verificationStatus !== 'APPROVED');
  }, [isAuthenticated, user]);

  const noticeMessage = useMemo(() => {
    const status = (user as unknown as Record<string, unknown>)?.verificationStatus as string | undefined;
    if (status === 'REJECTED') {
      return {
        title: 'Certification rejetée',
        description: 'Votre demande de certification a été rejetée. Veuillez soumettre de nouveaux documents ou contacter le support AfriBayit.',
        variant: 'error' as const,
      };
    }
    return {
      title: 'Compte agent non certifié',
      description: 'Votre compte agent n\'est pas encore certifié AfriBayit (statut : EN ATTENTE). Vous ne pouvez pas publier de biens immobiliers tant que votre certification n\'est pas approuvée (statut APPROVED).',
      variant: 'warning' as const,
    };
  }, [user]);

  return (
    <div className="min-h-screen">
      <AnimatePresence>
        {showNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mb-4"
          >
            <div className={`border rounded-2xl p-4 flex items-start gap-3 ${
              noticeMessage.variant === 'error'
                ? 'bg-red-50 border-red-300'
                : 'bg-[#D4AF37]/10 border-[#D4AF37]/30'
            }`}>
              <span className="text-2xl shrink-0">{noticeMessage.variant === 'error' ? <Ban className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}</span>
              <div className="flex-1">
                <h3 className={`font-display text-base font-bold mb-1 ${
                  noticeMessage.variant === 'error' ? 'text-red-700' : 'text-[#0a2a5e]'
                }`}>
                  {noticeMessage.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {noticeMessage.description}
                </p>
                <p className="text-xs text-gray-500">
                  Veuillez compléter la certification AfriBayit en soumettant vos documents professionnels (licence agent, pièce d&apos;identité, justificatif d&apos;agence) depuis votre tableau de bord.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SafeModule>
        <PropertyPublishModule onNavigate={onNavigate} />
      </SafeModule>
    </div>
  );
}
