'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { Globe } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface CountryStats {
  [key: string]: number;
}

const countryMeta: Record<string, { flag: string; name: string; emoji: string }> = {
  BJ: { flag: '🇧🇯', name: 'Bénin', emoji: 'BJ' },
  CI: { flag: '🇨🇮', name: "Côte d'Ivoire", emoji: 'CI' },
  BF: { flag: '🇧🇫', name: 'Burkina Faso', emoji: 'BF' },
  TG: { flag: '🇹🇬', name: 'Togo', emoji: 'TG' },
  SN: { flag: '🇸🇳', name: 'Sénégal', emoji: 'SN' },
};

const countryStats: Record<string, { agents: string; partners: string }> = {
  BJ: { agents: '120+', partners: '15' },
  CI: { agents: '200+', partners: '22' },
  BF: { agents: '80+', partners: '8' },
  TG: { agents: '60+', partners: '6' },
  SN: { agents: '150+', partners: '18' },
};

export default function PaysCouverts() {
  const { data: propertiesData } = useQuery({
    queryKey: ['properties-country-counts'],
    queryFn: async () => {
      const results: CountryStats = {};
      for (const country of COUNTRIES_CONFIG) {
        try {
          const res = await apiFetch<{ pagination: { total: number } }>(
            `/api/properties?country=${country.code}&limit=1`
          );
          results[country.code] = res.pagination.total;
        } catch {
          results[country.code] = 0;
        }
      }
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#001440] via-[#003087] to-[#001440] overflow-hidden">
      {/* World map dots pattern - bolder */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[28rem] h-[28rem] bg-[#009CDE]/25 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-[#D4AF37]/20 rounded-full blur-3xl"
        />
      </div>

      {/* Top gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-white/15 to-white/5 border border-[#D4AF37]/40 text-white text-sm font-bold mb-5 font-body uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            Présence Régionale
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Pays <span className="bg-gradient-to-r from-[#D4AF37] to-[#f0d572] bg-clip-text text-transparent">couverts</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-xl mx-auto font-body text-lg">
            Déjà opérationnel dans 5 pays d&apos;Afrique de l&apos;Ouest, avec des équipes locales et des partenaires certifiés.
          </p>
        </motion.div>

        {/* Country Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {COUNTRIES_CONFIG.map((country, i) => {
            const meta = countryMeta[country.code];
            const listingCount = propertiesData?.[country.code] ?? 0;
            const cStats = countryStats[country.code];

            return (
              <motion.a
                key={country.code}
                href={`/search?country=${country.code}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur-sm border border-white/15 hover:border-[#D4AF37]/60 hover:bg-white/[0.12] transition-all text-center cursor-pointer overflow-hidden"
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 bg-gradient-to-r from-[#D4AF37] to-[#009CDE]" />

                {/* Glow on hover */}
                <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#D4AF37]/20 via-transparent to-[#009CDE]/20" />

                {/* Flag with shadow */}
                <div className="relative text-6xl sm:text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="drop-shadow-2xl">{meta?.flag || <Globe className="w-6 h-6 text-white" />}</span>
                </div>

                {/* Country Name */}
                <h3 className="relative font-display text-xl sm:text-2xl font-bold text-white mb-3">
                  {meta?.name || country.name}
                </h3>

                {/* Listing Count - bold gold */}
                <div className="relative flex items-center justify-center gap-1.5 mb-3">
                  <span className="font-mono-data text-2xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#f0d572] bg-clip-text text-transparent">
                    {listingCount}
                  </span>
                  <span className="text-xs text-white/70 font-body uppercase tracking-wider">biens</span>
                </div>

                {/* Stats badges */}
                <div className="relative flex flex-col gap-1.5 mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50 uppercase tracking-wider">Agents</span>
                    <span className="text-[#D4AF37] font-bold">{cStats?.agents}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/50 uppercase tracking-wider">Partenaires</span>
                    <span className="text-[#009CDE] font-bold">{cStats?.partners}</span>
                  </div>
                </div>

                {/* Cities Preview */}
                <div className="relative mt-3 flex flex-wrap justify-center gap-1">
                  {country.cities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="px-2 py-0.5 bg-white/5 text-[10px] text-white/60 rounded-full font-body group-hover:text-white/80 transition-colors"
                    >
                      {city}
                    </span>
                  ))}
                </div>

                {/* Bottom accent */}
                <div className="absolute bottom-0 left-6 right-6 h-0.5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 bg-gradient-to-r from-[#D4AF37] to-transparent" />
              </motion.a>
            );
          })}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/15 backdrop-blur-sm">
            <span className="w-2 h-2 bg-[#00A651] rounded-full animate-pulse" />
            <p className="text-white/80 text-sm font-body">
              <span className="text-[#D4AF37] font-bold">Bientôt</span> dans 3 pays supplémentaires d&apos;Afrique de l&apos;Ouest
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
