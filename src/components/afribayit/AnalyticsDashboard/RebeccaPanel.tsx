'use client';

import { motion } from 'framer-motion';
import {
  ChevronRight,
  Crown,
  LayoutGrid,
  Lightbulb,
  MapPin,
  Phone,
  Shield,
  Users,
} from 'lucide-react';
import { REBECCA_RECOMMENDATIONS, easeOut } from './demoData';
import type { RebeccaPriority, RebeccaRecommendation } from './types';

const PRIORITY_CONFIG: Record<RebeccaPriority, { label: string; color: string; bg: string; border: string }> = {
  high: { label: 'Priorité haute', color: '#D93025', bg: 'bg-[#D93025]/5', border: 'border-[#D93025]/10' },
  medium: { label: 'Priorité moyenne', color: '#D4AF37', bg: 'bg-[#D4AF37]/5', border: 'border-[#D4AF37]/10' },
  low: { label: 'Suggestions', color: '#009CDE', bg: 'bg-[#009CDE]/5', border: 'border-[#009CDE]/10' },
};

function renderRecIcon(icon: RebeccaRecommendation['icon']) {
  switch (icon) {
    case 'listing': return <LayoutGrid className="w-5 h-5" />;
    case 'message': return <Phone className="w-5 h-5" />;
    case 'premium': return <Crown className="w-5 h-5" />;
    case 'location': return <MapPin className="w-5 h-5" />;
    case 'network': return <Users className="w-5 h-5" />;
    case 'cert':
    default:
      return <Shield className="w-5 h-5" />;
  }
}

export default function RebeccaPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-gradient-to-r from-[#003087] to-[#003087]/90 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center shadow-lg"><Lightbulb className="w-7 h-7 text-white" /></div>
          <div>
            <h2 className="text-white text-xl font-bold">Rebecca — Votre conseillère IA</h2>
            <p className="text-white/60 text-sm mt-1">Recommandations personnalisées basées sur vos données et les tendances du marché</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {(['high', 'medium', 'low'] as const).map(priority => {
          const items = REBECCA_RECOMMENDATIONS.filter(r => r.priority === priority);
          if (items.length === 0) return null;
          const cfg = PRIORITY_CONFIG[priority];
          return (
            <div key={priority}>
              <h3 className="text-sm font-bold mb-2" style={{ color: cfg.color }}>{cfg.label}</h3>
              <div className="space-y-3">
                {items.map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: easeOut }}
                    className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 flex items-start gap-4`}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color + '15', color: cfg.color }}>
                      {renderRecIcon(rec.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-[#2C2E2F]">{rec.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                    <button
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {rec.action}<ChevronRight className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
