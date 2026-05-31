'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useProperties } from '@/hooks/useProperties';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { formatPrice, COUNTRIES_CONFIG } from '@/lib/afribayit-utils';

interface HeroSectionProps {
  onNavigate: (section: string) => void;
  onOpenRebecca: () => void;
}

interface StatsData {
  properties: number;
  transactions: number;
  countries: number;
  agents: number;
  satisfaction: number;
  artisans: number;
  courses: number;
  hotels: number;
  guesthouses: number;
  bookings: number;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Animated counter component
function AnimatedCounter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || target === 0) return;

    let start = 0;
    const increment = target / (duration * 60); // 60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {target > 0 ? (
        <>
          {new Intl.NumberFormat('fr-FR').format(count)}
          {suffix}
        </>
      ) : (
        '—'
      )}
    </span>
  );
}

export default function HeroSection({ onNavigate, onOpenRebecca }: HeroSectionProps) {
  const [searchType, setSearchType] = useState('achat');
  const [searchCountry, setSearchCountry] = useState('all');

  // Fetch stats from API
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['stats'],
    queryFn: () => apiFetch<StatsData>('/api/stats'),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  // Fetch 2 premium properties for floating cards
  const { data: propertiesData } = useProperties({ premium: 'true', limit: 2 });
  const premiumProperties = (propertiesData?.properties || []).slice(0, 2);

  const statsItems = [
    { value: stats?.properties ?? 250, suffix: '+', label: 'Biens listés' },
    { value: stats?.transactions ?? 150, suffix: '+', label: 'Transactions' },
    { value: (stats?.hotels ?? 0) + (stats?.guesthouses ?? 0) || 40, suffix: '+', label: 'Hôtels & Séjours' },
    { value: stats?.countries ?? 4, suffix: '', label: 'Pays couverts' },
    { value: stats?.bookings ?? 80, suffix: '+', label: 'Réservations' },
    { value: stats?.satisfaction ?? 98, suffix: '%', label: 'Avis positifs' },
  ];

  return (
    <section className="relative min-h-[100vh] sm:min-h-[90vh] bg-navy-gradient noise-overlay overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orbs with animation */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-0 w-96 h-96 bg-[#009CDE]/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#009CDE]/5 rounded-full blur-3xl"
        />
        {/* Mesh gradient lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(135deg, transparent 0%, transparent 40%, rgba(0,156,222,0.15) 50%, transparent 60%, transparent 100%),
              linear-gradient(225deg, transparent 0%, transparent 35%, rgba(212,175,55,0.1) 45%, transparent 55%, transparent 100%),
              linear-gradient(315deg, transparent 0%, transparent 45%, rgba(0,156,222,0.08) 55%, transparent 65%, transparent 100%)
            `,
            backgroundSize: '200% 200%',
            animation: 'meshShift 15s ease-in-out infinite',
          }}
        />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-8">
          {/* Left Column - 60% */}
          <div className="flex-1 lg:max-w-[60%]">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-white/20 mb-6"
            >
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              <span className="text-white/90 text-sm font-medium font-body">Plateforme N°1 en Afrique de l&apos;Ouest</span>
            </motion.div>

            {/* H1 Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.15, ease: easeOut }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.05] mb-6"
            >
              Où l&apos;Afrique<br />
              <span className="text-[#D4AF37]">trouve sa maison</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: easeOut }}
              className="text-white/70 text-base sm:text-lg max-w-lg mb-8 leading-relaxed font-body"
            >
              Où les rêves deviennent adresses. Achetez, louez, investissez en toute confiance
              avec escrow sécurisé et documents vérifiés dans 4 pays africains.
            </motion.p>

            {/* Search Bar - Glassmorphism Style */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: easeOut }}
              className="mb-10"
            >
              <div className="relative">
                {/* Gradient border glow */}
                <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-r from-[#009CDE]/40 via-[#D4AF37]/30 to-[#009CDE]/40 animate-pulse-slow" />
                <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-2xl">
                  {/* Search Input */}
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

                  {/* Divider */}
                  <div className="hidden sm:block w-px bg-gray-200 my-2" />

                  {/* Transaction Type Selector */}
                  <div className="flex items-center gap-2 px-4 py-3 sm:py-0">
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                      className="text-sm text-[#2C2E2F] bg-transparent outline-none font-body cursor-pointer"
                    >
                      <option value="achat">Acheter</option>
                      <option value="location">Louer</option>
                      <option value="investissement">Investir</option>
                      <option value="sejour">Séjour</option>
                    </select>
                  </div>

                  {/* Divider */}
                  <div className="hidden sm:block w-px bg-gray-200 my-2" />

                  {/* Country Selector */}
                  <div className="flex items-center gap-2 px-4 py-3 sm:py-0">
                    <svg className="w-4 h-4 text-[#009CDE] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                    <select
                      value={searchCountry}
                      onChange={(e) => setSearchCountry(e.target.value)}
                      className="text-sm text-[#2C2E2F] bg-transparent outline-none font-body cursor-pointer"
                    >
                      <option value="all">Tous les pays</option>
                      {COUNTRIES_CONFIG.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => searchType === 'sejour' ? window.location.href = '/booking' : onNavigate('search')}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#003087] hover:bg-[#0047b3] text-white rounded-[1.2rem] text-sm font-semibold transition-colors font-body"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Rechercher
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Stats Bar with Animated Counters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: easeOut }}
              className="flex flex-wrap gap-6 sm:gap-10"
            >
              {statsItems.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1, ease: easeOut }}
                  className="text-center sm:text-left"
                >
                  <div className="font-mono-data text-xl sm:text-2xl font-bold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-white/50 text-xs sm:text-sm font-body">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right Column - 40% - Floating Property Cards */}
          <div className="hidden lg:block flex-1 max-w-[40%] relative min-h-[500px]">
            {/* Floating Card 1 - Premium Property */}
            <motion.div
              initial={{ opacity: 0, y: 40, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: easeOut }}
              className="absolute top-8 left-0 w-72 animate-float-1"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden card-shadow">
                <div className="relative h-40">
                  {premiumProperties[0]?.images?.[0] ? (
                    <img
                      src={premiumProperties[0].images[0]}
                      alt={premiumProperties[0].title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#003087]/20 to-[#009CDE]/20 flex items-center justify-center">
                      <svg className="w-12 h-12 text-[#003087]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-[#D4AF37] text-white text-xs font-bold rounded-full">
                    Premium
                  </div>
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-medium rounded-full flex items-center gap-1">
                    <span className="text-[#00A651]">✓</span> Vérifié
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">
                    {premiumProperties[0]?.title || 'Villa Prestige Les Cocotiers'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2 font-body">
                    {premiumProperties[0]
                      ? `${premiumProperties[0].quartier}, ${premiumProperties[0].city}`
                      : 'Ganhi, Cotonou'}
                  </p>
                  <p className="font-mono-data text-lg font-bold text-[#D4AF37]">
                    {premiumProperties[0]
                      ? formatPrice(premiumProperties[0].price, premiumProperties[0].transaction)
                      : '85 000 000 FCFA'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2 - Second Property */}
            <motion.div
              initial={{ opacity: 0, y: 40, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: easeOut }}
              className="absolute top-48 right-0 w-64 animate-float-2"
            >
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden card-shadow">
                <div className="relative h-36">
                  {premiumProperties[1]?.images?.[0] ? (
                    <img
                      src={premiumProperties[1].images[0]}
                      alt={premiumProperties[1].title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#00A651]/15 to-[#009CDE]/15 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#003087]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-medium rounded-full flex items-center gap-1">
                    <span className="text-[#00A651]">✓</span> Vérifié
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1">
                    {premiumProperties[1]?.title || 'Appartement Moderne Plateau'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-1 font-body">
                    {premiumProperties[1]
                      ? `${premiumProperties[1].quartier}, ${premiumProperties[1].city}`
                      : 'Plateau, Abidjan'}
                  </p>
                  <p className="font-mono-data text-base font-bold text-[#D4AF37]">
                    {premiumProperties[1]
                      ? formatPrice(premiumProperties[1].price, premiumProperties[1].transaction)
                      : '350 000 FCFA/mois'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Rebecca IA Card - Enhanced with pulsing border */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: easeOut }}
              className="absolute bottom-4 left-4 w-64 animate-float-3"
            >
              <div
                className="relative bg-white rounded-3xl shadow-2xl p-4 card-shadow cursor-pointer hover:shadow-lg transition-shadow"
                onClick={onOpenRebecca}
              >
                {/* Pulsing AI border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-[#009CDE]/30 animate-pulse-gold" />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#003087] to-[#009CDE] flex items-center justify-center">
                      <span className="text-white text-sm font-bold">R</span>
                      {/* AI pulse ring */}
                      <div className="absolute inset-0 rounded-full border-2 border-[#009CDE]/40 animate-ping" style={{ animationDuration: '2s' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C2E2F] font-body">Rebecca IA</h4>
                      <p className="text-xs text-[#00A651] font-body">En ligne • Prête à aider</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl px-3 py-2 mb-2">
                    <p className="text-xs text-gray-600 italic font-body">&quot;Bonjour ! Je peux vous aider à trouver le bien parfait. Que recherchez-vous ?&quot;</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-[#003087]/5 text-[#003087] text-[10px] font-medium rounded-full font-body">Villa à Cotonou</span>
                    <span className="px-3 py-1 bg-[#003087]/5 text-[#003087] text-[10px] font-medium rounded-full font-body">Terrain Lomé</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom wave/gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />

      {/* CSS animation for slow pulse on search bar */}
      <style jsx>{`
        @keyframes meshShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </section>
  );
}
