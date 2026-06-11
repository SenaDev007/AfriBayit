'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
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

  // Get all properties
  const allProperties = data?.properties || [];

  // Filter for premium/verified properties from the API response
  const featured = allProperties
    .filter(p => p.premium || p.verified)
    .slice(0, 12);

  // If no premium/verified, show the first published properties
  const baseProperties = featured.length > 0
    ? featured
    : allProperties.slice(0, 12);

  // Apply client-side type filter
  const displayProperties = useMemo(() => {
    if (activeFilter === 'all') return baseProperties.slice(0, 6);
    if (activeFilter === 'sejour') return []; // Séjours use a different model, show CTA instead
    return baseProperties.filter(p => p.type === activeFilter).slice(0, 6);
  }, [baseProperties, activeFilter]);

  return (
    <section className="py-16 md:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs font-semibold uppercase tracking-wider mb-3">
            Sélection Premium
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Biens <span className="text-[#003087]">en vedette</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            Découvrez notre sélection de propriétés premium et vérifiées en Afrique de l&apos;Ouest.
          </p>
        </motion.div>

        {/* View all link */}
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ x: 4 }}
            onClick={() => onNavigate('search')}
            className="text-[#003087] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all font-body"
          >
            Voir tous les biens
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all font-body ${
                activeFilter === tab.key
                  ? 'bg-[#003087] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-[#003087]/30 hover:text-[#003087]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

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
          <div className="text-center py-12">
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
          <div className="text-center py-12">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full text-sm font-semibold transition-colors"
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
