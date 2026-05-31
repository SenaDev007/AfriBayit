'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProperties } from '@/hooks/useProperties';
import { COUNTRIES_CONFIG, getPropertyTypeLabel } from '@/lib/afribayit-utils';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyCard from './PropertyCard';

interface SearchResultsProps {
  initialTab?: string;
  onSelectProperty: (id: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Config constants (not from DB)
const TABS = [
  { key: 'achat', label: 'Acheter' },
  { key: 'location', label: 'Louer' },
  { key: 'investissement', label: 'Investir' },
] as const;

const PROPERTY_TYPES = ['all', 'villa', 'appartement', 'terrain', 'bureau', 'commerce', 'chambre'] as const;

function SearchCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex gap-4 p-4 rounded-3xl bg-white border">
        <Skeleton className="w-40 h-28 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl bg-white border overflow-hidden">
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

export default function SearchResults({ initialTab = 'achat', onSelectProperty }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [geoTrustOnly, setGeoTrustOnly] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Build filter params for the API call
  const filterParams = useMemo(() => ({
    transaction: activeTab,
    type: selectedType !== 'all' ? selectedType : undefined,
    country: selectedCountry !== 'all' ? selectedCountry : undefined,
    city: selectedCity !== 'all' ? selectedCity : undefined,
    minPrice: priceRange[0] > 0 ? String(priceRange[0]) : undefined,
    maxPrice: priceRange[1] < 200000000 ? String(priceRange[1]) : undefined,
    verified: verifiedOnly ? 'true' : undefined,
    geoTrust: geoTrustOnly ? 'true' : undefined,
    sortBy,
    limit: 24,
  }), [activeTab, selectedType, selectedCountry, selectedCity, priceRange, verifiedOnly, geoTrustOnly, sortBy]);

  const { data, isLoading, isError } = useProperties(filterParams);

  const properties = data?.properties || [];
  const totalResults = data?.pagination?.total || 0;

  const allCities = useMemo(() => {
    if (selectedCountry === 'all') return COUNTRIES_CONFIG.flatMap(c => c.cities);
    return COUNTRIES_CONFIG.find(c => c.name === selectedCountry)?.cities || [];
  }, [selectedCountry]);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F]">
                Rechercher un bien
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isLoading ? 'Chargement...' : `${totalResults} bien${totalResults !== 1 ? 's' : ''} trouvé${totalResults !== 1 ? 's' : ''}`}
              </p>
            </div>
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium border shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtres
            </button>
          </div>

          {/* Transaction Tabs */}
          <div className="flex gap-2 mb-4">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#003087] text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-sm border">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher par ville, quartier, mot-clé..."
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
            <button className="px-5 py-2 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors">
              Rechercher
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className={`${
              filtersOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-72 shrink-0`}
          >
            <div className="bg-white rounded-3xl p-5 shadow-sm border sticky top-24">
              <h3 className="font-semibold text-sm text-[#2C2E2F] mb-4">Filtres</h3>

              {/* Type de bien */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Type de bien</label>
                <div className="flex flex-wrap gap-1.5">
                  {PROPERTY_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedType === type
                          ? 'bg-[#003087] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? 'Tous' : getPropertyTypeLabel(type)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pays */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Pays</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity('all'); }}
                  className="w-full text-sm px-3 py-2 rounded-xl border bg-gray-50 outline-none"
                >
                  <option value="all">Tous les pays</option>
                  {COUNTRIES_CONFIG.map(c => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Ville */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Ville</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border bg-gray-50 outline-none"
                >
                  <option value="all">Toutes les villes</option>
                  {allCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 mb-2 block">Budget (FCFA)</label>
                <input
                  type="range"
                  min={0}
                  max={200000000}
                  step={1000000}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                  className="w-full accent-[#003087]"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0</span>
                  <span className="font-mono-data text-[#003087] font-semibold">
                    {new Intl.NumberFormat('fr-FR').format(priceRange[1])} FCFA
                  </span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 mb-5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-gray-600">Documents vérifiés</span>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      verifiedOnly ? 'bg-[#00A651]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      verifiedOnly ? 'left-5.5' : 'left-0.5'
                    }`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-gray-600">GeoTrust certifié</span>
                  <button
                    onClick={() => setGeoTrustOnly(!geoTrustOnly)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      geoTrustOnly ? 'bg-[#00A651]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      geoTrustOnly ? 'left-5.5' : 'left-0.5'
                    }`} />
                  </button>
                </label>
              </div>

              {/* Reset */}
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedCountry('all');
                  setSelectedCity('all');
                  setPriceRange([0, 200000000]);
                  setVerifiedOnly(false);
                  setGeoTrustOnly(false);
                }}
                className="w-full py-2 text-xs font-medium text-[#003087] hover:bg-[#003087]/5 rounded-xl transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </motion.aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort & View Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs px-3 py-2 rounded-full border bg-white outline-none"
                >
                  <option value="recent">Plus récents</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="popular">Plus populaires</option>
                </select>
              </div>
              <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-4'
              }>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SearchCardSkeleton key={i} compact={viewMode === 'list'} />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-gray-400 mb-2">Erreur de chargement</h3>
                <p className="text-sm text-gray-400">Impossible de charger les résultats. Veuillez réessayer.</p>
              </div>
            )}

            {/* Grid/List */}
            {!isLoading && !isError && (
              <AnimatePresence mode="wait">
                {properties.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-20"
                  >
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="font-display text-xl font-bold text-gray-400 mb-2">Aucun bien trouvé</h3>
                    <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={viewMode === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                      : 'space-y-4'
                    }
                  >
                    {properties.map((property, i) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        index={i}
                        onSelect={onSelectProperty}
                        compact={viewMode === 'list'}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
