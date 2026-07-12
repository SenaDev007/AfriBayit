'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import type { StepProps } from './types';
import { welcomeFeatures } from './constants';

interface WelcomeStepProps extends StepProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function WelcomeStep({ onNext, onSkip, direction, slideVariants, easeOut, setIsAnimating }: WelcomeStepProps) {
  return (
    <motion.div
      key="step1"
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
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-28 h-28 rounded-lg bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#D4AF37] flex items-center justify-center mx-auto mb-8 gold-glow"
      >
        <span className="text-5xl"><Home className="w-4 h-4" /></span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-4xl sm:text-5xl font-bold text-white mb-4"
      >
        Bienvenue sur{' '}
        <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
          AfriBayit
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-white/70 text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed"
      >
        La première plateforme immobilière sécurisée d&apos;Afrique de l&apos;Ouest.
        Escrow, GeoTrust, notaires certifiés — tout pour une transaction en toute confiance.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto mb-10"
      >
        {welcomeFeatures.map((feature, i) => (
          <motion.div
            key={feature.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all cursor-default"
          >
            <span className="text-2xl block mb-2">{feature.icon}</span>
            <p className="text-sm font-semibold text-white">{feature.label}</p>
            <p className="text-[10px] text-white/50">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#003087] rounded-lg font-bold text-base hover:shadow-lg gold-glow transition-shadow"
        >
          Commencer la configuration 
        </motion.button>
        <button
          onClick={onSkip}
          className="px-6 py-4 text-white/60 hover:text-white/90 transition-colors text-sm font-medium"
        >
          Explorer d&apos;abord la plateforme
        </button>
      </motion.div>
    </motion.div>
  );
}

// Keep imports used (for type-only exports tree-shaking)
// (removed)
