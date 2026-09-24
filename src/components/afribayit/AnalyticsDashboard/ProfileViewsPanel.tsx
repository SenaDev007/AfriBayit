'use client';

import { motion } from 'framer-motion';
import { Eye, MousePointerClick, Search, TrendingUp, Users } from 'lucide-react';
import { easeOut } from './demoData';
import type { ProfileViewsRow } from './types';
import { useTranslation } from '@/lib/i18n/use-translate';

interface ProfileViewsPanelProps {
  profileViews: ProfileViewsRow;
}

export default function ProfileViewsPanel({ profileViews }: ProfileViewsPanelProps) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Eye className="w-4 h-4 text-primary-deep mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep mt-1">{profileViews.total}</p>
          <p className="text-xs text-gray-text">{t('analytics.profileViews.total', 'Vues totales')}</p>
          <span className="text-[10px] font-semibold text-[#00A651]">+{profileViews.evolution}%</span>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <MousePointerClick className="w-4 h-4 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-xl text-[#00A651] mt-1">{profileViews.direct}</p>
          <p className="text-xs text-gray-text">{t('analytics.profileViews.direct', 'Accès direct')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Search className="w-4 h-4 text-primary-green mb-1" />
          <p className="font-serif font-black text-xl text-primary-green mt-1">{profileViews.search}</p>
          <p className="text-xs text-gray-text">{t('analytics.profileViews.search', 'Via recherche')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Users className="w-4 h-4 text-accent-yellow mb-1" />
          <p className="font-serif font-black text-xl text-accent-dark mt-1">{profileViews.referral}</p>
          <p className="text-xs text-gray-text">{t('analytics.profileViews.referral', 'Via referral')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <TrendingUp className="w-4 h-4 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-xl text-[#00A651] mt-1">+{profileViews.evolution}%</p>
          <p className="text-xs text-gray-text">{t('analytics.profileViews.evolution', 'Évolution')}</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4">{t('analytics.profileViews.originTitle', 'Origine des vues')}</h3>
        <div className="space-y-4">
          {[
            { label: t('analytics.profileViews.originSearch', 'Recherche'), value: profileViews.search, total: profileViews.total, color: '#009CDE' },
            { label: t('analytics.profileViews.originDirect', 'Accès direct'), value: profileViews.direct, total: profileViews.total, color: '#00A651' },
            { label: t('analytics.profileViews.originReferral', 'Referral'), value: profileViews.referral, total: profileViews.total, color: '#D4AF37' },
          ].map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-text">{item.label}</span>
                <span className="font-mono text-sm font-bold" style={{ color: item.color }}>{item.value} ({Math.round((item.value / item.total) * 100)}%)</span>
              </div>
              <div className="h-3 bg-primary-pale rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.total) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
