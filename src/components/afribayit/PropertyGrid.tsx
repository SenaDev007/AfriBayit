'use client';

/**
 * PropertyGrid — fetches properties by transaction type and displays them
 * in a responsive grid using the existing PropertyCard component.
 *
 * Uses real images from the database (each property has images[] URLs).
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import PropertyCard from './PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';

const easeOut = [0.16, 1, 0.3, 1] as const;

const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';

const PROPERTY_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'villa', label: 'Villas' },
  { value: 'appartement', label: 'Appartements' },
  { value: 'terrain', label: 'Terrains' },
  { value: 'bureau', label: 'Bureaux' },
  { value: 'commerce', label: 'Commerces' },
];

const PRICE_RANGES = [
  { value: 'all', label: 'Tous budgets' },
  { value: '0-5000000', label: '< 5M FCFA' },
  { value: '5000000-15000000', label: '5M - 15M FCFA' },
  { value: '15000000-50000000', label: '15M - 50M FCFA' },
  { value: '50000000-999999999', label: '> 50M FCFA' },
];

interface PropertyGridProps {
  transaction: 'achat' | 'location' | 'investissement' | 'location_courte_duree';
  emptyMessage?: string;
}

export default function PropertyGrid({ transaction, emptyMessage }: PropertyGridProps) {
  const router = useRouter();
  const { selectedCountry } = useCountry();
  const [activeType, setActiveType] = useState('all');
  const [activePrice, setActivePrice] = useState('all');

  // Build query params
  const params = new URLSearchParams();
  params.set('transaction', transaction);
  params.set('limit', '24');
  params.set('page', '1');
  if (selectedCountry && selectedCountry !== ('all' as any)) {
    params.set('country', selectedCountry);
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['transaction-properties', transaction, selectedCountry],
    queryFn: () => apiFetch<{ properties: any[]; pagination: any }>(`/properties?${params.toString()}`),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const allProperties = data?.properties || [];

  // Client-side filter by type and price range (since backend doesn't support price range yet)
  const filteredProperties = useMemo(() => {
    let result = allProperties;

    if (activeType !== 'all') {
      result = result.filter((p) => p.type === activeType);
    }

    if (activePrice !== 'all') {
      const [min, max] = activePrice.split('-').map(Number);
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    return result;
  }, [allProperties, activeType, activePrice]);

  const handleSelectProperty = (id: string) => {
    router.push(`/property/${id}`);
  };

  return (
    <section className="py-20 bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
        >
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
              <span className="h-px w-8" style={{ background: NAVY }} />
              {filteredProperties.length} bien{filteredProperties.length > 1 ? 's' : ''} disponible{filteredProperties.length > 1 ? 's' : ''}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              {selectedCountry && selectedCountry !== ('all' as any)
                ? `Biens en ${COUNTRY_NAMES[selectedCountry] || selectedCountry}`
                : 'Tous les biens'}
            </h2>
          </div>

          {/* Country indicator */}
          {selectedCountry && selectedCountry !== ('all' as any) && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: `${NAVY}10`, border: `1px solid ${NAVY}30` }}>
              <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
              <span className="text-sm font-semibold" style={{ color: NAVY }}>
                {COUNTRY_NAMES[selectedCountry] || selectedCountry}
              </span>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Type filter */}
          <div className="flex flex-wrap gap-2">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setActiveType(type.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeType === type.value
                    ? 'text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={activeType === type.value ? { background: NAVY } : {}}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Price filter */}
          <select
            value={activePrice}
            onChange={(e) => setActivePrice(e.target.value)}
            className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-600 cursor-pointer hover:border-gray-300 transition-all"
          >
            {PRICE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-400">Erreur de chargement</h3>
            <p className="mt-2 text-sm text-gray-400">Impossible de charger les biens. Veuillez réessayer.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filteredProperties.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-400">
              {emptyMessage || 'Aucun bien disponible'}
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Les biens apparaîtront ici dès qu'ils seront publiés.
            </p>
          </div>
        )}

        {/* Property grid */}
        {!isLoading && !isError && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property: any, i: number) => (
              <PropertyCard
                key={property.id}
                property={property}
                index={i}
                onSelect={handleSelectProperty}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
