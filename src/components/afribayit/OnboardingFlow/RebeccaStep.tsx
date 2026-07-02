'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { StepProps } from './types';
import {
  profileTypes, countries, goalOptions, alertFrequencies, rebeccaCapabilities,
} from './constants';

export default function RebeccaStep({ data, updateData, direction, slideVariants, easeOut, setIsAnimating }: StepProps) {
  return (
    <motion.div
      key="step7"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: easeOut }}
      onAnimationStart={() => setIsAnimating(true)}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
        className="w-28 h-28 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#009CDE]/30"
      >
        <span className="text-5xl font-bold text-white font-display">R</span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-3xl font-bold text-white mb-3"
      >
        Activez Rebecca, votre assistante IA
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-white/60 max-w-md mx-auto mb-8 leading-relaxed"
      >
        Rebecca est votre assistante IA personnelle. Elle peut rechercher des biens, suivre vos transactions,
        contacter des agents, et bien plus — disponible 24/7.
      </motion.p>

      {/* Rebecca capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto mb-8"
      >
        {rebeccaCapabilities.map((cap, i) => (
          <motion.div
            key={cap.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.06 }}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center"
          >
            <span className="text-lg block mb-1">{cap.icon}</span>
            <span className="text-[10px] font-medium text-white/60">{cap.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Activation Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-5 rounded-3xl bg-white/5 border border-white/10 max-w-sm mx-auto mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Activer Rebecca IA</p>
            <p className="text-[10px] text-white/40">Rebecca sera accessible depuis le chat en bas à droite</p>
          </div>
          <button
            onClick={() => updateData({ rebeccaEnabled: !data.rebeccaEnabled })}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              data.rebeccaEnabled ? 'bg-[#00A651]' : 'bg-white/20'
            }`}
          >
            <motion.div
              layout
              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg"
              style={{ left: data.rebeccaEnabled ? '1.75rem' : '0.125rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-5 rounded-3xl bg-white/5 border border-white/10 max-w-sm mx-auto text-left"
      >
        <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">Récapitulatif de votre configuration</p>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-white/50">Profil</span>
            <span className="font-semibold text-white">
              {profileTypes.find(p => p.value === data.profileType)?.label || '—'}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50">Zone</span>
            <span className="font-semibold text-white">
              {data.countries.map(c => countries.find(co => co.code === c)?.name).join(', ') || '—'}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50">Villes</span>
            <span className="font-semibold text-white">
              {data.cities.length > 0 ? `${data.cities.length} ville${data.cities.length > 1 ? 's' : ''}` : '—'}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50">Budget max</span>
            <span className="font-semibold text-white font-mono-data">
              {data.budgetMax ? new Intl.NumberFormat('fr-FR').format(data.budgetMax) + ' FCFA' : '—'}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50">Objectifs</span>
            <span className="font-semibold text-white">
              {data.goals.length > 0
                ? data.goals.map(g => goalOptions.find(o => o.value === g)?.label).join(', ')
                : '—'}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50">Alertes</span>
            <span className="font-semibold text-white">
              {alertFrequencies.find(f => f.value === data.alertFrequency)?.label || '—'}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex justify-between items-center">
            <span className="text-white/50">Rebecca IA</span>
            <span className={`font-semibold ${data.rebeccaEnabled ? 'text-[#00A651]' : 'text-white/30'}`}>
              {data.rebeccaEnabled ? <><Check className="w-4 h-4" /> Activée</> : 'Désactivée'}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
