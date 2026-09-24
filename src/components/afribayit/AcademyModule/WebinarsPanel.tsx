'use client';

// AfriBayit Academy — Webinars Panel (CDC §5.6.4)
// Live and recorded webinars with local experts.

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Video, Calendar, Clock, Users, Loader2, AlertCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { easeOut } from './types';
import { useTranslation } from '@/lib/i18n/use-translate';

interface Webinar {
  id: string;
  title: string;
  description: string;
  expertName: string;
  scheduledAt: string;
  duration: number;
  isLive: boolean;
  isRecorded: boolean;
  recordingUrl?: string;
  registeredCount: number;
}

export default function WebinarsPanel() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['academy-webinars'],
    queryFn: async () => {
      try {
        const res = await api.get<{ webinars: Webinar[] }>('/academy/webinars');
        return res;
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          return { webinars: [] };
        }
        throw err;
      }
    },
    staleTime: 60_000,
  });

  const webinars = data?.webinars ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary-deep" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-text">{t('academy.webinars.loadError', 'Impossible de charger les webinaires.')}</p>
      </div>
    );
  }

  if (webinars.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-primary-pale flex items-center justify-center mx-auto mb-4">
          <Video className="w-10 h-10 text-primary-green" />
        </div>
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-2">{t('academy.webinars.emptyTitle', 'Aucun webinaire programmé')}</h3>
        <p className="text-sm text-gray-text mb-4">
          {t('academy.webinars.emptyDesc', 'Les webinaires live avec experts locaux seront bientôt disponibles. Revenez bientôt !')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {webinars.map((webinar, i) => (
        <motion.div
          key={webinar.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, ease: easeOut }}
          className="bg-white rounded-3xl overflow-hidden shadow-lg border border-primary-pale card-shimmer"
        >
          <div className="h-2 bg-gradient-to-r from-primary-green to-primary-deep" />
          <div className="p-5">
            <div className="flex items-start gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary-pale flex items-center justify-center shrink-0">
                <Video className="w-6 h-6 text-primary-green" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base font-bold text-primary-deep mb-1">{webinar.title}</h3>
                <p className="text-xs text-gray-text">{webinar.expertName}</p>
              </div>
              {webinar.isLive && (
                <span className="px-2 py-1 bg-[#D93025] text-white text-xs font-bold rounded-full">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm text-gray-text mb-3 line-clamp-2">{webinar.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-text mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(webinar.scheduledAt).toLocaleDateString('fr-FR')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {webinar.duration} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {webinar.registeredCount}
              </span>
            </div>
            <button
              className={`w-full py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                webinar.isLive
                  ? 'bg-[#D93025] text-white hover:bg-[#c2261c]'
                  : webinar.isRecorded && webinar.recordingUrl
                    ? 'bg-primary-green text-white hover:bg-primary-deep'
                    : 'bg-primary-deep text-white hover:bg-primary-green'
              }`}
            >
              {webinar.isLive ? t('academy.webinars.joinLive', 'Rejoindre le live') : webinar.isRecorded ? t('academy.webinars.watchReplay', 'Voir le replay') : t('academy.webinars.register', 'S\'inscrire')}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
