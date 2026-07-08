'use client';

import { motion } from 'framer-motion';
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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Landmark className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-mono text-lg font-bold text-[#2C2E2F]">{formatPrice(INVESTISSEUR_ANALYTICS.portfolioValue)}</p>
          <p className="text-xs text-gray-500">Portfolio immobilier</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <TrendingUp className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-mono text-xl font-bold text-[#00A651]">{INVESTISSEUR_ANALYTICS.totalROI}%</p>
          <p className="text-xs text-gray-500">ROI total</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Percent className="w-5 h-5 text-[#009CDE] mb-1" />
          <p className="font-mono text-xl font-bold text-[#009CDE]">{INVESTISSEUR_ANALYTICS.roiLocatif}%</p>
          <p className="text-xs text-gray-500">ROI locatif</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Banknote className="w-5 h-5 text-[#D4AF37] mb-1" />
          <p className="font-mono text-lg font-bold text-[#2C2E2F]">{formatPrice(INVESTISSEUR_ANALYTICS.monthlyRentalIncome)}</p>
          <p className="text-xs text-gray-500">Revenus locatifs/mois</p>
        </div>
      </div>

      {/* Activité recherche */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Search className="w-5 h-5 text-[#003087]" /> Activité recherche</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl text-center"><p className="font-mono text-2xl font-bold text-[#003087]">{INVESTISSEUR_ANALYTICS.activiteRecherche.biensConsultes}</p><p className="text-xs text-gray-500">Biens consultés</p></div>
          <div className="p-4 bg-gray-50 rounded-xl text-center"><p className="font-mono text-2xl font-bold text-[#D4AF37]">{INVESTISSEUR_ANALYTICS.activiteRecherche.alertesActives}</p><p className="text-xs text-gray-500">Alertes actives</p></div>
          <div className="p-4 bg-gray-50 rounded-xl text-center"><p className="font-mono text-2xl font-bold text-[#00A651]">{INVESTISSEUR_ANALYTICS.activiteRecherche.visitesPlanifiees}</p><p className="text-xs text-gray-500">Visites planifiées</p></div>
        </div>
      </div>

      {/* Portfolio immobilier with ROI locatif */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Portfolio immobilier</h3>
        <div className="space-y-3">
          {INVESTISSEUR_ANALYTICS.investments.map(inv => (
            <div key={inv.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-[#003087]" />
                <div>
                  <p className="font-semibold text-sm text-[#2C2E2F]">{inv.name}</p>
                  <p className="text-xs text-gray-500">{inv.type} · {formatPrice(inv.value)}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${inv.roi >= 15 ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>{inv.roi}% ROI</span>
                {inv.rentalYield > 0 && <p className="text-xs text-[#009CDE]">{inv.rentalYield}% rendement locatif</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-[#00A651]/5 rounded-xl border border-[#00A651]/10">
          <p className="text-xs text-[#2C2E2F]"><span className="font-semibold text-[#00A651]">Taux d&apos;occupation : {INVESTISSEUR_ANALYTICS.occupancyRate}%</span> — Supérieur de 7% à la moyenne du marché.</p>
        </div>
      </div>

      {/* Historique transactions */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><History className="w-5 h-5 text-[#003087]" /> Historique transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 text-gray-500 font-medium">Date</th><th className="text-left py-2 text-gray-500 font-medium">Type</th><th className="text-left py-2 text-gray-500 font-medium">Bien</th><th className="text-right py-2 text-gray-500 font-medium">Montant</th></tr></thead>
            <tbody>
              {INVESTISSEUR_ANALYTICS.historiqueTransactions.map((txn, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 text-gray-600">{new Date(txn.date).toLocaleDateString('fr-FR')}</td>
                  <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${txn.type === 'Acquisition' ? 'bg-[#003087]/10 text-[#003087]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>{txn.type}</span></td>
                  <td className="py-3 font-medium text-[#2C2E2F]">{txn.bien}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatPrice(txn.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir d&apos;investissement</h3>
        <div className="space-y-3">
          {INVESTISSEUR_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-gray-600">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === INVESTISSEUR_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#003087', minWidth: '40px' }}>
                  <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                </motion.div>
                <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
