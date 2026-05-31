'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { X } from 'lucide-react';

import {  SearchFilters,
  PROPERTY_TYPE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  countActiveFilters,
} from '@/lib/search/filters';

interface AdvancedFilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  facets?: {
    types: { value: string; count: number }[];
    transactions: { value: string; count: number }[];
    countries: { value: string; count: number }[];
    cities: { value: string; count: number }[];
    priceRange: { min: number; max: number };
  };
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdvancedFilterSidebar({
  filters,
  onFiltersChange,
  facets,
  isOpen,
  onToggle,
}: AdvancedFilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: true,
    type: true,
    price: true,
    size: false,
    features: false,
    quality: false,
    investment: false,
  });

  const activeCount = countActiveFilters(filters);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const toggleType = (type: string) => {
    const current = filters.type || [];
    const next = current.includes(type as never)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilter('type', next.length > 0 ? next : undefined);
  };

  const toggleTransaction = (t: string) => {
    const current = filters.transaction || [];
    const next = current.includes(t as never)
      ? current.filter(x => x !== t)
      : [...current, t];
    updateFilter('transaction', next.length > 0 ? next : undefined);
  };

  const resetFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy,
      page: 1,
      limit: filters.limit,
    });
  };

  const allCities = facets?.cities?.map(c => c.value) || COUNTRIES_CONFIG.flatMap(c => c.cities);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${
          isOpen ? 'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto' : 'hidden'
        } lg:block w-full lg:w-80 shrink-0 overflow-y-auto`}
      >
        <div className="bg-white rounded-3xl p-5 shadow-sm border min-h-[calc(100vh-8rem)] lg:min-h-0 lg:sticky lg:top-24 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-[#2C2E2F]">Filtres avancés</h3>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 bg-[#003087] text-white text-[10px] font-bold rounded-full">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {activeCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-[#003087] hover:underline"
                >
                  Réinitialiser
                </button>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Location Section */}
          <FilterSection
            title="Localisation"
            expanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Pays</label>
                <select
                  value={filters.country || ''}
                  onChange={(e) => updateFilter('country', e.target.value || undefined)}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                >
                  <option value="">Tous les pays</option>
                  {COUNTRIES_CONFIG.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Ville</label>
                <select
                  value={filters.city || ''}
                  onChange={(e) => updateFilter('city', e.target.value || undefined)}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                >
                  <option value="">Toutes les villes</option>
                  {allCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 mb-1 block">Quartier</label>
                <input
                  type="text"
                  value={filters.quartier || ''}
                  onChange={(e) => updateFilter('quartier', e.target.value || undefined)}
                  placeholder="Ex: Ganhi, Cocody..."
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                />
              </div>
            </div>
          </FilterSection>

          {/* Transaction Type */}
          <FilterSection
            title="Transaction"
            expanded={expandedSections.type}
            onToggle={() => toggleSection('type')}
          >
            <div className="flex flex-wrap gap-1.5">
              {TRANSACTION_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleTransaction(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    filters.transaction?.includes(opt.value)
                      ? 'bg-[#003087] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                  {facets?.transactions && (
                    <span className="ml-1 opacity-60">
                      ({facets.transactions.find(f => f.value === opt.value)?.count || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Property Type */}
          <FilterSection
            title="Type de bien"
            expanded={expandedSections.type}
            onToggle={() => toggleSection('type')}
          >
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleType(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                    filters.type?.includes(opt.value)
                      ? 'bg-[#003087] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                  {facets?.types && (
                    <span className="ml-1 opacity-60">
                      ({facets.types.find(f => f.value === opt.value)?.count || 0})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Price */}
          <FilterSection
            title="Budget"
            expanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Min (FCFA)</label>
                  <input
                    type="number"
                    value={filters.priceMin || ''}
                    onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Max (FCFA)</label>
                  <input
                    type="number"
                    value={filters.priceMax || ''}
                    onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Illimité"
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Size & Rooms */}
          <FilterSection
            title="Surface & Pièces"
            expanded={expandedSections.size}
            onToggle={() => toggleSection('size')}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Surface min (m²)</label>
                  <input
                    type="number"
                    value={filters.surfaceMin || ''}
                    onChange={(e) => updateFilter('surfaceMin', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Surface max (m²)</label>
                  <input
                    type="number"
                    value={filters.surfaceMax || ''}
                    onChange={(e) => updateFilter('surfaceMax', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Illimité"
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Chambres min</label>
                  <input
                    type="number"
                    value={filters.bedroomsMin || ''}
                    onChange={(e) => updateFilter('bedroomsMin', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    min={0}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">SDB min</label>
                  <input
                    type="number"
                    value={filters.bathroomsMin || ''}
                    onChange={(e) => updateFilter('bathroomsMin', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    min={0}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Features */}
          <FilterSection
            title="Équipements"
            expanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
          >
            <div className="space-y-2">
              {([
                ['hasPool', 'Piscine'],
                ['hasGarden', 'Jardin'],
                ['hasGarage', 'Garage'],
                ['hasAirCon', 'Climatisation'],
                ['hasSecurity', 'Sécurité'],
                ['furnished', 'Meublé'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-600">{label}</span>
                  <button
                    onClick={() => updateFilter(key, !filters[key])}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      filters[key] ? 'bg-[#00A651]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      filters[key] ? 'left-4.5' : 'left-0.5'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Quality */}
          <FilterSection
            title="Qualité"
            expanded={expandedSections.quality}
            onToggle={() => toggleSection('quality')}
          >
            <div className="space-y-2">
              {([
                ['verified', 'Documents vérifiés'],
                ['geoTrust', 'GeoTrust certifié'],
                ['premium', 'Premium'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-gray-600">{label}</span>
                  <button
                    onClick={() => updateFilter(key, !filters[key])}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      filters[key] ? 'bg-[#00A651]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      filters[key] ? 'left-4.5' : 'left-0.5'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Investment */}
          <FilterSection
            title="Investissement"
            expanded={expandedSections.investment}
            onToggle={() => toggleSection('investment')}
          >
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Score d&apos;investissement min</label>
              <input
                type="number"
                value={filters.investmentScoreMin || ''}
                onChange={(e) => updateFilter('investmentScoreMin', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0-100"
                min={0}
                max={100}
                className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
              />
            </div>
          </FilterSection>

          {/* Apply button (mobile) */}
          <div className="lg:hidden mt-6">
            <button
              onClick={onToggle}
              className="w-full py-3 bg-[#003087] text-white text-sm font-semibold rounded-xl hover:bg-[#0047b3] transition-colors"
            >
              Appliquer les filtres {activeCount > 0 && `(${activeCount})`}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 border-b border-gray-100 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs font-semibold text-[#2C2E2F]">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
