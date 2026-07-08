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

export default function ArtisanProfile() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Wrench className="w-5 h-5 text-[#D4AF37] mb-1" />
          <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.missionsCompleted}</p>
          <p className="text-xs text-gray-500">Missions terminées</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <ThumbsUp className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-mono text-xl font-bold text-[#00A651]">{ARTISAN_ANALYTICS.tauxSatisfaction}%</p>
          <p className="text-xs text-gray-500">Taux satisfaction</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Clock className="w-5 h-5 text-[#009CDE] mb-1" />
          <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.responseTime} min</p>
          <p className="text-xs text-gray-500">Temps de réponse</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Trophy className="w-5 h-5 text-[#D4AF37] mb-1" />
          <p className="font-mono text-xl font-bold text-[#D4AF37]">#{ARTISAN_ANALYTICS.classementMetier.position}</p>
          <p className="text-xs text-gray-500">Classement {ARTISAN_ANALYTICS.classementMetier.specialty}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Star className="w-5 h-5 text-[#D4AF37] mb-1" />
          <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.avgRating}</p>
          <p className="text-xs text-gray-500">Note moyenne</p>
        </div>
      </div>

      {/* Demandes devis breakdown */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#003087]" /> Demandes devis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Reçues', value: ARTISAN_ANALYTICS.demandesDevis.recues, color: '#003087' },
            { label: 'Envoyées', value: ARTISAN_ANALYTICS.demandesDevis.envoyees, color: '#009CDE' },
            { label: 'Acceptées', value: ARTISAN_ANALYTICS.demandesDevis.acceptees, color: '#00A651' },
            { label: 'En attente', value: ARTISAN_ANALYTICS.demandesDevis.enAttente, color: '#D4AF37' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-gray-50 rounded-xl text-center">
              <p className="font-mono text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir de conversion artisan</h3>
        <div className="space-y-3">
          {ARTISAN_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-gray-600">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === ARTISAN_ANALYTICS.conversionFunnel.length - 1 ? '#D4AF37' : '#003087', minWidth: '40px' }}>
                  <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                </motion.div>
                <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Spécialités</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ARTISAN_ANALYTICS.specialties.map(spec => (
            <div key={spec.name} className="p-4 bg-gray-50 rounded-xl">
              <p className="font-semibold text-sm text-[#2C2E2F]">{spec.name}</p>
              <p className="text-xs text-gray-500 mt-1">{spec.missions} missions · <span className="text-[#D4AF37]">{spec.rating}/5</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
