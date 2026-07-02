'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface CTABannerProps {
  onNavigate: (section: string) => void;
}

export default function CTABanner({ onNavigate }: CTABannerProps) {
  const { t } = useTranslation();
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-[#f8fafc] to-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #003087 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="relative rounded-[2.5rem] overflow-hidden"
        >
          {/* Full-width gradient banner */}
          <div className="bg-gradient-to-br from-[#001440] via-[#003087] to-[#001440] relative p-10 sm:p-14 lg:p-20">
            {/* Animated mesh gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-[#009CDE]/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 0.85, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#D4AF37]/20 rounded-full blur-3xl"
              />
            </div>

            {/* Decorative gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#009CDE]/15 via-transparent to-[#D4AF37]/15 pointer-events-none" />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />

            {/* Top gold border accent - bold */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            {/* Corner gold accents */}
            <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-[#D4AF37]/50 rounded-tl-2xl" />
            <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-[#D4AF37]/50 rounded-tr-2xl" />
            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-[#D4AF37]/50 rounded-bl-2xl" />
            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-[#D4AF37]/50 rounded-br-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/25 to-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] text-xs font-bold mb-6 font-body uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20"
                >
                  <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
                  {t('cta.badge', "Lancez-vous dès aujourd'hui")}
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
                  className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
                >
                  {t('cta.title', 'Prêt à trouver votre')}{' '}
                  <span className="bg-gradient-to-r from-[#D4AF37] to-[#f0d572] bg-clip-text text-transparent">
                    {t('cta.titleAccent', 'bien idéal')}
                  </span>{' '}
                  {t('cta.titleEnd', '?')}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                  className="text-white/80 max-w-xl font-body text-lg sm:text-xl"
                >
                  {t('cta.subtitle', "Rejoignez des milliers de propriétaires et acheteurs qui font confiance à AfriBayit pour leurs transactions immobilières en Afrique de l'Ouest.")}
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('search')}
                  className="px-10 py-5 bg-gradient-to-r from-[#D4AF37] to-[#b8961f] hover:from-[#e8c950] hover:to-[#a8851a] text-white rounded-full font-bold text-base shadow-2xl shadow-[#D4AF37]/40 transition-all font-body"
                >
                  {t('cta.explore', 'Explorer les biens')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('publish')}
                  className="px-10 py-5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold text-base border-2 border-white/40 hover:border-white/60 transition-all font-body backdrop-blur-sm"
                >
                  {t('cta.publish', 'Publier une annonce')}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
