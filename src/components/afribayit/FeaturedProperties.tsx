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
    <div className="rounded-3xl bg-white border border-gray-100 overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-5 space-y-3">
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
        <div className="pt-3 border-t border-gray-100">
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
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-[#f8fafc] to-white overflow-hidden">
      {/* Decorative top accent - bold gold line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #003087 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bold header with navy gradient strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#003087] to-[#001a4f] border border-[#D4AF37]/30 text-white text-sm font-bold mb-5 font-body uppercase tracking-wider shadow-lg shadow-[#003087]/20">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              Sélection Premium
            </span>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2C2E2F] leading-tight">
              Biens <span className="bg-gradient-to-r from-[#003087] to-[#009CDE] bg-clip-text text-transparent">en vedette</span>
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg font-body">
              Une sélection rigoureuse de biens vérifiés et certifiés AfriBayit.
            </p>
          </div>
          <motion.button
            whileHover={{ x: 6 }}
            onClick={() => onNavigate('search')}
            className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#003087] hover:bg-[#001a4f] text-white text-sm font-bold shadow-lg shadow-[#003087]/25 transition-all font-body"
          >
            Voir tous les biens
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>

        {/* Country Filter Badge + filter pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pays:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#003087]/10 to-[#009CDE]/10 border border-[#003087]/20 text-[#003087] text-xs font-bold">
              <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
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
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all font-body ${
                  activeFilter === tab.key
                    ? 'bg-gradient-to-r from-[#003087] to-[#001a4f] text-white shadow-md shadow-[#003087]/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#D4AF37]/50 hover:text-[#003087] hover:shadow-sm'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-bold text-gray-400 mb-2">Erreur de chargement</h3>
            <p className="text-sm text-gray-400 font-body">Impossible de charger les biens en vedette. Veuillez réessayer.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && displayProperties.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            {activeFilter === 'sejour' ? (
              <>
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Explorez nos hôtels et guesthouses</h3>
                <p className="text-sm text-gray-400 font-body mb-4 max-w-md mx-auto">
                  Découvrez notre sélection d&apos;hébergements en Afrique de l&apos;Ouest — hôtels, maisons d&apos;hôtes et séjours certifiés.
                </p>
                <a
                  href="/booking"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#b8961f] text-white rounded-full text-sm font-bold transition-colors shadow-lg shadow-[#D4AF37]/25"
                >
                  Voir les séjours
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg font-bold text-gray-400 mb-2">Aucun bien en vedette</h3>
                <p className="text-sm text-gray-400 font-body">
                  {activeFilter !== 'all'
                    ? `Aucun bien de type "${filterTabs.find(t => t.key === activeFilter)?.label}" trouvé.`
                    : 'Les biens premium apparaîtront ici prochainement.'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && !isError && displayProperties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
