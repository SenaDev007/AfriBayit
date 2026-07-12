// P3.7-2 — List view: search/filter bar, active filter badges, states,
// hotels grid (HotelCard), and pagination.

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Globe,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { COUNTRY_NAMES } from '@/lib/constants';
import { HotelCardSkeleton, StarFilter, fmtPrice } from './utils';
import HotelCard from './HotelCard';
import type { HotelApiItem, HotelPagination } from './types';

interface HotelListProps {
  // filter state
  searchCity: string;
  setSearchCity: (v: string) => void;
  filterStars: number;
  setFilterStars: (v: number) => void;
  filterAvailable: boolean;
  setFilterAvailable: (v: boolean) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  page: number;
  setPage: (v: number) => void;
  cities: string[];
  selectedCountry: string;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  // data
  hotels: HotelApiItem[];
  pagination?: HotelPagination;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  // handlers
  onSelectHotel: (hotelId: string) => void;
  onOpenBooking: (hotelId: string) => void;
}

export default function HotelList(props: HotelListProps) {
  const {
    searchCity,
    setSearchCity,
    filterStars,
    setFilterStars,
    filterAvailable,
    setFilterAvailable,
    priceRange,
    setPriceRange,
    showFilters,
    setShowFilters,
    page,
    setPage,
    cities,
    selectedCountry,
    hasActiveFilters,
    onResetFilters,
    hotels,
    pagination,
    isLoading,
    isError,
    errorMessage,
    onSelectHotel,
    onOpenBooking,
  } = props;

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* City Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={searchCity}
              onChange={(e) => {
                setSearchCity(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-[#D4AF37] transition-colors appearance-none"
            >
              <option value="">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Star Filter */}
          <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Étoiles:</span>
            <StarFilter
              value={filterStars}
              onChange={(v) => {
                setFilterStars(v);
                setPage(1);
              }}
            />
          </div>

          {/* Available Toggle */}
          <button
            onClick={() => {
              setFilterAvailable(!filterAvailable);
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
              filterAvailable
                ? 'bg-[#00A651]/10 border-[#00A651]/30 text-[#00A651]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5 inline mr-1.5" />
            Disponibles
          </button>

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
              showFilters
                ? 'bg-[#003087]/10 border-[#003087]/30 text-[#003087]'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1.5" />
            Filtres
          </button>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-gray-100 space-y-4">
                {/* Price Range */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-2 block">
                    Prix par nuit (FCFA) : {fmtPrice(priceRange[0])} — {fmtPrice(priceRange[1])}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={500000}
                      step={5000}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="flex-1 accent-[#D4AF37]"
                    />
                    <input
                      type="range"
                      min={0}
                      max={500000}
                      step={5000}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="flex-1 accent-[#D4AF37]"
                    />
                  </div>
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                  <button
                    onClick={onResetFilters}
                    className="text-xs text-[#003087] font-medium hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Réinitialiser les filtres
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Badges & Country */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#003087]/10 text-[#003087] text-xs font-semibold">
          <Globe className="w-3 h-3" /> {COUNTRY_NAMES[selectedCountry] || selectedCountry}
        </span>
        {searchCity && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#009CDE]/10 text-[#009CDE] text-xs font-semibold">
            <MapPin className="w-3 h-3" /> {searchCity}
            <button
              onClick={() => {
                setSearchCity('');
                setPage(1);
              }}
              className="ml-0.5 hover:text-[#003087]"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {filterStars > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold">
            <Star className="w-3 h-3 fill-[#D4AF37]" /> {filterStars} étoile{filterStars > 1 ? 's' : ''}
            <button
              onClick={() => {
                setFilterStars(0);
                setPage(1);
              }}
              className="ml-0.5 hover:text-[#0a2a5e]"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {filterAvailable && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00A651]/10 text-[#00A651] text-xs font-semibold">
            <CheckCircle className="w-3 h-3" /> Disponible
            <button
              onClick={() => {
                setFilterAvailable(false);
                setPage(1);
              }}
              className="ml-0.5 hover:text-[#0a2a5e]"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {pagination && (
          <span className="text-xs text-gray-400 ml-auto">
            {pagination.total} hôtel{pagination.total !== 1 ? 's' : ''} trouvé{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <HotelCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-red-50 mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#0a2a5e] mb-2">Impossible de charger les hôtels</h3>
          <p className="text-sm text-gray-500">
            {errorMessage || 'Une erreur est survenue. Veuillez réessayer.'}
          </p>
          <button
            onClick={onResetFilters}
            className="mt-4 px-5 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && hotels.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-[#D4AF37]/10 mb-4">
            <Building2 className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0a2a5e] mb-2">
            {hasActiveFilters ? 'Aucun hôtel ne correspond à vos critères' : 'Aucun hôtel disponible dans ce pays'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {hasActiveFilters
              ? 'Essayez de modifier vos filtres ou votre recherche pour trouver plus d\'options.'
              : 'Les hôtels de cette région seront bientôt disponibles. En attendant, explorez d\'autres pays.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-5 py-2.5 bg-[#D4AF37] text-white rounded-lg text-sm font-semibold hover:bg-[#b8961f] transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Hotels Grid */}
      {!isLoading && !isError && hotels.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel, i) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              index={i}
              onSelect={onSelectHotel}
              onBook={onOpenBooking}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {Array.from({ length: pagination.pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                page === i + 1
                  ? 'bg-[#003087] text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(Math.min(pagination.pages, page + 1))}
            disabled={page === pagination.pages}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}
