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

export default function PaysCouverts() {
  // Fetch property counts per country
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
    <section className="relative py-20 sm:py-28 bg-[#003087] overflow-hidden">
      {/* Decorative world map dots pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#009CDE]/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold mb-4 font-body">
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            Présence Régionale
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Pays <span className="text-[#D4AF37]">couverts</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto font-body">
            Déjà opérationnel dans 5 pays d&apos;Afrique de l&apos;Ouest, avec des équipes locales et des partenaires certifiés.
          </p>
        </motion.div>

        {/* Country Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {COUNTRIES_CONFIG.map((country, i) => {
            const meta = countryMeta[country.code];
            const listingCount = propertiesData?.[country.code] ?? 0;

            return (
              <motion.a
                key={country.code}
                href={`/search?country=${country.code}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group relative p-6 sm:p-8 rounded-3xl bg-white/[0.06] backdrop-blur-sm border border-white/10 hover:border-[#D4AF37]/40 hover:bg-white/[0.1] transition-all text-center cursor-pointer overflow-hidden"
              >
                {/* Glow on hover */}
                <div className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-[#D4AF37]/15 via-transparent to-[#009CDE]/15" />

                {/* Flag */}
                <div className="relative text-5xl sm:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {meta?.flag || <Globe className="w-6 h-6 text-white" />}
                </div>

                {/* Country Name */}
                <h3 className="relative font-display text-lg sm:text-xl font-bold text-white mb-2">
                  {meta?.name || country.name}
                </h3>

                {/* Listing Count */}
                <div className="relative flex items-center justify-center gap-1.5">
                  <span className="font-mono-data text-base font-bold text-[#D4AF37]">
                    {listingCount}
                  </span>
                  <span className="text-xs text-white/50 font-body">biens</span>
                </div>

                {/* Cities Preview */}
                <div className="relative mt-3 flex flex-wrap justify-center gap-1">
                  {country.cities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="px-2 py-0.5 bg-white/5 text-[10px] text-white/60 rounded-full font-body"
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
      </div>
    </section>
  );
}
