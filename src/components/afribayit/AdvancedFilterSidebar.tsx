'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiFetch } from '@/lib/api';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { toast } from 'sonner';
import {
  X, SlidersHorizontal, MapPin, Building2, Home, Waves,
  TreePine, Car, Snowflake, Shield, Sofa, Star, Globe,
  Search, BookmarkPlus, Bell, Mic, MessageCircle, Sparkles,
  ChevronDown, Check
} from 'lucide-react';
import {
  SearchFilters,
  PROPERTY_TYPE_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  SORT_OPTIONS,
  countActiveFilters,
} from '@/lib/search/filters';
import VoiceSearchButton from './VoiceSearchButton';

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

// Extended amenities list per CDC §5.1.1
const AMENITY_OPTIONS: { key: string; label: string; icon: React.ReactNode }[] = [
  { key: 'hasPool', label: 'Piscine', icon: <Waves className="w-3 h-3" /> },
  { key: 'hasGarden', label: 'Jardin', icon: <TreePine className="w-3 h-3" /> },
  { key: 'hasGarage', label: 'Garage', icon: <Car className="w-3 h-3" /> },
  { key: 'hasAirCon', label: 'Climatisation', icon: <Snowflake className="w-3 h-3" /> },
  { key: 'hasSecurity', label: 'Sécurité', icon: <Shield className="w-3 h-3" /> },
  { key: 'furnished', label: 'Meublé', icon: <Sofa className="w-3 h-3" /> },
  { key: 'hasTerrace', label: 'Terrasse', icon: <Home className="w-3 h-3" /> },
  { key: 'hasGenerator', label: 'Groupe électrogène', icon: <Star className="w-3 h-3" /> },
  { key: 'hasWifi', label: 'Wi-Fi', icon: <Globe className="w-3 h-3" /> },
  { key: 'hasParking', label: 'Parking', icon: <Car className="w-3 h-3" /> },
  { key: 'hasElevator', label: 'Ascenseur', icon: <Building2 className="w-3 h-3" /> },
  { key: 'hasStorage', label: 'Cave/Storage', icon: <Home className="w-3 h-3" /> },
];

