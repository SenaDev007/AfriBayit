'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiFetch } from '@/lib/api';
import { formatPrice, getPropertyTypeLabel } from '@/lib/afribayit-utils';
import type { SearchFilters, SortOption } from '@/lib/search/filters';
import { SORT_OPTIONS, countActiveFilters, getFilterChipLabel } from '@/lib/search/filters';
import PropertyCard from './PropertyCard';
import PropertyMap from './PropertyMap';
import AdvancedFilterSidebar from './AdvancedFilterSidebar';
import PropertyComparator from './PropertyComparator';
import FinancingSimulator from './FinancingSimulator';
import type { PropertyData } from '@/lib/afribayit-utils';
import { Check, Coins } from 'lucide-react';

interface EnhancedSearchResultsProps {
  initialTab?: string;
  onSelectProperty: (id: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

interface SearchResponse {
  properties: PropertyData[];
  pagination: { page: number; limit: number; total: number; pages: number };
  facets: {
    types: { value: string; count: number }[];
    transactions: { value: string; count: number }[];
    countries: { value: string; count: number }[];
    cities: { value: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

interface CompareResponse {
  properties: PropertyData[];
  bestValues: {
    lowestPrice: number;
    highestScore: number;
    largestSurface: number;
    bestPricePerSqm: number;
  };
}

function SearchCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex gap-4 p-4 rounded-3xl bg-white border">
        <div className="w-40 h-28 rounded-xl shrink-0 bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-20 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
          <div className="h-6 w-1/3 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl bg-white border overflow-hidden">
      <div className="aspect-[4/3] w-full bg-gray-200 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-4 w-8 rounded-full bg-gray-200 animate-pulse" />
        </div>
        <div className="h-5 w-3/4 bg-gray-200 animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
          <div className="h-3 w-12 bg-gray-200 animate-pulse rounded" />
        </div>
        <div className="pt-3 border-t border-gray-100">
          <div className="h-6 w-1/2 bg-gray-200 animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
}

export default function EnhancedSearchResults({ initialTab = 'achat', onSelectProperty }: EnhancedSearchResultsProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    transaction: [initialTab as SearchFilters['transaction'] extends (infer T)[] ? T : never],
    sortBy: 'newest',
    page: 1,
    limit: 24,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparator, setShowComparator] = useState(false);
  const [showFinancing, setShowFinancing] = useState(false);
  const [financingPrice, setFinancingPrice] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Search query
  const { data, isLoading, isError } = useQuery<SearchResponse>({
    queryKey: ['advancedSearch', filters],
    queryFn: () => apiPost<SearchResponse>('/api/properties/search', filters),
  });

  const properties = data?.properties || [];
  const totalResults = data?.pagination?.total || 0;
  const facets = data?.facets;
  const pagination = data?.pagination;

  // Compare query
  const { data: compareData } = useQuery<CompareResponse>({
    queryKey: ['compareProperties', compareIds],
    queryFn: () => apiPost<CompareResponse>('/api/properties/compare', { ids: compareIds }),
    enabled: compareIds.length >= 2,
  });

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  // Build filter chips
  const filterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    const entries = Object.entries(filters) as [string, unknown][];
    for (const [key, value] of entries) {
      if (value !== undefined && value !== '' && key !== 'sortBy' && key !== 'page' && key !== 'limit') {
        chips.push({ key, label: getFilterChipLabel(key, value) });
      }
    }
    return chips;
  }, [filters]);

  const removeFilterChip = (key: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete (next as Record<string, unknown>)[key];
      return { ...next, page: 1 };
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, query: searchQuery || undefined, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as SortOption, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMapBoundsChange = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    setFilters(prev => ({ ...prev, bounds, page: 1 }));
  }, []);

  const openFinancing = (price: number) => {
    setFinancingPrice(price);
    setShowFinancing(true);
  };

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
            <div className="flex gap-2">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-medium border shadow-sm hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtres
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#003087] text-white text-[10px] font-bold rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 p-2 bg-white rounded-2xl shadow-sm border">
            <div className="flex-1 flex items-center gap-3 px-4 py-2">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Rechercher par ville, quartier, mot-clé..."
                className="flex-1 text-sm outline-none bg-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors"
            >
              Rechercher
            </button>
          </div>

