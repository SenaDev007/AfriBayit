'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface CTABannerProps {
  onNavigate: (section: string) => void;
}

export default function CTABanner({ onNavigate }: CTABannerProps) {
  return (
    <section className="relative py-20 sm:py-28 bg-gradient-to-b from-[#f8fafc] to-white overflow-hidden">
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="relative rounded-[2.5rem] overflow-hidden"
        >
          {/* Full-width gradient banner */}
          <div className="bg-navy-gradient noise-overlay relative p-8 sm:p-12 lg:p-16">
            {/* Animated mesh gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-[#009CDE]/15 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -30, 0], y: [0, 30, 0], scale: [1, 0.9, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-0 left-0 w-[26rem] h-[26rem] bg-[#D4AF37]/15 rounded-full blur-3xl"
              />
            </div>

            {/* Decorative gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#009CDE]/15 via-transparent to-[#D4AF37]/10 pointer-events-none" />

            {/* Grid pattern overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
            />

            {/* Gold border accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-semibold mb-4 font-body"
                >
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-pulse" />
                  Lancez-vous dès aujourd'hui
                </motion.div>

                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
                  className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
                >
                  Prêt à trouver votre <span className="text-[#D4AF37]">bien idéal</span> ?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                  className="text-white/70 max-w-lg font-body text-base sm:text-lg"
                >
                  Rejoignez des milliers de propriétaires et acheteurs qui font confiance à AfriBayit
                  pour leurs transactions immobilières en Afrique de l&apos;Ouest.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('search')}
                  className="px-8 py-4 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg gold-glow transition-colors font-body"
                >
                  Explorer les biens
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('publish')}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm border border-white/30 transition-colors font-body"
                >
                  Publier une annonce
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
