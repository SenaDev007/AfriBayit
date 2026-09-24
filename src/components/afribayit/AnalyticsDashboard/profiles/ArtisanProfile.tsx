'use client';

import { motion } from 'framer-motion';
import {
  Clock,
  FileText,
  Star,
  ThumbsUp,
  Trophy,
  Wrench,
} from 'lucide-react';
import { ARTISAN_ANALYTICS, easeOut } from '../demoData';
import { useTranslation } from '@/lib/i18n/use-translate';

export default function ArtisanProfile() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Wrench className="w-5 h-5 text-accent-yellow mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep">{ARTISAN_ANALYTICS.missionsCompleted}</p>
          <p className="text-xs text-gray-text">{t('analytics.artisanProfile.missionsCompleted', 'Missions terminées')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <ThumbsUp className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-xl text-[#00A651]">{ARTISAN_ANALYTICS.tauxSatisfaction}%</p>
          <p className="text-xs text-gray-text">{t('analytics.artisanProfile.satisfactionRate', 'Taux satisfaction')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Clock className="w-5 h-5 text-primary-green mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep">{ARTISAN_ANALYTICS.responseTime} min</p>
          <p className="text-xs text-gray-text">{t('analytics.artisanProfile.responseTime', 'Temps de réponse')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Trophy className="w-5 h-5 text-accent-yellow mb-1" />
          <p className="font-serif font-black text-xl text-accent-yellow">#{ARTISAN_ANALYTICS.classementMetier.position}</p>
          <p className="text-xs text-gray-text">{t('analytics.artisanProfile.ranking', 'Classement')} {ARTISAN_ANALYTICS.classementMetier.specialty}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Star className="w-5 h-5 text-accent-yellow mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep">{ARTISAN_ANALYTICS.avgRating}</p>
          <p className="text-xs text-gray-text">{t('analytics.artisanProfile.avgRating', 'Note moyenne')}</p>
        </div>
      </div>

      {/* Demandes devis breakdown */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-deep" /> {t('analytics.artisanProfile.quoteRequests', 'Demandes devis')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('analytics.artisanProfile.quoteReceived', 'Reçues'), value: ARTISAN_ANALYTICS.demandesDevis.recues, color: '#003087' },
            { label: t('analytics.artisanProfile.quoteSent', 'Envoyées'), value: ARTISAN_ANALYTICS.demandesDevis.envoyees, color: '#009CDE' },
            { label: t('analytics.artisanProfile.quoteAccepted', 'Acceptées'), value: ARTISAN_ANALYTICS.demandesDevis.acceptees, color: '#00A651' },
            { label: t('analytics.artisanProfile.quotePending', 'En attente'), value: ARTISAN_ANALYTICS.demandesDevis.enAttente, color: '#D4AF37' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-primary-pale/30 rounded-2xl text-center">
              <p className="font-mono text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs text-gray-text">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4">{t('analytics.artisanProfile.conversionFunnel', 'Entonnoir de conversion artisan')}</h3>
        <div className="space-y-3">
          {ARTISAN_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-gray-text">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === ARTISAN_ANALYTICS.conversionFunnel.length - 1 ? '#D4AF37' : '#003087', minWidth: '40px' }}>
                  <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                </motion.div>
                <span className="text-xs text-gray-text w-12">{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4">{t('analytics.artisanProfile.specialties', 'Spécialités')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ARTISAN_ANALYTICS.specialties.map(spec => (
            <div key={spec.name} className="p-4 bg-primary-pale/30 rounded-2xl">
              <p className="font-semibold text-sm text-primary-deep">{spec.name}</p>
              <p className="text-xs text-gray-text mt-1">{spec.missions} {t('analytics.artisanProfile.missions', 'missions')} · <span className="text-accent-yellow">{spec.rating}/5</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
