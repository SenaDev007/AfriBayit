'use client';

import { motion } from 'framer-motion';
import { Lightbulb, Map } from 'lucide-react';
import type { StepProps } from './types';
import { tourItems } from './constants';

export default function TourStep({ direction, slideVariants, easeOut, setIsAnimating }: StepProps) {
  return (
    <motion.div
      key="step6"
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
          <Map className="w-4 h-4" />
        </motion.span>
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Découvrez la plateforme
        </h2>
        <p className="text-sm text-white/60">Voici un aperçu des fonctionnalités clés d&apos;AfriBayit</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tourItems.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.12, duration: 0.4, ease: easeOut }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-default"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <span className="text-xl">{item.icon}</span>
            </div>
            <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
            <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20"
      >
        <p className="text-xs text-[#D4AF37] text-center">
          <Lightbulb className="w-4 h-4" /> Astuce : Vous pouvez accéder à toutes ces fonctionnalités depuis le menu principal à tout moment.
        </p>
      </motion.div>
    </motion.div>
  );
}
