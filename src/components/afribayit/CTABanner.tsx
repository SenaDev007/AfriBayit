'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface CTABannerProps {
  onNavigate: (section: string) => void;
}

export default function CTABanner({ onNavigate }: CTABannerProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Full-width gradient banner */}
          <div className="bg-navy-gradient noise-overlay relative p-8 sm:p-12 lg:p-16">
            {/* Decorative gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#009CDE]/20 via-transparent to-[#D4AF37]/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#009CDE]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-left">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
                  className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
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
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm border border-white/20 transition-colors font-body"
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
