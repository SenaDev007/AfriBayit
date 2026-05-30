'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeroSectionProps {
  onNavigate: (section: string) => void;
  onOpenRebecca: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function HeroSection({ onNavigate, onOpenRebecca }: HeroSectionProps) {
  return (
    <section className="relative min-h-[100vh] sm:min-h-[90vh] bg-navy-gradient noise-overlay overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-[#009CDE]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-8">
          {/* Left Column - 60% */}
          <div className="flex-1 lg:max-w-[60%]">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6"
            >
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium">Plateforme N°1 en Afrique de l&apos;Ouest</span>
            </motion.div>

            {/* H1 Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: easeOut }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.05] mb-6"
            >
              Où l&apos;Afrique<br />
              <span className="text-[#D4AF37]">trouve sa maison</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
              className="text-white/70 text-base sm:text-lg max-w-lg mb-8 leading-relaxed"
            >
              Où les rêves deviennent adresses. Achetez, louez, investissez en toute confiance
              avec escrow sécurisé et documents vérifiés dans 4 pays africains.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
              className="mb-10"
            >
              <div className="flex flex-col sm:flex-row gap-2 p-2 bg-white rounded-[1.5rem] shadow-2xl">
                <div className="flex-1 flex items-center gap-3 px-4 py-3">
                  <svg className="w-5 h-5 text-[#003087] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Ville, quartier, type de bien..."
                    className="flex-1 text-sm text-[#2C2E2F] placeholder-gray-400 outline-none bg-transparent font-body"
                  />
                </div>
                <div className="hidden sm:block w-px bg-gray-200 my-2" />
                <div className="flex items-center gap-2 px-4 py-3 sm:py-0">
                  <select className="text-sm text-[#2C2E2F] bg-transparent outline-none font-body cursor-pointer">
                    <option>Acheter</option>
                    <option>Louer</option>
                    <option>Investir</option>
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('search')}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#003087] hover:bg-[#0047b3] text-white rounded-[1.2rem] text-sm font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Rechercher
                </motion.button>
              </div>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: easeOut }}
              className="flex flex-wrap gap-6 sm:gap-10"
            >
              {[
                { value: '4 200+', label: 'Biens listés' },
                { value: '2 800+', label: 'Transactions' },
                { value: '4', label: 'Pays couverts' },
                { value: '98%', label: 'Avis positifs' },
              ].map((stat, i) => (
                <div key={i} className="text-center sm:text-left">
                  <div className="font-mono-data text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/50 text-xs sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - 40% - Floating Property Cards */}
          <div className="hidden lg:block flex-1 max-w-[40%] relative min-h-[500px]">
            {/* Floating Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: easeOut }}
              className="absolute top-8 left-0 w-72 animate-float-1"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden card-shadow">
                <div className="relative h-40">
                  <img
                    src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=250&fit=crop"
                    alt="Villa Prestige"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                    Premium
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-medium rounded-full flex items-center gap-1">
                    <span className="text-[#00A651]">✓</span> Vérifié
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Villa Prestige Les Cocotiers</h3>
                  <p className="text-xs text-gray-500 mb-2">Ganhi, Cotonou</p>
                  <p className="font-mono-data text-lg font-bold text-[#D4AF37]">85 000 000 FCFA</p>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: easeOut }}
              className="absolute top-48 right-0 w-64 animate-float-2"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden card-shadow">
                <div className="relative h-36">
                  <img
                    src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop"
                    alt="Appartement Moderne"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-medium rounded-full flex items-center gap-1">
                    <span className="text-[#00A651]">✓</span> Vérifié
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Appartement Moderne Plateau</h3>
                  <p className="text-xs text-gray-500 mb-1">Plateau, Abidjan</p>
                  <p className="font-mono-data text-base font-bold text-[#D4AF37]">350 000 <span className="text-xs text-gray-400">FCFA/mois</span></p>
                </div>
              </div>
            </motion.div>

            {/* Rebecca Chat Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: easeOut }}
              className="absolute bottom-4 left-4 w-64 animate-float-3"
            >
              <div
                className="bg-white rounded-3xl shadow-2xl p-4 card-shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={onOpenRebecca}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003087] to-[#009CDE] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">R</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#2C2E2F]">Rebecca IA</h4>
                    <p className="text-xs text-[#00A651]">En ligne • Prête à aider</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl px-3 py-2 mb-2">
                  <p className="text-xs text-gray-600 italic">&quot;Bonjour ! Je peux vous aider à trouver le bien parfait. Que recherchez-vous ?&quot;</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-[#003087]/5 text-[#003087] text-[10px] font-medium rounded-full">Villa à Cotonou</span>
                  <span className="px-3 py-1 bg-[#003087]/5 text-[#003087] text-[10px] font-medium rounded-full">Terrain Lomé</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom wave/gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
