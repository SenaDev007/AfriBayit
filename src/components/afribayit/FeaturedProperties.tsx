'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCard from './PropertyCard';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface FeaturedPropertiesProps {
  onSelectProperty: (id: string) => void;
  onNavigate: (section: string) => void;
}

const filterTabs = [
  { key: 'all', label: 'Tout' },
  { key: 'villa', label: 'Villas' },
  { key: 'appartement', label: 'Appartements' },
  { key: 'terrain', label: 'Terrains' },
  { key: 'bureau', label: 'Bureaux' },
  { key: 'sejour', label: 'Séjours' },
];

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-4 w-8 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProperties({ onSelectProperty, onNavigate }: FeaturedPropertiesProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const { selectedCountry } = useCountry();
  const { data, isLoading, isError } = useProperties({ country: selectedCountry, limit: 12 });

  const allProperties = data?.properties || [];

  const featured = allProperties
    .filter(p => p.premium || p.verified)
    .slice(0, 12);

  const baseProperties = featured.length > 0
    ? featured
    : allProperties.slice(0, 12);

  const displayProperties = useMemo(() => {
    if (activeFilter === 'all') return baseProperties.slice(0, 6);
    if (activeFilter === 'sejour') return [];
    return baseProperties.filter(p => p.type === activeFilter).slice(0, 6);
  }, [baseProperties, activeFilter]);

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#003366]">
              <span className="h-px w-8 bg-[#003366]" />
              Sélection Premium
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-cormorant),Georgia,serif] text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Biens en vedette
            </h2>
            <p className="mt-3 max-w-lg font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-gray-500">
              Une sélection rigoureuse de biens vérifiés et certifiés AfriBayit.
            </p>
          </div>
          <motion.button
            whileHover={{ x: 4 }}
            onClick={() => onNavigate('search')}
            className="group inline-flex items-center gap-2 rounded-full border border-[#003366] px-6 py-3 font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-sm font-semibold text-[#003366] transition-colors hover:bg-[#003366] hover:text-white"
          >
            Voir tous les biens
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Country filter + filter pills */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-xs font-medium uppercase tracking-wider text-gray-400">Pays:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#003366]/20 bg-[#003366]/5 px-3 py-1.5 font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-xs font-semibold text-[#003366]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FFCC00]" />
              {COUNTRY_NAMES[selectedCountry] || selectedCountry}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
            className="flex flex-wrap gap-2"
          >
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`rounded-full px-4 py-2 font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-sm font-semibold transition-colors ${
                  activeFilter === tab.key
                    ? 'bg-[#003366] text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-[#003366]/40 hover:text-[#003366]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-cormorant),Georgia,serif] text-lg font-bold text-gray-400">Erreur de chargement</h3>
            <p className="mt-2 font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-sm text-gray-400">Impossible de charger les biens. Veuillez réessayer.</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && displayProperties.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            {activeFilter === 'sejour' ? (
              <>
                <h3 className="font-[family-name:var(--font-cormorant),Georgia,serif] text-lg font-bold text-gray-900">Explorez nos hôtels et guesthouses</h3>
                <p className="mx-auto mt-2 max-w-md font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-sm text-gray-400">
                  Découvrez notre sélection d&apos;hébergements en Afrique de l&apos;Ouest.
                </p>
                <a
                  href="/booking"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFCC00] px-6 py-3 font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-sm font-semibold text-[#003366] transition-colors hover:bg-[#FFE680]"
                >
                  Voir les séjours
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </>
            ) : (
              <>
                <h3 className="font-[family-name:var(--font-cormorant),Georgia,serif] text-lg font-bold text-gray-400">Aucun bien en vedette</h3>
                <p className="mt-2 font-[family-name:var(--font-dm-sans),system-ui,sans-serif] text-sm text-gray-400">
                  {activeFilter !== 'all'
                    ? `Aucun bien de type "${filterTabs.find(t => t.key === activeFilter)?.label}" trouvé.`
                    : 'Les biens premium apparaîtront ici prochainement.'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && !isError && displayProperties.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayProperties.map((property, i) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={i}
                onSelect={onSelectProperty}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
