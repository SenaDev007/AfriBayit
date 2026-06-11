'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface CountryStats {
  [key: string]: number;
}

const countryMeta: Record<string, { flag: string; name: string }> = {
  BJ: { flag: '🇧🇯', name: 'Bénin' },
  CI: { flag: '🇨🇮', name: "Côte d'Ivoire" },
  BF: { flag: '🇧🇫', name: 'Burkina Faso' },
  TG: { flag: '🇹🇬', name: 'Togo' },
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
    <section className="py-16 md:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge className="bg-[#003087]/5 text-[#003087] border-[#003087]/10 text-xs font-semibold uppercase tracking-wider mb-3">
            Présence Régionale
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Pays <span className="text-[#003087]">couverts</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            Déjà opérationnel dans 4 pays d&apos;Afrique de l&apos;Ouest, avec des équipes locales et des partenaires certifiés.
          </p>
        </motion.div>

        {/* Country Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {COUNTRIES_CONFIG.map((country, i) => {
            const meta = countryMeta[country.code];
            const listingCount = propertiesData?.[country.code] ?? 0;

            return (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="group relative p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:border-[#003087]/10 transition-all duration-300 text-center cursor-pointer"
              >
                {/* Flag */}
                <div className="text-5xl sm:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {meta?.flag || <Globe className="w-6 h-6 text-[#003087]" />}
                </div>

                {/* Country Name */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#2C2E2F] mb-2">
                  {meta?.name || country.name}
                </h3>

                {/* Listing Count */}
                <div className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4 text-[#009CDE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <span className="font-mono-data text-sm font-bold text-[#003087]">
                    {listingCount}
                  </span>
                  <span className="text-xs text-gray-400 font-body">biens</span>
                </div>

                {/* Cities Preview */}
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {country.cities.slice(0, 3).map((city) => (
                    <span
                      key={city}
                      className="px-2 py-0.5 bg-gray-50 text-[10px] text-gray-400 rounded-full font-body"
                    >
                      {city}
                    </span>
                  ))}
                </div>

                {/* Hover accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#003087] rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
