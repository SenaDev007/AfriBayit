'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ArrowRight, Search, MapPin, Sparkles } from 'lucide-react';

/**
 * Hero — portage fidèle du design Win-Agro (components/sections/Hero.tsx)
 * sur la palette AfriBayit : fond navy, voile dégradé, halos flottants,
 * grain SVG, badge pulsé, titre révélé en cascade avec souligné or animé,
 * CTA shimmer + séparation inclinée vers la section suivante.
 * La barre de recherche immobilière AfriBayit est intégrée en glassmorphism.
 */
export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    router.push(`/search?${params.toString()}`);
  };

  const scrollTo = (href: string) => {
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const offset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-24 overflow-hidden bg-primary-deep text-white"
    >
      {/* 1. Image d'arrière-plan premium + voile dégradé navy */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1920&q=80"
          alt="Résidence moderne premium en Afrique — AfriBayit"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-102"
        />

        {/* Voile dégradé dynamique — navy AfriBayit */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-deep/90 via-primary-deep/80 to-noir-vert/90 mix-blend-multiply" />

        {/* Cercles décoratifs flottants lumineux */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-green/20 rounded-full blur-[100px] animate-float" />
        <div
          className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-accent-yellow/5 rounded-full blur-[150px] animate-float"
          style={{ animationDelay: '2s' }}
        />

        {/* Filtre grain bruit SVG */}
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none mix-blend-overlay"
        >
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>

        {/* Motif de grille décoratif */}
        <div className="absolute inset-0 bg-grain opacity-[0.08] mix-blend-overlay" />
      </div>

      {/* 2. Grille de contenu Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge pulsé en cascade */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-green/30 border border-primary-green/50 text-accent-yellow font-sans font-bold text-xs uppercase tracking-wider mb-8 animate-pulse-slow"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-yellow opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-yellow" />
            </span>
            <Home className="w-4 h-4 text-accent-yellow shrink-0" /> Où l&apos;Afrique trouve sa maison
          </motion.div>

          {/* Titre principal (H1) révélé en cascade */}
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.15] mb-6">
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              className="block"
            >
              Tu cherches une maison
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
              className="block mt-2 text-white"
            >
              en Afrique de l&apos;Ouest ?
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
              className="block mt-4"
            >
              Nous t&apos;accompagnons jusqu&apos;à la{' '}
              <span className="relative inline-block text-accent-yellow font-black">
                remise des clés
                <motion.span
                  animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
                  className="absolute bottom-1 left-0 w-full h-[4px] bg-accent-yellow rounded-full"
                />
              </span>
              .
            </motion.span>
          </h1>

          {/* Sous-titre */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
            className="text-base sm:text-lg md:text-xl text-gray-200 font-sans leading-relaxed max-w-2xl mb-10"
          >
            Achat, location, séjours et services immobiliers de confiance au Bénin, en Côte d&apos;Ivoire, au Burkina Faso et au Togo.{' '}
            <span className="font-bold text-white">AfriBayit</span> sécurise chaque étape — du premier clic à la signature notariée.
          </motion.p>

          {/* Barre de recherche glassmorphism AfriBayit */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: 'easeOut' }}
            className="w-full max-w-2xl mb-8"
          >
            <div className="glass-panel rounded-full p-2 flex items-center gap-2 shadow-2xl">
              <MapPin className="w-5 h-5 text-primary-deep ml-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Villa à Cotonou, appartement à Abidjan, terrain à Lomé..."
                className="flex-1 bg-transparent px-2 py-2.5 text-sm text-primary-deep placeholder:text-primary-deep/50 focus:outline-none font-sans"
                aria-label="Rechercher un bien"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-sm shadow-lg transition-colors cursor-pointer btn-shimmer shrink-0"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Rechercher</span>
              </motion.button>
            </div>
          </motion.form>

          {/* CTA d'action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto"
          >
            <motion.button
              onClick={() => router.push('/search')}
              whileHover={{ scale: 1.05, boxShadow: '0px 10px 25px rgba(0, 156, 222, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary-green hover:bg-primary-green/90 text-white font-sans font-bold text-base shadow-xl border border-primary-green flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary-green/50 btn-shimmer"
            >
              Explorer les biens disponibles
              <ArrowRight className="w-5 h-5 shrink-0" />
            </motion.button>

            <div className="flex items-center gap-2 text-sm text-gray-300 font-sans font-medium">
              <button
                onClick={() => router.push('/publish')}
                className="hover:text-accent-yellow underline transition-colors cursor-pointer"
              >
                Publier une annonce
              </button>
              <span>·</span>
              <button
                onClick={() => scrollTo('#services')}
                className="hover:text-accent-yellow underline transition-colors cursor-pointer"
              >
                Nos services
              </button>
            </div>
          </motion.div>

          {/* Indicateur de confiance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-300 font-sans"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-yellow" /> Transactions sécurisées par séquestre (escrow)
            </span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-yellow" /> Notaires accrédités vérifiés
            </span>
            <span className="hidden sm:inline text-white/30">|</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-yellow" /> 4 pays couverts
            </span>
          </motion.div>
        </div>
      </div>

      {/* Séparation inclinée élégante */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-cream" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0)' }} />
    </section>
  );
}
