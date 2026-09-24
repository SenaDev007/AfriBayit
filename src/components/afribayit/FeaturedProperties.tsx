'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api, apiFetch } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCard from './PropertyCard';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import type { PropertyListItem } from './PropertyGrid';

type FeaturedPropertiesResponse =
  | { properties: PropertyListItem[]; pagination?: unknown }
  | PropertyListItem[];

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
    <div className="overflow-hidden rounded-3xl border border-primary-pale bg-white shadow-lg">
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
        <div className="border-t border-primary-pale pt-3">
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function FeaturedProperties({ onSelectProperty, onNavigate }: FeaturedPropertiesProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const { selectedCountry } = useCountry();
  const isSejourTab = activeFilter === 'sejour';

  // Fetch properties directly from backend API.
  // The "Séjours" tab filters server-side on short-term rentals
  // (transaction=location_courte_duree) — it used to return a hardcoded []
  // which always showed "Aucun bien disponible".
  // `isPending` (not `isLoading`) so skeletons stay up during retry
  // back-off windows while Neon wakes up (see PropertyGrid).
  const { data, isPending, isError, refetch } = useQuery<FeaturedPropertiesResponse>({
    queryKey: ['featured-properties', selectedCountry, isSejourTab ? 'sejour' : 'standard'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '12');
      params.set('page', '1');
      if (isSejourTab) {
        params.set('transaction', 'location_courte_duree');
      }
      if (selectedCountry) {
        params.set('country', selectedCountry);
      }
      const res = await api.get<FeaturedPropertiesResponse>(`/properties?${params.toString()}`);
      return res;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
    // Neon (free tier) auto-suspends after ~5 min idle and takes ~10s to
    // wake — space the retries (4s/8s) so the wake-up completes before the
    // last attempt instead of failing all of them back-to-back.
    retryDelay: (attemptIndex) => Math.min(4000 * 2 ** attemptIndex, 12000),
    placeholderData: keepPreviousData,
  });

  const allProperties: PropertyListItem[] = Array.isArray(data)
    ? data
    : (data?.properties ?? []);

  const featured = allProperties
    .filter((p) => p.premium || p.verified)
    .slice(0, 12);

  const baseProperties = featured.length > 0
    ? featured
    : allProperties.slice(0, 12);

  const displayProperties = useMemo(() => {
    if (activeFilter === 'all') return baseProperties.slice(0, 6);
    // Séjours tab: already filtered server-side (transaction=location_courte_duree)
    if (activeFilter === 'sejour') return baseProperties.slice(0, 6);
    return baseProperties.filter((p) => p.type === activeFilter).slice(0, 6);
  }, [baseProperties, activeFilter]);

  return (
    <section className="bg-cream py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-bold uppercase tracking-wider">
              Sélection Premium
            </span>
            <h2 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-primary-deep sm:text-5xl lg:text-6xl">
              Biens en vedette
            </h2>
            <p className="mt-3 max-w-lg text-gray-text">
              Une sélection rigoureuse de biens vérifiés et certifiés AfriBayit.
            </p>
            <div className="h-1 w-16 bg-accent-yellow mt-6 rounded-full" />
          </div>
          <motion.button
            whileHover={{ x: 4 }}
            onClick={() => onNavigate('search')}
            className="group inline-flex items-center gap-2 rounded-full border border-primary-deep/20 px-6 py-3 text-sm font-bold text-primary-deep transition-all hover:bg-primary-pale"
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
            <span className="text-xs font-bold uppercase tracking-wider text-gray-text/60">Pays:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-green/20 bg-primary-pale px-3 py-1.5 text-xs font-semibold text-primary-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-yellow" />
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
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeFilter === tab.key
                    ? 'bg-primary-deep text-white shadow-md'
                    : 'border border-primary-pale bg-white text-gray-text hover:border-primary-green/40 hover:text-primary-deep hover:bg-primary-pale/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Loading — `isPending` stays true across retry back-off windows */}
        {isPending && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error — distinct from the empty state: the previous wording
            ("Aucun bien disponible") masked loading failures as a healthy
            empty catalogue, which looked like data loss to users. */}
        {isError && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-pale">
              <svg className="h-7 w-7 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-deep">Erreur de chargement</h3>
            <p className="mt-2 text-sm text-gray-text">
              Impossible de charger les biens pour le moment.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-deep/20 px-6 py-2.5 text-sm font-bold text-primary-deep transition-all hover:bg-primary-pale"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Réessayer
            </button>
          </div>
        )}

        {/* Empty */}
        {!isPending && !isError && displayProperties.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-pale">
              <svg className="h-7 w-7 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-deep">Aucun bien en vedette</h3>
            <p className="mt-2 text-sm text-gray-text">
              Les biens premium apparaîtront ici prochainement.
            </p>
          </div>
        )}

        {/* Grid */}
        {!isPending && !isError && displayProperties.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayProperties.map((property: PropertyListItem, i: number) => (
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
