'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Flame, Minus } from 'lucide-react';
import { ZONE_PERFORMANCE } from './demoData';
import { formatPrice } from './utils';

export default function HeatmapPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 flex items-center gap-2"><Flame className="w-5 h-5 text-[#D93025]" /> Performance par zone</h3>
        <p className="text-sm text-gray-500 mb-6">Carte de chaleur des performances immobilières par quartier et ville.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {ZONE_PERFORMANCE.map(zone => {
            const heatColor = zone.performance >= 80 ? 'bg-[#00A651]' : zone.performance >= 60 ? 'bg-[#D4AF37]' : zone.performance >= 40 ? 'bg-[#F59E0B]' : 'bg-[#D93025]';
            const heatOpacity = Math.max(0.3, zone.performance / 100);
            return (
              <motion.div key={zone.zone} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`relative p-4 rounded-xl text-white ${heatColor} overflow-hidden`} style={{ opacity: heatOpacity }}>
                <p className="font-semibold text-sm leading-tight">{zone.zone}</p>
                <p className="font-mono text-2xl font-bold mt-1">{zone.performance}</p>
                <div className="flex items-center gap-1 mt-1">
                  {zone.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : zone.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  <span className="text-xs">{zone.trend === 'up' ? 'En hausse' : zone.trend === 'down' ? 'En baisse' : 'Stable'}</span>
                </div>
                <p className="text-xs mt-1 opacity-80">Prix moy: {formatPrice(zone.avgPrice)}</p>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 justify-center text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#00A651]" /><span>Excellent (80+)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#D4AF37]" /><span>Bon (60-79)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#F59E0B]" /><span>Moyen (40-59)</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#D93025]" /><span>Faible (&lt;40)</span></div>
        </div>
      </div>
    </motion.div>
  );
}
