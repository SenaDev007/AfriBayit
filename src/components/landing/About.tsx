'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';

/**
 * Section À Propos — portage du design Win-Agro About.tsx sur AfriBayit :
 * narration 60/40, citation hook, souligné or animé, bloc vision pale,
 * zone signature + CTA. Le visuel d'équipe Win-Agro est remplacé par un
 * panorama des pays pionniers AfriBayit au design premium équivalent.
 */
export default function About() {
  const router = useRouter();

  const countries = [
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯', city: 'Cotonou' },
    { code: 'CI', name: 'Côte d\u2019Ivoire', flag: '🇨🇮', city: 'Abidjan' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', city: 'Ouagadougou' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬', city: 'Lomé' },
  ];

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Arrière-plans flous décoratifs */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary-pale rounded-full blur-3xl opacity-40 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* 1. Contenu narratif (60%) */}
          <div className="w-full lg:w-3/5 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-2">
              À Propos d&apos;AfriBayit
            </div>

            {/* Déclaration hook */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary-deep leading-snug"
            >
              &quot;Nous avons vu trop de familles perdre leurs économies sur des biens qui n&apos;auraient jamais dû
              être vendus.&quot;
            </motion.h2>

            <motion.div
              animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
              transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
              className="h-1 w-16 bg-accent-yellow rounded-full"
            />

            {/* Paragraphes structurés */}
            <div className="space-y-4 text-sm sm:text-base text-gray-text font-sans leading-relaxed">
              <p>
                <strong className="text-primary-deep">AfriBayit</strong> est la plateforme immobilière
                panafricaine de nouvelle génération. Depuis notre premier marché, nous accompagnons acheteurs,
                locataires et voyageurs avec la même conviction :{' '}
                <span className="relative inline-block font-bold text-primary-green">
                  un marché immobilier digne de confiance est possible.
                  <motion.span
                    animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
                    transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-yellow rounded-full"
                  />
                </span>
              </p>

              <p>
                Notre mission est simple : réunir tous les acteurs — propriétaires vérifiés, agents certifiés,
                notaires accrédités, artisans qualifiés — sur une plateforme où chaque annonce est contrôlée, chaque
                fonds passe par un séquestre sécurisé et chaque signature est authentifiée. Que tu cherches ta
                première maison, ton prochain investissement ou simplement un week-end dans une guesthouse de
                confiance.
              </p>
            </div>

            {/* Bloc vision panafricaine */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 bg-primary-pale rounded-3xl border border-primary-green/20 my-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-yellow/10 rounded-full blur-xl" />
              <h3 className="font-serif text-lg font-extrabold text-primary-deep mb-2 flex items-center gap-1.5">
                <Globe2 className="w-5 h-5 text-primary-green shrink-0" /> Une vision d&apos;envergure africaine
              </h3>
              <p className="font-sans text-sm sm:text-base text-primary-deep font-semibold leading-relaxed">
                Derrière cette rigueur quotidienne, une ambition plus grande nous porte :{' '}
                <span className="text-primary-green font-black font-serif text-base sm:text-lg block mt-1">
                  Connecter tous les marchés immobiliers d&apos;Afrique de l&apos;Ouest sur une seule adresse de
                  confiance, et faire de chaque transaction une fondation pour les générations suivantes.
                </span>
              </p>
            </motion.div>

            {/* Zone signature */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4">
              <div>
                <p className="font-serif text-xl font-extrabold text-primary-deep italic flex items-center gap-1">
                  Ta prochaine adresse commence ici. <Globe2 className="w-5 h-5 text-primary-green shrink-0" />
                </p>
                <p className="font-sans text-xs text-gray-text font-bold uppercase tracking-wider mt-1">
                  L&apos;équipe AfriBayit · Bénin, Côte d&apos;Ivoire, Burkina Faso, Togo
                </p>
              </div>

              <motion.button
                onClick={() => router.push('/search')}
                whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 156, 222, 0.3)' }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md cursor-pointer btn-shimmer"
              >
                Commencer mon projet →
              </motion.button>
            </div>
          </div>

          {/* 2. Panorama des pays pionniers (40%) — design premium équivalent TeamShowcase */}
          <div className="w-full lg:w-2/5 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl bg-primary-deep p-8 shadow-2xl overflow-hidden card-shimmer"
            >
              {/* Halo décoratif */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-green/20 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent-yellow/10 rounded-full blur-[80px]" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative w-16 h-16 rounded-full bg-white border border-primary-green/30 shadow-md flex items-center justify-center p-1.5 shrink-0">
                    <img src="/logo.png" alt="AfriBayit" className="h-12 w-12 object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif text-xl font-bold leading-tight text-white tracking-wide">
                      AfriBayit
                    </span>
                    <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-accent-yellow">
                      4 pays pionniers
                    </span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-extrabold text-white mb-6">
                  Déjà opérationnel dans nos marchés pionniers
                </h3>

                <div className="space-y-3">
                  {countries.map((country, idx) => (
                    <motion.div
                      key={country.code}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      whileHover={{ x: 6 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-accent-yellow/30 transition-all duration-300"
                    >
                      <span className="text-3xl shrink-0">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-white text-sm">{country.name}</p>
                        <p className="text-[11px] text-gray-400 font-sans">{country.city} &amp; environs</p>
                      </div>
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-green opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-green" />
                      </span>
                    </motion.div>
                  ))}
                </div>

                <p className="text-xs text-gray-400 font-sans mt-6 text-center">
                  Expansion progressive vers le reste du continent
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
