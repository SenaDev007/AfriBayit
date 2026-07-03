'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const pillars = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Documents Vérifiés',
    description: 'Titres fonciers, permis et actes authentifiés par nos experts juridiques.',
    stat: '100%',
    statLabel: 'Conformité',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Escrow Sécurisé',
    description: 'Fonds protégés via compte séquestre jusqu\'à signature notariale.',
    stat: '0 FCFA',
    statLabel: 'Perdu',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Agents Certifiés',
    description: 'Professionnels vérifiés avec formation continue et certification AfriBayit.',
    stat: '500+',
    statLabel: 'Experts',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: 'GeoTrust Terrain',
    description: 'Géomètres certifiés pour vérification et bornage de votre terrain.',
    stat: 'GPS',
    statLabel: 'Bornage',
  },
];

const stats = [
  { value: '12K+', label: 'Biens vérifiés' },
  { value: '5', label: 'Pays couverts' },
  { value: '50K+', label: 'Utilisateurs' },
  { value: '99.8%', label: 'Satisfaction' },
];

export default function TrustSection() {
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
            Confiance & Sécurité
            <span className="h-px w-8 bg-[#FFCC00]" />
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-cormorant),Georgia,serif] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Pourquoi AfriBayit ?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-[family-name:var(--font-inter),system-ui,sans-serif] text-lg text-white/70">
            Quatre piliers fondamentaux pour garantir des transactions immobilières
            transparentes et sécurisées en Afrique de l&apos;Ouest.
          </p>
        </motion.div>

        {/* Stats banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[#003366] px-6 py-8 text-center">
              <div className="font-[family-name:var(--font-space-grotesk),monospace] text-4xl font-bold text-[#FFCC00]">
                {stat.value}
              </div>
              <div className="mt-1 font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm text-white/60">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pillars grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-[#FFCC00]/40 hover:bg-white/[0.05]"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3399FF]/15 text-[#3399FF] transition-colors duration-300 group-hover:bg-[#FFCC00]/15 group-hover:text-[#FFCC00]">
                {pillar.icon}
              </div>

              {/* Stat badge */}
              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-space-grotesk),monospace] text-2xl font-bold text-white">
                  {pillar.stat}
                </span>
                <span className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-[10px] uppercase tracking-wider text-white/40">
                  {pillar.statLabel}
                </span>
              </div>

              <h3 className="mt-3 font-[family-name:var(--font-cormorant),Georgia,serif] text-xl font-bold text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm leading-relaxed text-white/60">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
