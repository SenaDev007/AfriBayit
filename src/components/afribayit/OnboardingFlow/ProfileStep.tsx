'use client';

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { StepProps } from './types';
import { profileTypes } from './constants';

export default function ProfileStep({ data, updateData, direction, slideVariants, easeOut, setIsAnimating }: StepProps) {
  return (
    <motion.div
      key="step2"
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
          <User className="w-4 h-4" />
        </motion.span>
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Quel est votre profil ?
        </h2>
        <p className="text-sm text-white/60">Cela nous aide à personnaliser votre expérience</p>
      </div>

      <div className="space-y-3">
        {profileTypes.map((pt, i) => (
          <motion.button
            key={pt.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.01, x: 4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => updateData({ profileType: pt.value })}
            className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
              data.profileType === pt.value
                ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
            }`}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${pt.color}20` }}
            >
              <span className="text-2xl">{pt.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-base">{pt.label}</p>
              <p className="text-xs text-white/50">{pt.desc}</p>
            </div>
            {data.profileType === pt.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-7 h-7 rounded-lg bg-[#D4AF37] flex items-center justify-center shrink-0"
              >
                <svg className="w-4 h-4 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
