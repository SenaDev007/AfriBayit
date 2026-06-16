'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    number: '01',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: 'Trouvez votre bien',
    description: 'Recherchez parmi des centaines de propriétés avec filtres avancés et assistance IA Rebecca.',
    color: '#009CDE',
    duration: 'Étape 1',
  },
  {
    number: '02',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Vérifiez les documents',
    description: 'GeoTrust vérifie les titres fonciers et documents juridiques. Rien ne vous échappe.',
    color: '#003087',
    duration: 'Étape 2',
  },
  {
    number: '03',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'Sécurisez avec Escrow',
    description: 'Vos fonds sont protégés via un compte séquestre jusqu\'à la signature notariale finale.',
    color: '#D4AF37',
    duration: 'Étape 3',
  },
  {
    number: '04',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Devenez propriétaire',
    description: 'Notaire signe l\'acte, ANDF enregistre — vous êtes officiellement propriétaire.',
    color: '#00A651',
    duration: 'Étape 4',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-[#f8fafc] to-white overflow-hidden">
      {/* Subtle top gradient to blend with previous dark section */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#001440] via-[#001440]/50 to-transparent pointer-events-none" />

      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(to right, #003087 1px, transparent 1px), linear-gradient(to bottom, #003087 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#003087] to-[#001a4f] border border-[#D4AF37]/30 text-white text-sm font-bold mb-5 font-body uppercase tracking-wider shadow-lg shadow-[#003087]/20">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            Processus Simplifié
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2C2E2F] leading-tight">
            Comment ça <span className="bg-gradient-to-r from-[#003087] to-[#009CDE] bg-clip-text text-transparent">marche</span> ?
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-body text-lg">
            En 4 étapes simples, de la recherche à la signature. Transparent, sécurisé, sans stress.
          </p>
        </motion.div>

        {/* Steps with connecting line */}
        <div className="relative">
          {/* Connecting line for desktop - bold gradient */}
          <div className="hidden lg:block absolute top-[100px] left-[12.5%] right-[12.5%] z-0">
            <div className="relative h-1 rounded-full bg-gradient-to-r from-[#009CDE]/20 via-[#D4AF37]/30 to-[#00A651]/20">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, ease: easeOut }}
                className="absolute inset-0 bg-gradient-to-r from-[#009CDE] via-[#D4AF37] to-[#00A651] origin-left rounded-full shadow-lg"
              />
              {/* Animated traveling dot */}
              <motion.div
                animate={{ left: ['0%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-1 w-3 h-3 rounded-full bg-white shadow-lg"
                style={{ boxShadow: '0 0 12px #D4AF37' }}
              />
            </div>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease: easeOut }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 hover:border-[#003087]/30 hover:shadow-2xl transition-all overflow-hidden"
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                  style={{ background: `linear-gradient(to right, ${step.color}, transparent)` }}
                />

                {/* Step number badge - HUGE and centered on the connecting line */}
                <div className="relative flex items-center justify-center mb-6">
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center text-white font-display text-2xl font-bold shadow-xl transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: step.color,
                      boxShadow: `0 12px 32px ${step.color}50, 0 0 0 5px white, 0 0 0 6px ${step.color}40`,
                    }}
                  >
                    {step.number}
                    {/* Pulsing ring */}
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>
                </div>

                {/* Step label */}
                <div
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 mx-auto"
                  style={{
                    backgroundColor: `${step.color}15`,
                    color: step.color,
                  }}
                >
                  {step.duration}
                </div>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                  style={{
                    backgroundColor: `${step.color}12`,
                    color: step.color,
                    boxShadow: `inset 0 0 0 1px ${step.color}25`,
                  }}
                >
                  {step.icon}
                </div>

                <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2 group-hover:text-[#003087] transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-body">{step.description}</p>

                {/* Decorative corner */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(225deg, ${step.color}10, transparent)` }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
