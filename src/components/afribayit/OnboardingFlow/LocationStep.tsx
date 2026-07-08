'use client';

import { motion } from 'framer-motion';
import { Check, Globe } from 'lucide-react';
import type { StepProps } from './types';
import { countries, citiesByCountry } from './constants';

export default function LocationStep({ data, toggleArrayItem, direction, slideVariants, easeOut, setIsAnimating }: StepProps) {
  return (
    <motion.div
      key="step3"
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
          <Globe className="w-4 h-4" />
        </motion.span>
        <h2 className="font-display text-3xl font-bold text-white mb-2">
          Vos préférences géographiques
        </h2>
        <p className="text-sm text-white/60">Dans quels pays et villes recherchez-vous ?</p>
      </div>

      {/* Country Selection */}
      <div className="mb-8">
        <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
          Pays d&apos;intérêt
        </label>
        <div className="grid grid-cols-2 gap-4">
          {countries.map((c, i) => (
            <motion.button
              key={c.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleArrayItem('countries', c.code)}
              className={`p-5 rounded-3xl border-2 text-center transition-all ${
                data.countries.includes(c.code)
                  ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
            >
              <span className="text-3xl block mb-2">{c.flag}</span>
              <p className="text-sm font-semibold text-white">{c.name}</p>
              {data.countries.includes(c.code) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center mx-auto mt-2"
                >
                  <svg className="w-3 h-3 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* City Selection */}
      {data.countries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
            Villes d&apos;intérêt
          </label>
          <div className="flex flex-wrap gap-2">
            {data.countries.flatMap(countryCode =>
              (citiesByCountry[countryCode] || []).map((city, i) => (
                <motion.button
                  key={city.value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleArrayItem('cities', city.value)}
                  className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                    data.cities.includes(city.value)
                      ? 'bg-[#D4AF37] text-[#003087]'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {data.cities.includes(city.value) && <><Check className="w-4 h-4" /> </>}
                  {city.label}
                </motion.button>
              ))
            )}
          </div>
          {data.cities.length === 0 && (
            <p className="text-xs text-white/40 mt-2 italic">Sélectionnez au moins une ville</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
