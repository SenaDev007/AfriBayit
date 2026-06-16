'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    number: '01',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: 'Trouvez votre bien',
    description: 'Recherchez parmi des centaines de propriétés avec filtres avancés et assistance IA Rebecca.',
    color: '#009CDE',
  },
  {
    number: '02',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Vérifiez les documents',
    description: 'GeoTrust vérifie les titres fonciers et documents juridiques. Rien ne vous échappe.',
    color: '#003087',
  },
  {
    number: '03',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'Sécurisez avec Escrow',
    description: 'Vos fonds sont protégés via un compte séquestre jusqu\'à la signature notariale finale.',
    color: '#D4AF37',
  },
  {
    number: '04',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Devenez propriétaire',
    description: 'Notaire signe l\'acte, ANDF enregistre — vous êtes officiellement propriétaire.',
    color: '#00A651',
  },
];

export default function HowItWorks() {
  return (
    <section className="relative py-20 sm:py-28 bg-white overflow-hidden">
      {/* Subtle top gradient to blend with previous dark section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#001440] to-transparent pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#009CDE]/10 border border-[#009CDE]/20 text-[#009CDE] text-sm font-semibold mb-4 font-body">
            <span className="w-1.5 h-1.5 bg-[#009CDE] rounded-full animate-pulse" />
            Processus Simplifié
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2E2F]">
            Comment ça <span className="text-[#003087]">marche</span> ?
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-body">
            En 4 étapes simples, de la recherche à la signature. Transparent, sécurisé, sans stress.
          </p>
        </motion.div>

        {/* Steps with connecting line */}
        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-[88px] left-[12.5%] right-[12.5%] z-0">
            <div className="relative h-0.5 bg-gradient-to-r from-[#009CDE]/30 via-[#D4AF37]/30 to-[#00A651]/30">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: easeOut }}
                className="absolute inset-0 bg-gradient-to-r from-[#009CDE] via-[#D4AF37] to-[#00A651] origin-left"
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
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 hover:border-[#003087]/30 card-shadow hover:shadow-xl transition-all"
              >
                {/* Step number badge - centered on the connecting line */}
                <div className="relative flex items-center justify-center mb-5">
                  <div
                    className="relative w-16 h-16 rounded-full flex items-center justify-center text-white font-display text-xl font-bold shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: step.color,
                      boxShadow: `0 8px 24px ${step.color}40, 0 0 0 4px white, 0 0 0 5px ${step.color}30`,
                    }}
                  >
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: `${step.color}10`, color: step.color }}
                >
                  {step.icon}
                </div>

                <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-body">{step.description}</p>

                {/* Decorative corner */}
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: `linear-gradient(225deg, ${step.color}08, transparent)` }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
