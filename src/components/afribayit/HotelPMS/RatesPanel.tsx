'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, Calculator, Clock, Coins, Zap } from 'lucide-react';
import type { RateItem } from './types';
import { easeOut } from './types';
import { fmt, channelLabel } from './utils';
import { SEASONAL_PRICING } from './constants';

interface RatesPanelProps {
  rates: RateItem[];
}

function SeasonalIcon({ name }: { name: string }) {
  if (name === 'zap') return <Zap className="w-4 h-4" />;
  if (name === 'clock') return <Clock className="w-4 h-4" />;
  return <ArrowDownRight className="w-4 h-4" />;
}

export default function RatesPanel({ rates }: RatesPanelProps) {
  return (
    <motion.div key="rates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      {/* Seasonal Pricing Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border mb-6">
        <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Calculator className="w-5 h-5" /> Tarifs saisonniers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SEASONAL_PRICING.map((season) => (
            <div key={season.name} className="p-4 rounded-2xl border-2" style={{ borderColor: `${season.color}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: season.color }}><SeasonalIcon name={season.icon} /></span>
                <h4 className="text-sm font-bold text-[#0a2a5e]">{season.name}</h4>
              </div>
              <p className="text-xs text-gray-500 mb-2">{season.period}</p>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold" style={{ color: season.color }}>x{season.multiplier}</span>
                <span className="text-xs text-gray-400">multiplicateur</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {rates.length > 0 ? (
        <div className="space-y-4">
          {rates.map((rate) => (
            <div key={rate.roomId} className="bg-white rounded-2xl p-5 shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <div><h4 className="font-display text-base font-bold text-[#0a2a5e]">{rate.name || rate.roomType}</h4><p className="text-xs text-gray-500">Type: {rate.roomType}</p></div>
                <div className="text-right"><p className="text-[10px] text-gray-500">Prix de base</p><p className="font-mono text-lg font-bold text-[#D4AF37]">{fmt(rate.basePrice)} FCFA</p></div>
              </div>
              {rate.channelRates.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Tarifs par canal</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {rate.channelRates.map((ch) => (
                      <div key={ch.ota} className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-xs font-medium text-gray-600 mb-1">{channelLabel(ch.ota)}</p>
                        <p className="font-mono text-sm font-bold text-[#003087]">{ch.rateXof ? fmt(ch.rateXof) : '—'} FCFA</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <div className="text-center py-16"><p className="text-gray-500">Aucun tarif trouve</p></div>}

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <Coins className="w-4 h-4" /> Les tarifs sont synchronisés automatiquement avec les canaux OTA.
      </div>
    </motion.div>
  );
}
