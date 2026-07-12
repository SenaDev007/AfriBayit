'use client';

import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import type { StepProps } from './types';
import { alertFrequencies, notificationChannels } from './constants';

export default function AlertsStep({ data, updateData, direction, slideVariants, easeOut, setIsAnimating }: StepProps) {
  return (
    <motion.div
      key="step5"
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
          <Bell className="w-4 h-4" />
        </motion.span>
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Alertes & Notifications
        </h2>
        <p className="text-sm text-white/60">Configurez comment vous souhaitez être informé</p>
      </div>

      {/* Alert Frequency */}
      <div className="mb-8">
        <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
          Fréquence des alertes
        </label>
        <div className="space-y-3">
          {alertFrequencies.map((freq, i) => (
            <motion.button
              key={freq.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => updateData({ alertFrequency: freq.value })}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                data.alertFrequency === freq.value
                  ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{freq.label}</p>
                <p className="text-xs text-white/50">{freq.desc}</p>
              </div>
              {data.alertFrequency === freq.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 rounded-lg bg-[#D4AF37] flex items-center justify-center shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Notification Channels */}
      <div>
        <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
          Canaux de notification
        </label>
        <div className="grid grid-cols-2 gap-3">
          {notificationChannels.map((ch, i) => (
            <motion.button
              key={ch.value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => {
                const channels = data.notificationChannels.includes(ch.value)
                  ? data.notificationChannels.filter(c => c !== ch.value)
                  : [...data.notificationChannels, ch.value];
                updateData({ notificationChannels: channels });
              }}
              className={`p-5 rounded-2xl border-2 text-center transition-all ${
                data.notificationChannels.includes(ch.value)
                  ? 'bg-white/10 border-[#D4AF37]'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <span className="text-2xl block mb-2">{ch.icon}</span>
              <p className="text-sm font-semibold text-white">{ch.label}</p>
              <p className="text-[10px] text-white/40 mt-1">{ch.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