// Neighborhood criteria
const NEIGHBORHOOD_OPTIONS = [
  { key: 'walkable', label: 'Marche aisée', icon: <MapPin className="w-3 h-3" /> },
  { key: 'schools', label: 'Prox. écoles', icon: <Building2 className="w-3 h-3" /> },
  { key: 'transport', label: 'Transport', icon: <Car className="w-3 h-3" /> },
  { key: 'quiet', label: 'Quartier calme', icon: <TreePine className="w-3 h-3" /> },
  { key: 'commercial', label: 'Zone commerciale', icon: <Home className="w-3 h-3" /> },
];

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
    size: true,
    features: false,
    neighborhood: false,
    quality: false,
    investment: false,
    sort: false,
    saved: false,
    alerts: false,
    ai: false,
  });

  const [savedSearchName, setSavedSearchName] = useState('');
  const [alertPrice, setAlertPrice] = useState<number | ''>('');
  const [aiQuery, setAiQuery] = useState('');
  const [showAiSearch, setShowAiSearch] = useState(false);

  const queryClient = useQueryClient();

  // Saved searches
  const { data: savedSearchesData } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => apiFetch<{ searches: Array<{ id: string; name: string; filters: SearchFilters; newMatches?: number }> }>('/api/properties/saved-searches'),
  });

  const saveSearchMutation = useMutation({
    mutationFn: (data: { name: string; filters: SearchFilters }) =>
      apiPost('/api/properties/saved-searches', data),
    onSuccess: () => {
      toast.success('Recherche sauvegardée');
      setSavedSearchName('');
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });

  // Price alerts
  const alertMutation = useMutation({
    mutationFn: (data: { filters: SearchFilters; targetPrice: number }) =>
      apiPost('/api/properties/alerts', { ...data.filters, priceMax: data.targetPrice }),
    onSuccess: () => {
      toast.success('Alerte de prix créée');
      setAlertPrice('');
    },
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

  const toggleAmenity = (key: string) => {
    updateFilter(key as keyof SearchFilters, !filters[key as keyof SearchFilters]);
  };

  const resetFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy,
      page: 1,
      limit: filters.limit,
    });
  };

  const allCities = facets?.cities?.map(c => c.value) || COUNTRIES_CONFIG.flatMap(c => c.cities);

  const handleSaveSearch = () => {
    if (!savedSearchName.trim()) return;
    saveSearchMutation.mutate({ name: savedSearchName, filters });
  };

  const handleCreateAlert = () => {
    if (!alertPrice) return;
    alertMutation.mutate({ filters, targetPrice: Number(alertPrice) });
  };

  const handleAiSearch = () => {
    if (!aiQuery.trim()) return;
    // Convert AI query to search filters
    onFiltersChange({
      ...filters,
      query: aiQuery,
      page: 1,
    });
    setShowAiSearch(false);
    toast.success('Recherche IA appliquée');
  };

  const handleVoiceTranscript = (text: string) => {
    onFiltersChange({
      ...filters,
      query: text,
      page: 1,
    });
  };

  const savedSearches = savedSearchesData?.searches || [];

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
              <SlidersHorizontal className="w-4 h-4 text-[#003087]" />
              <h3 className="font-semibold text-sm text-[#2C2E2F]">Filtres avancés</h3>
              {activeCount > 0 && (
                <span className="px-2 py-0.5 bg-[#003087] text-white text-[10px] font-bold rounded-full">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {activeCount > 0 && (
                <button onClick={resetFilters} className="text-[10px] text-[#003087] hover:underline">
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

          {/* Voice Search + AI Search Buttons */}
          <div className="flex gap-2 mb-4">
            <VoiceSearchButton onTranscript={handleVoiceTranscript} currentQuery={filters.query} />
            <button
              onClick={() => setShowAiSearch(!showAiSearch)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-xs font-medium hover:bg-[#D4AF37]/20 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> IA
            </button>
          </div>

          {/* AI Conversational Search */}
          <AnimatePresence>
            {showAiSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-[10px] font-semibold text-[#D4AF37]">Recherche conversationnelle IA</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">
                    Décrivez votre bien idéal en langage naturel...
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                      placeholder="Ex: Villa 3 chambres avec piscine à Cotonou sous 20M"
                      className="flex-1 text-xs px-3 py-2 rounded-lg border bg-white outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      onClick={handleAiSearch}
                      className="px-3 py-2 bg-[#D4AF37] text-white rounded-lg text-xs font-semibold hover:bg-[#c4a030]"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location Section */}
          <FilterSection
            title="Localisation"
            icon={<MapPin className="w-3.5 h-3.5" />}
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
            icon={<Building2 className="w-3.5 h-3.5" />}
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

          {/* Property Type - All 7 types */}
          <FilterSection
            title="Type de bien"
            icon={<Home className="w-3.5 h-3.5" />}
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

          {/* Price Range */}
          <FilterSection
            title="Budget"
            icon={<Star className="w-3.5 h-3.5" />}
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
              {/* Quick price ranges */}
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '< 5M', min: undefined, max: 5000000 },
                  { label: '5-15M', min: 5000000, max: 15000000 },
                  { label: '15-30M', min: 15000000, max: 30000000 },
                  { label: '30-50M', min: 30000000, max: 50000000 },
                  { label: '> 50M', min: 50000000, max: undefined },
                ].map(range => (
                  <button
                    key={range.label}
                    onClick={() => {
                      onFiltersChange({ ...filters, priceMin: range.min, priceMax: range.max, page: 1 });
                    }}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                      filters.priceMin === range.min && filters.priceMax === range.max
                        ? 'bg-[#003087] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Size & Rooms */}
          <FilterSection
            title="Surface & Pièces"
            icon={<Home className="w-3.5 h-3.5" />}
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Ch. min</label>
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
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Pièces min</label>
                  <input
                    type="number"
                    value={filters.roomsMin || ''}
                    onChange={(e) => updateFilter('roomsMin', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    min={0}
                    className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Equipment/Amenities - Extended */}
          <FilterSection
            title="Équipements"
            icon={<Sofa className="w-3.5 h-3.5" />}
            expanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
          >
            <div className="space-y-2">
              {AMENITY_OPTIONS.map(({ key, label, icon }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    {icon} {label}
                  </span>
                  <button
                    onClick={() => toggleAmenity(key)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      filters[key as keyof SearchFilters] ? 'bg-[#00A651]' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                      filters[key as keyof SearchFilters] ? 'left-4.5' : 'left-0.5'
                    }`} />
                  </button>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Neighborhood Analysis */}
          <FilterSection
            title="Quartier"
            icon={<MapPin className="w-3.5 h-3.5" />}
            expanded={expandedSections.neighborhood}
            onToggle={() => toggleSection('neighborhood')}
          >
            <div className="space-y-2">
              {NEIGHBORHOOD_OPTIONS.map(({ key, label, icon }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                  <input type="checkbox" className="rounded border-gray-300 text-[#003087]" />
                  <span className="flex items-center gap-1.5 text-xs text-gray-600">
                    {icon} {label}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Sort Options */}
          <FilterSection
            title="Tri"
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            expanded={expandedSections.sort}
            onToggle={() => toggleSection('sort')}
          >
            <div className="space-y-1.5">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateFilter('sortBy', opt.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                    filters.sortBy === opt.value
                      ? 'bg-[#003087]/5 text-[#003087] font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.sortBy === opt.value && <Check className="w-3.5 h-3.5 text-[#003087]" />}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Quality */}
          <FilterSection
            title="Qualité"
            icon={<Shield className="w-3.5 h-3.5" />}
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
            icon={<Star className="w-3.5 h-3.5" />}
            expanded={expandedSections.investment}
            onToggle={() => toggleSection('investment')}
          >
            <div className="space-y-3">
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
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">ROI min (%)</label>
                <input
                  type="number"
                  value={filters.roiMin || ''}
                  onChange={(e) => updateFilter('roiMin', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                  min={0}
                  className="w-full text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                />
              </div>
            </div>
          </FilterSection>

          {/* Saved Searches */}
          <FilterSection
            title="Recherches sauvegardées"
            icon={<BookmarkPlus className="w-3.5 h-3.5" />}
            expanded={expandedSections.saved}
            onToggle={() => toggleSection('saved')}
          >
            <div className="space-y-3">
              {/* Save current search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={savedSearchName}
                  onChange={(e) => setSavedSearchName(e.target.value)}
                  placeholder="Nom de la recherche..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                />
                <button
                  onClick={handleSaveSearch}
                  disabled={!savedSearchName.trim() || saveSearchMutation.isPending}
                  className="px-3 py-2 bg-[#003087] text-white rounded-xl text-xs font-semibold hover:bg-[#0047b3] disabled:opacity-50"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Saved searches list */}
              {savedSearches.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {savedSearches.map(search => (
                    <button
                      key={search.id}
                      onClick={() => onFiltersChange({ ...search.filters, page: 1 })}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-700 font-medium truncate">{search.name}</span>
                      {search.newMatches && search.newMatches > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#D4AF37] text-white text-[9px] font-bold rounded-full">
                          {search.newMatches}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FilterSection>

          {/* Price Alerts */}
          <FilterSection
            title="Alertes de prix"
            icon={<Bell className="w-3.5 h-3.5" />}
            expanded={expandedSections.alerts}
            onToggle={() => toggleSection('alerts')}
          >
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500">
                Soyez notifié quand un bien correspondant à vos critères est en dessous de ce prix.
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Prix max (FCFA)"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border bg-gray-50 outline-none focus:border-[#003087]"
                />
                <button
                  onClick={handleCreateAlert}
                  disabled={!alertPrice || alertMutation.isPending}
                  className="px-3 py-2 bg-[#D4AF37] text-white rounded-xl text-xs font-semibold hover:bg-[#c4a030] disabled:opacity-50"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>
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
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
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
        <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2C2E2F]">
          {icon} {title}
        </span>
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
