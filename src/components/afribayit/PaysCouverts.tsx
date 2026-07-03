'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { Globe } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface CountryStats {
  [key: string]: number;
}

const countryMeta: Record<string, { flag: string; name: string }> = {
  BJ: { flag: '🇧🇯', name: 'Bénin' },
  CI: { flag: '🇨🇮', name: "Côte d'Ivoire" },
  BF: { flag: '🇧🇫', name: 'Burkina Faso' },
  TG: { flag: '🇹🇬', name: 'Togo' },
  SN: { flag: '🇸🇳', name: 'Sénégal' },
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
            <Globe className="h-3.5 w-3.5" />
            Présence Régionale
            <span className="h-px w-8 bg-[#FFCC00]" />
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-cormorant),Georgia,serif] text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Pays couverts
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-inter),system-ui,sans-serif] text-lg text-white/70">
            Déjà opérationnel dans 5 pays d&apos;Afrique de l&apos;Ouest, avec des équipes locales et des partenaires certifiés.
          </p>
        </motion.div>

        {/* Country Grid — centered regardless of count */}
        <div className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-6">
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
                className="group flex w-full max-w-[240px] flex-col items-center rounded-2xl border-2 border-white/20 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#FFCC00] hover:shadow-xl"
              >
                {/* Flag */}
                <div className="text-5xl transition-transform duration-300 group-hover:scale-110 sm:text-6xl">
                  {meta?.flag || <Globe className="h-6 w-6 text-white" />}
                </div>

                {/* Name */}
                <h3 className="mt-4 font-[family-name:var(--font-cormorant),Georgia,serif] text-lg font-bold text-gray-900 sm:text-xl">
                  {meta?.name || country.name}
                </h3>

                {/* Listing count */}
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-[family-name:var(--font-space-grotesk),monospace] text-2xl font-bold text-[#003366]">
                    {listingCount}
                  </span>
                  <span className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-xs uppercase tracking-wider text-gray-400">
                    biens
                  </span>
                </div>

                {/* Stats */}
                <div className="mt-4 w-full space-y-1.5 border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between font-[family-name:var(--font-inter),system-ui,sans-serif] text-[10px]">
                    <span className="uppercase tracking-wider text-gray-400">Agents</span>
                    <span className="font-bold text-[#3399FF]">{cStats?.agents}</span>
                  </div>
                  <div className="flex items-center justify-between font-[family-name:var(--font-inter),system-ui,sans-serif] text-[10px]">
                    <span className="uppercase tracking-wider text-gray-400">Partenaires</span>
                    <span className="font-bold text-[#FFCC00]">{cStats?.partners}</span>
                  </div>
                </div>

                {/* Cities */}
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {country.cities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="rounded-full bg-gray-100 px-2 py-0.5 font-[family-name:var(--font-inter),system-ui,sans-serif] text-[10px] text-gray-500"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-6 py-3">
            <span className="h-2 w-2 rounded-full bg-[#3399FF]" />
            <p className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm text-white/70">
              <span className="font-bold text-[#FFCC00]">Bientôt</span> dans 3 pays supplémentaires d&apos;Afrique de l&apos;Ouest
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
