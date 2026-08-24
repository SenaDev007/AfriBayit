'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    number: '01',
    titleKey: 'howItWorks.step1Title',
    titleFallback: 'Trouvez votre bien',
    descKey: 'howItWorks.step1Desc',
    descFallback:
      'Recherchez parmi des centaines de propriétés avec filtres avancés et assistance IA Rebecca.',
  },
  {
    number: '02',
    titleKey: 'howItWorks.step2Title',
    titleFallback: 'Vérifiez les documents',
    descKey: 'howItWorks.step2Desc',
    descFallback:
      'GeoTrust vérifie les titres fonciers et documents juridiques. Rien ne vous échappe.',
  },
  {
    number: '03',
    titleKey: 'howItWorks.step3Title',
    titleFallback: 'Sécurisez avec Escrow',
    descKey: 'howItWorks.step3Desc',
    descFallback:
      'Vos fonds sont protégés via un compte séquestre jusqu\'à la signature notariale finale.',
  },
  {
    number: '04',
    titleKey: 'howItWorks.step4Title',
    titleFallback: 'Devenez propriétaire',
    descKey: 'howItWorks.step4Desc',
    descFallback:
      'Notaire signe l\'acte, ANDF enregistre — vous êtes officiellement propriétaire.',
  },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section className="bg-[#003366] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFCC00]">
            <span className="h-px w-8 bg-[#FFCC00]" />
            {t('howItWorks.eyebrow', 'Processus Simplifié')}
            <span className="h-px w-8 bg-[#FFCC00]" />
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-cormorant),Georgia,serif] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t('howItWorks.title', 'Comment ça marche ?')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-cormorant),system-ui,sans-serif] text-lg text-white/70">
            {t(
              'howItWorks.subtitle',
              'En 4 étapes simples, de la recherche à la signature. Transparent, sécurisé, sans stress.'
            )}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Connecting line (desktop) */}
          <div className="absolute left-[12.5%] right-[12.5%] top-12 hidden h-px bg-white/15 lg:block" />

          <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: easeOut }}
                className="flex flex-col items-center text-center lg:items-start lg:text-left"
              >
                {/* Number badge */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-lg border-2 border-[#FFCC00] bg-[#003366]">
                  <span className="font-[family-name:var(--font-cormorant),Georgia,serif] text-3xl font-bold text-[#FFCC00]">
                    {step.number}
                  </span>
                </div>

                {/* Step label */}
                <span className="mt-6 font-[family-name:var(--font-cormorant),system-ui,sans-serif] text-xs font-semibold uppercase tracking-wider text-[#3399FF]">
                  {t('howItWorks.stepLabel', 'Étape')} {step.number}
                </span>

                <h3 className="mt-2 font-[family-name:var(--font-cormorant),Georgia,serif] text-xl font-bold text-white">
                  {t(step.titleKey, step.titleFallback)}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-cormorant),system-ui,sans-serif] text-sm leading-relaxed text-white/60">
                  {t(step.descKey, step.descFallback)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
