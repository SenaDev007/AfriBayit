'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const modules = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    name: 'Immobilier',
    description: 'Achat, location et investissement immobilier avec documents vérifiés et escrow sécurisé.',
    color: '#003087',
    accent: '#D4AF37',
    href: '/search',
    badge: 'Populaire',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
    name: 'Guesthouses',
    description: 'Location courte durée avec maisons d\'hôtes certifiées et réservation instantanée.',
    color: '#D4AF37',
    accent: '#003087',
    href: '/guesthouse',
    badge: 'Nouveau',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
      </svg>
    ),
    name: 'Hôtellerie & Séjour',
    description: 'Le Booking.com africain — Réservez hôtels, guesthouses et séjours en toute confiance.',
    color: '#009CDE',
    accent: '#D4AF37',
    href: '/hospitality',
    badge: 'Premium',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3.75 4.97v14.06" />
      </svg>
    ),
    name: 'Artisans BTP',
    description: 'Marketplace d\'artisans certifiés : maçons, électriciens, plombiers. Devis et suivi en ligne.',
    color: '#00A651',
    accent: '#D4AF37',
    href: '/artisans',
    badge: 'ProMatch',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    name: 'Académie',
    description: 'Formation immobilière : droit foncier, investissement, certification agent. Apprenez des experts.',
    color: '#D4AF37',
    accent: '#003087',
    href: '/academy',
    badge: 'Certifiant',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    name: 'Communauté',
    description: 'Échangez avec investisseurs, agents et propriétaires. Événements, groupes et mentorat.',
    color: '#003087',
    accent: '#009CDE',
    href: '/community',
    badge: 'Social',
  },
];

export default function ModulesSection() {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#001440] via-[#001a4f] to-[#001440] overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Decorative orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#009CDE]/15 rounded-full blur-3xl"
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
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] text-sm font-bold mb-5 font-body uppercase tracking-wider">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            Écosystème Complet
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Nos <span className="bg-gradient-to-r from-[#D4AF37] to-[#f0d572] bg-clip-text text-transparent">modules</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto font-body text-lg">
            Une plateforme tout-en-un pour l&apos;immobilier en Afrique. Chaque module est conçu pour répondre à un besoin spécifique.
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <motion.a
              key={mod.name}
              href={mod.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: easeOut }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-[#D4AF37]/50 transition-all overflow-hidden block"
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: `linear-gradient(to right, ${mod.color}, ${mod.accent})` }}
              />

              {/* Glow on hover */}
              <div
                className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${mod.color}25, transparent 70%)`,
                }}
              />

              {/* Badge */}
              <div className="absolute top-5 right-5">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${mod.accent}20`,
                    color: mod.accent,
                  }}
                >
                  {mod.badge}
                </span>
              </div>

              {/* Icon with strong glow */}
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${mod.color}25`,
                  color: mod.color,
                  boxShadow: `0 0 0 1px ${mod.color}50, 0 12px 32px ${mod.color}30`,
                }}
              >
                {mod.icon}
              </div>

              <h3 className="relative font-display text-2xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                {mod.name}
              </h3>
              <p className="relative text-sm text-white/60 leading-relaxed font-body">{mod.description}</p>

              {/* Hover arrow */}
              <div
                className="mt-5 flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 font-body translate-x-[-4px] group-hover:translate-x-0"
                style={{ color: mod.accent }}
              >
                Explorer
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Decorative corner */}
              <div
                className="absolute bottom-0 right-0 w-32 h-32 rounded-tl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(225deg, ${mod.color}15, transparent)` }}
              />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
