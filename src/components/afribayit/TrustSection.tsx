'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const pillars = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Documents Vérifiés',
    description: 'Titres fonciers, permis et actes authentifiés par nos experts juridiques.',
    color: '#D4AF37',
    stat: '100%',
    statLabel: 'Conformité',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'Escrow Sécurisé',
    description: 'Fonds protégés via compte séquestre jusqu\'à signature notariale.',
    color: '#009CDE',
    stat: '0 FCFA',
    statLabel: 'Perdu',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Agents Certifiés',
    description: 'Professionnels vérifiés avec formation continue et certification AfriBayit.',
    color: '#D4AF37',
    stat: '500+',
    statLabel: 'Experts',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: 'GeoTrust Terrain',
    description: 'Géomètres certifiés pour vérification et bornage de votre terrain.',
    color: '#009CDE',
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
    <section className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-[#001440] via-[#001a4f] to-[#001440]">
      {/* Decorative gradient orbs - more vibrant */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 left-1/4 w-[28rem] h-[28rem] bg-[#D4AF37]/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] bg-[#009CDE]/15 rounded-full blur-3xl"
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Diagonal gold accent line */}
        <div
          className="absolute top-1/2 -left-32 w-64 h-px bg-gradient-to-r from-transparent to-[#D4AF37]/40 rotate-45"
        />
        <div
          className="absolute top-1/3 -right-32 w-64 h-px bg-gradient-to-l from-transparent to-[#009CDE]/40 -rotate-45"
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with big stats banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-sm font-bold mb-5 font-body uppercase tracking-wider">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            Confiance & Sécurité
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Pourquoi <span className="bg-gradient-to-r from-[#D4AF37] to-[#f0d572] bg-clip-text text-transparent">AfriBayit</span> ?
          </h2>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto font-body text-lg">
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
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 max-w-4xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease: easeOut }}
              className="text-center p-4 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 backdrop-blur-sm"
            >
              <div className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d572] bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-white/60 text-xs sm:text-sm font-body mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-[#D4AF37]/50 transition-all overflow-hidden"
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: `linear-gradient(to right, ${pillar.color}, transparent)` }}
              />

              {/* Glow on hover */}
              <div
                className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${pillar.color}25, transparent 70%)`,
                }}
              />

              {/* Icon with strong glow */}
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${pillar.color}25`,
                  color: pillar.color,
                  boxShadow: `0 0 0 1px ${pillar.color}50, 0 12px 32px ${pillar.color}30`,
                }}
              >
                {pillar.icon}
              </div>

              {/* Stat badge */}
              <div className="mb-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <span
                  className="font-mono-data text-sm font-bold"
                  style={{ color: pillar.color }}
                >
                  {pillar.stat}
                </span>
                <span className="text-white/50 text-[10px] uppercase tracking-wider font-body">
                  {pillar.statLabel}
                </span>
              </div>

              <h3 className="relative font-display text-xl font-bold text-white mb-2">{pillar.title}</h3>
              <p className="relative text-sm text-white/60 leading-relaxed font-body">{pillar.description}</p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-6 right-6 h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: `linear-gradient(to right, ${pillar.color}, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
