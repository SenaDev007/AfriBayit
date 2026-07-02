'use client';

import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import type { StepProps } from './types';
import { budgetPresets, goalOptions } from './constants';

export default function BudgetStep({ data, updateData, toggleArrayItem, direction, slideVariants, easeOut, setIsAnimating }: StepProps) {
  return (
    <motion.div
      key="step4"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: easeOut }}
      onAnimationStart={() => setIsAnimating(true)}
    >
      <div className="text-center mb-8">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-4xl mb-3 block"
        >
          <Coins className="w-4 h-4" />
        </motion.span>
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Votre budget et objectifs
        </h2>
        <p className="text-sm text-white/60">Aidez-nous à vous proposer les meilleures opportunités</p>
      </div>

      {/* Budget Presets */}
      <div className="mb-8">
        <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
          Fourchette de budget (FCFA)
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {budgetPresets.map((preset, i) => (
            <motion.button
              key={preset.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateData({ budgetMin: preset.min, budgetMax: preset.max })}
              className={`p-4 rounded-2xl border-2 text-center transition-all ${
                data.budgetMin === preset.min && data.budgetMax === preset.max
                  ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <p className="text-sm font-bold text-white font-mono-data">{preset.label}</p>
              <p className="text-[10px] text-white/40">FCFA</p>
            </motion.button>
          ))}
        </div>

        {/* Custom budget range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Minimum</label>
            <input
              type="number"
              placeholder="0"
              value={data.budgetMin || ''}
              onChange={(e) => updateData({ budgetMin: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-data font-bold placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Maximum</label>
            <input
              type="number"
              placeholder="Ex: 50 000 000"
              value={data.budgetMax || ''}
              onChange={(e) => updateData({ budgetMax: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-data font-bold placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Goals */}
      <div>
        <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
          Vos objectifs
        </label>
        <div className="grid grid-cols-2 gap-3">
          {goalOptions.map((goal, i) => (
            <motion.button
              key={goal.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => toggleArrayItem('goals', goal.value)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                data.goals.includes(goal.value)
                  ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
              <span className="text-xl">{goal.icon}</span>
              <span className="text-xs font-medium text-white/80">{goal.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
