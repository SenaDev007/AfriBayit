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
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Eye className="w-4 h-4 text-[#003087] mb-1" />
          <p className="font-mono text-xl font-bold text-[#003087] mt-1">{profileViews.total}</p>
          <p className="text-xs text-gray-500">{t('analytics.profileViews.total', 'Vues totales')}</p>
          <span className="text-[10px] font-semibold text-[#00A651]">+{profileViews.evolution}%</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <MousePointerClick className="w-4 h-4 text-[#00A651] mb-1" />
          <p className="font-mono text-xl font-bold text-[#00A651] mt-1">{profileViews.direct}</p>
          <p className="text-xs text-gray-500">{t('analytics.profileViews.direct', 'Accès direct')}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Search className="w-4 h-4 text-[#009CDE] mb-1" />
          <p className="font-mono text-xl font-bold text-[#009CDE] mt-1">{profileViews.search}</p>
          <p className="text-xs text-gray-500">{t('analytics.profileViews.search', 'Via recherche')}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Users className="w-4 h-4 text-[#D4AF37] mb-1" />
          <p className="font-mono text-xl font-bold text-[#D4AF37] mt-1">{profileViews.referral}</p>
          <p className="text-xs text-gray-500">{t('analytics.profileViews.referral', 'Via referral')}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <TrendingUp className="w-4 h-4 text-[#00A651] mb-1" />
          <p className="font-mono text-xl font-bold text-[#00A651] mt-1">+{profileViews.evolution}%</p>
          <p className="text-xs text-gray-500">{t('analytics.profileViews.evolution', 'Évolution')}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4">{t('analytics.profileViews.originTitle', 'Origine des vues')}</h3>
        <div className="space-y-4">
          {[
            { label: t('analytics.profileViews.originSearch', 'Recherche'), value: profileViews.search, total: profileViews.total, color: '#009CDE' },
            { label: t('analytics.profileViews.originDirect', 'Accès direct'), value: profileViews.direct, total: profileViews.total, color: '#00A651' },
            { label: t('analytics.profileViews.originReferral', 'Referral'), value: profileViews.referral, total: profileViews.total, color: '#D4AF37' },
          ].map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="font-mono text-sm font-bold" style={{ color: item.color }}>{item.value} ({Math.round((item.value / item.total) * 100)}%)</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.total) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-full rounded-lg" style={{ backgroundColor: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
