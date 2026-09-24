'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { SearchAppearanceRow } from './types';
import { useTranslation } from '@/lib/i18n/use-translate';

interface SearchPanelProps {
  searchAppearances: SearchAppearanceRow[];
}

export default function SearchPanel({ searchAppearances }: SearchPanelProps) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-1 flex items-center gap-2"><Search className="w-5 h-5 text-primary-green" /> {t('analytics.searchPanel.title', 'Apparitions en recherche')}</h3>
        <p className="text-sm text-gray-text mb-4">{t('analytics.searchPanel.subtitle', 'Mots-clés par lesquels vos biens apparaissent dans les résultats de recherche.')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-primary-pale text-primary-deep uppercase tracking-wider text-xs font-bold"><th className="text-left py-2">{t('analytics.searchPanel.colKeyword', 'Mot-clé')}</th><th className="text-right py-2">{t('analytics.searchPanel.colAppearances', 'Apparitions')}</th><th className="text-right py-2">{t('analytics.searchPanel.colClicks', 'Clics')}</th><th className="text-right py-2">{t('analytics.searchPanel.colCtr', 'CTR')}</th></tr></thead>
            <tbody>
              {searchAppearances.map((kw) => (
                <tr key={kw.keyword} className="border-b last:border-0 hover:bg-primary-pale/30">
                  <td className="py-3 font-medium text-primary-deep">{kw.keyword}</td>
                  <td className="py-3 text-right font-mono">{kw.appearances}</td>
                  <td className="py-3 text-right font-mono text-primary-deep">{kw.clicks}</td>
                  <td className="py-3 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${kw.ctr >= 17 ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-accent-yellow/15 text-accent-dark'}`}>{kw.ctr}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
