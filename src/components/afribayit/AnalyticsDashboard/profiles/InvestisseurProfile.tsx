'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-translate';
import {
  Banknote,
  Building2,
  History,
  Landmark,
  Percent,
  Search,
  TrendingUp,
} from 'lucide-react';
import { INVESTISSEUR_ANALYTICS, easeOut } from '../demoData';
import { formatPrice } from '../utils';

export default function InvestisseurProfile() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Landmark className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-lg text-primary-deep">{formatPrice(INVESTISSEUR_ANALYTICS.portfolioValue)}</p>
          <p className="text-xs text-gray-text">{t('analytics.investisseurProfile.portfolioValue', 'Portfolio immobilier')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <TrendingUp className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-xl text-[#00A651]">{INVESTISSEUR_ANALYTICS.totalROI}%</p>
          <p className="text-xs text-gray-text">{t('analytics.investisseurProfile.totalRoi', 'ROI total')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Percent className="w-5 h-5 text-primary-green mb-1" />
          <p className="font-serif font-black text-xl text-primary-green">{INVESTISSEUR_ANALYTICS.roiLocatif}%</p>
          <p className="text-xs text-gray-text">{t('analytics.investisseurProfile.roiLocatif', 'ROI locatif')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Banknote className="w-5 h-5 text-accent-yellow mb-1" />
          <p className="font-serif font-black text-lg text-primary-deep">{formatPrice(INVESTISSEUR_ANALYTICS.monthlyRentalIncome)}</p>
          <p className="text-xs text-gray-text">{t('analytics.investisseurProfile.monthlyRental', 'Revenus locatifs/mois')}</p>
        </div>
      </div>

      {/* Activité recherche */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-primary-deep" /> {t('analytics.investisseurProfile.searchActivity', 'Activité recherche')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-primary-pale/30 rounded-2xl text-center"><p className="font-serif font-black text-2xl text-primary-deep">{INVESTISSEUR_ANALYTICS.activiteRecherche.biensConsultes}</p><p className="text-xs text-gray-text">{t('analytics.investisseurProfile.propertiesViewed', 'Biens consultés')}</p></div>
          <div className="p-4 bg-primary-pale/30 rounded-2xl text-center"><p className="font-serif font-black text-2xl text-accent-yellow">{INVESTISSEUR_ANALYTICS.activiteRecherche.alertesActives}</p><p className="text-xs text-gray-text">{t('analytics.investisseurProfile.activeAlerts', 'Alertes actives')}</p></div>
          <div className="p-4 bg-primary-pale/30 rounded-2xl text-center"><p className="font-serif font-black text-2xl text-[#00A651]">{INVESTISSEUR_ANALYTICS.activiteRecherche.visitesPlanifiees}</p><p className="text-xs text-gray-text">{t('analytics.investisseurProfile.scheduledVisits', 'Visites planifiées')}</p></div>
        </div>
      </div>

      {/* Portfolio immobilier with ROI locatif */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4">{t('analytics.investisseurProfile.portfolioTitle', 'Portfolio immobilier')}</h3>
        <div className="space-y-3">
          {INVESTISSEUR_ANALYTICS.investments.map(inv => (
            <div key={inv.name} className="flex items-center justify-between p-3 bg-primary-pale/30 rounded-2xl">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-primary-deep" />
                <div>
                  <p className="font-semibold text-sm text-primary-deep">{inv.name}</p>
                  <p className="text-xs text-gray-text">{inv.type} · {formatPrice(inv.value)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${inv.roi >= 15 ? 'text-[#00A651]' : 'text-accent-yellow'}`}>{inv.roi}% {t('analytics.investisseurProfile.roi', 'ROI')}</span>
                {inv.rentalYield > 0 && <p className="text-xs text-primary-green">{inv.rentalYield}% {t('analytics.investisseurProfile.rentalYield', 'rendement locatif')}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-[#00A651]/5 rounded-xl border border-[#00A651]/10">
          <p className="text-xs text-primary-deep"><span className="font-semibold text-[#00A651]">{t('analytics.investisseurProfile.occupancyRate', 'Taux d\'occupation')}: {INVESTISSEUR_ANALYTICS.occupancyRate}%</span> — {t('analytics.investisseurProfile.occupancyAboveMarket', 'Supérieur de 7% à la moyenne du marché.')}</p>
        </div>
      </div>

      {/* Historique transactions */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4 flex items-center gap-2"><History className="w-5 h-5 text-primary-deep" /> {t('analytics.investisseurProfile.transactionHistory', 'Historique transactions')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b-2 border-primary-pale text-primary-deep uppercase tracking-wider text-xs font-bold"><th className="text-left py-2">{t('analytics.investisseurProfile.date', 'Date')}</th><th className="text-left py-2">{t('analytics.investisseurProfile.type', 'Type')}</th><th className="text-left py-2">{t('analytics.investisseurProfile.property', 'Bien')}</th><th className="text-right py-2">{t('analytics.investisseurProfile.amount', 'Montant')}</th></tr></thead>
            <tbody>
              {INVESTISSEUR_ANALYTICS.historiqueTransactions.map((txn, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-primary-pale/30">
                  <td className="py-3 text-gray-text">{new Date(txn.date).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${txn.type === 'Acquisition' ? 'bg-primary-pale text-primary-deep' : 'bg-accent-yellow/15 text-accent-dark'}}`}>{txn.type}</span></td>
                  <td className="py-3 font-medium text-primary-deep">{txn.bien}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatPrice(txn.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4">{t('analytics.investisseurProfile.investmentFunnel', 'Entonnoir d\'investissement')}</h3>
        <div className="space-y-3">
          {INVESTISSEUR_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-gray-text">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === INVESTISSEUR_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#003087', minWidth: '40px' }}>
                  <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                </motion.div>
                <span className="text-xs text-gray-text w-12">{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
