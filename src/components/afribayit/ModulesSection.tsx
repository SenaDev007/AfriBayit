'use client';

import React from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const modules = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    name: 'Immobilier',
    description: 'Achat, location et investissement immobilier avec documents vérifiés et escrow sécurisé.',
    color: '#003087',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
    name: 'Guesthouses',
    description: 'Location courte durée avec maisons d\'hôtes certifiées et réservation instantanée.',
    color: '#D4AF37',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
      </svg>
    ),
    name: 'Hôtellerie & Séjour',
    description: 'Le Booking.com africain — Réservez hôtels, guesthouses et séjours en toute confiance.',
    color: '#009CDE',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1-5.1m0 0L11.42 4.97m-5.1 5.1H21M3.75 4.97v14.06" />
      </svg>
    ),
    name: 'Artisans BTP',
    description: 'Marketplace d\'artisans certifiés : maçons, électriciens, plombiers. Devis et suivi en ligne.',
    color: '#00A651',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    name: 'Académie',
    description: 'Formation immobilière : droit foncier, investissement, certification agent. Apprenez des experts.',
    color: '#D4AF37',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    name: 'Communauté',
    description: 'Échangez avec investisseurs, agents et propriétaires. Événements, groupes et mentorat.',
    color: '#003087',
  },
];

export default function ModulesSection() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4 font-body">
            Écosystème Complet
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2E2F]">
            Nos <span className="text-[#003087]">modules</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-body">
            Une plateforme tout-en-un pour l&apos;immobilier en Afrique. Chaque module est conçu pour répondre à un besoin spécifique.
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: easeOut }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 card-shadow hover:shadow-xl transition-all"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${mod.color}10`, color: mod.color }}
              >
                {mod.icon}
              </div>

              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">{mod.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-body">{mod.description}</p>

              {/* Hover arrow */}
              <div
                className="mt-4 flex items-center gap-1 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity font-body"
                style={{ color: mod.color }}
              >
                Explorer
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Decorative corner */}
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(225deg, ${mod.color}06, transparent)` }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