          {/* Filter Chips */}
          {filterChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {filterChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => removeFilterChip(chip.key)}
                  className="flex items-center gap-1 px-3 py-1 bg-[#003087]/5 text-[#003087] text-[11px] font-medium rounded-full hover:bg-[#003087]/10 transition-colors"
                >
                  {chip.label}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              <button
                onClick={() => setFilters({ sortBy: 'newest', page: 1, limit: 24 })}
                className="px-3 py-1 text-[11px] text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <AdvancedFilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            facets={facets}
            isOpen={filtersOpen}
            onToggle={() => setFiltersOpen(!filtersOpen)}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort & View Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <select
                  value={filters.sortBy || 'newest'}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="text-xs px-3 py-2 rounded-full border bg-white outline-none"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="Grille"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  title="Liste"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-full transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm' : ''}`}
                  title="Carte"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="mb-6">
                <PropertyMap
                  properties={properties}
                  onPropertyClick={onSelectProperty}
                  onBoundsChange={handleMapBoundsChange}
                  selectedCountry={filters.country}
                  className="h-[500px]"
                />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className={viewMode === 'list'
                ? 'space-y-4'
                : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
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
                    className={viewMode === 'list'
                      ? 'space-y-4'
                      : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                    }
                  >
                    {properties.map((property, i) => (
                      <div key={property.id} className="relative">
                        <PropertyCard
                          property={property}
                          index={i}
                          onSelect={onSelectProperty}
                          compact={viewMode === 'list'}
                        />
                        {/* Compare checkbox */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCompare(property.id); }}
                          className={`absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            compareIds.includes(property.id)
                              ? 'bg-[#D4AF37] text-white'
                              : 'bg-white/90 text-gray-400 hover:text-[#D4AF37] border'
                          }`}
                          title="Ajouter à la comparaison"
                        >
                          {compareIds.includes(property.id) ? '<Check className="w-4 h-4" />' : '+'}
                        </button>
                        {/* Financing button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); openFinancing(property.price); }}
                          className="absolute bottom-4 right-4 z-10 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-medium text-[#003087] hover:bg-white transition-colors shadow-sm border"
                        >
                          <Coins className="w-4 h-4" /> Simuler
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-white border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Précédent
                </button>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  const pageNum = pagination.page <= 3 ? i + 1 : pagination.page - 2 + i;
                  if (pageNum > pagination.pages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-medium transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-[#003087] text-white'
                          : 'bg-white border hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-white border hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Bar (sticky bottom when properties selected) */}
      <AnimatePresence>
        {compareIds.length > 0 && !showComparator && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3"
          >
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#2C2E2F]">
                  {compareIds.length} bien{compareIds.length !== 1 ? 's' : ''} sélectionné{compareIds.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-1">
                  {compareIds.slice(0, 5).map(id => {
                    const prop = properties.find(p => p.id === id);
                    return (
                      <span key={id} className="px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-medium rounded-full">
                        {prop?.title?.slice(0, 15) || '...'}...
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompareIds([])}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => setShowComparator(true)}
                  disabled={compareIds.length < 2}
                  className="px-4 py-1.5 bg-[#D4AF37] text-white text-xs font-semibold rounded-xl hover:bg-[#c9a02e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Comparer ({compareIds.length})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparator Modal */}
      <AnimatePresence>
        {showComparator && compareData && (
          <PropertyComparator
            properties={compareData.properties as never}
            bestValues={compareData.bestValues}
            onRemoveProperty={(id) => {
              setCompareIds(prev => prev.filter(x => x !== id));
              if (compareIds.length <= 2) setShowComparator(false);
            }}
            onViewProperty={(id) => {
              setShowComparator(false);
              onSelectProperty(id);
            }}
            onClose={() => setShowComparator(false)}
          />
        )}
      </AnimatePresence>

      {/* Financing Simulator Modal */}
      <AnimatePresence>
        {showFinancing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-8"
            onClick={() => setShowFinancing(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-[900px]"
              onClick={(e) => e.stopPropagation()}
            >
              <FinancingSimulator
                propertyPrice={financingPrice}
                country={filters.country || 'BJ'}
                onClose={() => setShowFinancing(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
