'use client';

import { motion } from 'framer-motion';
import {
  Crown,
  Flame,
  LayoutGrid,
  Receipt,
  Target,
  Timer,
  Trophy,
} from 'lucide-react';
import { AGENT_ANALYTICS, ZONE_PERFORMANCE, easeOut } from '../demoData';
import { formatPrice } from '../utils';

export default function AgentProfile() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
          <Timer className="w-8 h-8 mx-auto mb-2 text-[#003087]" />
          <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Temps de vente moyen</h4>
          <p className="font-mono text-2xl font-bold text-[#00A651]">{AGENT_ANALYTICS.timeToSale.avg} jours</p>
          <p className="text-xs text-gray-500 mt-1">Médiane : {AGENT_ANALYTICS.timeToSale.median}j · Record : {AGENT_ANALYTICS.timeToSale.best}j</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
          <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Classement local</h4>
          <p className="font-mono text-2xl font-bold text-[#D4AF37]">#{AGENT_ANALYTICS.localRanking.position}</p>
          <p className="text-xs text-gray-500 mt-1">sur {AGENT_ANALYTICS.localRanking.totalAgents} agents · {AGENT_ANALYTICS.localRanking.city}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
          <Target className="w-8 h-8 mx-auto mb-2 text-[#009CDE]" />
          <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Score agent</h4>
          <p className="font-mono text-2xl font-bold text-[#003087]">{AGENT_ANALYTICS.localRanking.score}/100</p>
          <p className="text-xs text-gray-500 mt-1">Basé sur performance + avis + activité</p>
        </motion.div>
      </div>

      {/* Performance Annonces + Volume Transactions + ROI Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-5 shadow-sm border">
          <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-3 flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-[#003087]" /> Performance annonces</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Annonces actives</span><span className="font-mono font-bold text-[#003087]">{AGENT_ANALYTICS.performanceAnnonces.active}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Vues totales</span><span className="font-mono font-bold text-[#003087]">{AGENT_ANALYTICS.performanceAnnonces.vues.toLocaleString('fr-FR')}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Contacts reçus</span><span className="font-mono font-bold text-[#003087]">{AGENT_ANALYTICS.performanceAnnonces.contacts}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Taux conversion</span><span className="font-mono font-bold text-[#00A651]">{AGENT_ANALYTICS.performanceAnnonces.tauxConversion}%</span></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 shadow-sm border">
          <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-3 flex items-center gap-2"><Receipt className="w-4 h-4 text-[#00A651]" /> Volume transactions</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Ventes conclues</span><span className="font-mono font-bold text-[#00A651]">{AGENT_ANALYTICS.volumeTransactions.total}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Valeur totale</span><span className="font-mono font-bold text-[#003087]">{formatPrice(AGENT_ANALYTICS.volumeTransactions.valeur)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">En cours</span><span className="font-mono font-bold text-[#D4AF37]">{AGENT_ANALYTICS.volumeTransactions.enCours}</span></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl p-5 shadow-sm border">
          <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-[#D4AF37]" /> ROI Premium</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Investissement</span><span className="font-mono font-bold text-gray-600">{formatPrice(AGENT_ANALYTICS.roiPremium.investissement)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Revenu généré</span><span className="font-mono font-bold text-[#00A651]">{formatPrice(AGENT_ANALYTICS.roiPremium.revenuGenere)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">ROI</span><span className="font-mono font-bold text-[#00A651]">{AGENT_ANALYTICS.roiPremium.roi}%</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Contacts supp.</span><span className="font-mono font-bold text-[#009CDE]">+{AGENT_ANALYTICS.roiPremium.contactsSupp}</span></div>
          </div>
        </motion.div>
      </div>

      {/* Carte de chaleur mini */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Flame className="w-5 h-5 text-[#D93025]" /> Carte de chaleur — Vos zones</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ZONE_PERFORMANCE.slice(0, 4).map(zone => {
            const heatColor = zone.performance >= 80 ? 'bg-[#00A651]' : zone.performance >= 60 ? 'bg-[#D4AF37]' : 'bg-[#F59E0B]';
            return (
              <div key={zone.zone} className={`p-3 rounded-xl text-white ${heatColor}`} style={{ opacity: Math.max(0.3, zone.performance / 100) }}>
                <p className="font-semibold text-xs leading-tight">{zone.zone}</p>
                <p className="font-mono text-lg font-bold">{zone.performance}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir de conversion</h3>
        <div className="space-y-3">
          {AGENT_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-36 shrink-0 text-sm text-gray-600">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === 0 ? '#003087' : i === AGENT_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#009CDE', minWidth: stage.pct > 0 ? '40px' : '0' }}>
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
