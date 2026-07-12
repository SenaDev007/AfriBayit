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
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="relative overflow-hidden rounded-[2rem] bg-[#003366] p-10 sm:p-14 lg:p-20"
        >
          {/* Gold accent line top */}
          <div className="absolute inset-x-0 top-0 h-1 bg-[#FFCC00]" />

          <div className="relative z-10 flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
                className="inline-flex items-center gap-2 font-[family-name:var(--font-inter),system-ui,sans-serif] text-xs font-semibold uppercase tracking-[0.2em] text-[#FFCC00]"
              >
                <span className="h-px w-8 bg-[#FFCC00]" />
                {t('cta.badge', "Lancez-vous dès aujourd'hui")}
              </motion.span>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
                className="mt-5 font-[family-name:var(--font-inter),Georgia,serif] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
              >
                {t('cta.title', 'Prêt à trouver votre')}{' '}
                <span className="text-[#FFCC00]">{t('cta.titleAccent', 'bien idéal')}</span>{' '}
                {t('cta.titleEnd', '?')}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-inter),system-ui,sans-serif] text-lg text-white/70 lg:mx-0"
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
              className="flex flex-col gap-4 sm:flex-row"
            >
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('search')}
                className="rounded-lg bg-[#FFCC00] px-8 py-4 font-[family-name:var(--font-inter),system-ui,sans-serif] text-base font-bold text-[#003366] transition-colors hover:bg-[#FFE680]"
              >
                {t('cta.explore', 'Explorer les biens')}
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate('publish')}
                className="rounded-lg border-2 border-white/30 px-8 py-4 font-[family-name:var(--font-inter),system-ui,sans-serif] text-base font-bold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                {t('cta.publish', 'Publier une annonce')}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
