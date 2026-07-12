'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Coins,
  Filter,
  Home,
  MapPin,
  Plus,
  Search,
  Star,
  X,
  XCircle,
  Bed,
} from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { easeOut, certificationFilterOptions } from './constants';
import { getFirstImage, getPriceRange, formatPrice } from './utils';
import { ListingCardSkeleton, CertificationBadge } from './Skeletons';
import type { GuesthouseListItem } from './types';

interface ListingsPanelProps {
  guesthousesList: GuesthouseListItem[];
  listLoading: boolean;
  listError: boolean;
  listErrorObj: unknown;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  certFilter: string;
  setCertFilter: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  onNavigate?: (section: string) => void;
  onSelectGuesthouse: (id: string) => void;
}

export default function ListingsPanel({
  guesthousesList,
  listLoading,
  listError,
  listErrorObj,
  searchQuery,
  setSearchQuery,
  certFilter,
  setCertFilter,
  showFilters,
  setShowFilters,
  onNavigate,
  onSelectGuesthouse,
}: ListingsPanelProps) {
  return (
    <motion.div
      key="listings"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville ou pays..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
              showFilters || certFilter !== 'all' ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" /> Filtres
            {certFilter !== 'all' && <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />}
          </button>
          <button
            onClick={() => onNavigate?.('publish')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00A651] text-white rounded-lg text-sm font-semibold hover:bg-[#008f47] transition-colors"
          >
            <Plus className="w-4 h-4" /> Publier une guesthouse
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-white rounded-2xl p-4 border shadow-sm flex flex-wrap gap-3 items-center">
              <span className="text-xs text-gray-500 font-medium">Certification:</span>
              {certificationFilterOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setCertFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    certFilter === opt.value
                      ? 'bg-[#003087] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="flex-1" />
              <span className="text-xs text-gray-400">{guesthousesList.length} résultat{guesthousesList.length !== 1 ? 's' : ''}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {listLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {listError && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-red-50 mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#0a2a5e] mb-2">Impossible de charger les guesthouses</h3>
          <p className="text-sm text-gray-500">{(listErrorObj as Error)?.message || 'Une erreur est survenue. Veuillez réessayer.'}</p>
        </div>
      )}

      {/* Empty State - Functional CTA instead of "coming soon" */}
      {!listLoading && !listError && guesthousesList.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-[#003087]/5 mb-6">
            <Home className="w-10 h-10 text-[#003087]/40" />
          </div>
          <h3 className="text-xl font-display font-bold text-[#0a2a5e] mb-2">
            {searchQuery || certFilter !== 'all'
              ? 'Aucune guesthouse ne correspond à votre recherche'
              : 'Aucune guesthouse disponible dans ce pays'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
            {searchQuery || certFilter !== 'all'
              ? 'Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.'
              : 'Soyez le premier à publier une maison d\'hôtes certifiée AfriBayit dans cette région.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {(searchQuery || certFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setCertFilter('all'); }}
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" /> Réinitialiser les filtres
              </button>
            )}
            <button
              onClick={() => onNavigate?.('publish')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A651] text-white rounded-lg text-sm font-semibold hover:bg-[#008f47] transition-colors shadow-lg shadow-[#00A651]/20"
            >
              <Plus className="w-4 h-4" /> Publier une guesthouse
            </button>
          </div>

          {/* How it works mini section */}
          <div className="mt-12 max-w-2xl mx-auto">
            <h4 className="text-sm font-semibold text-[#0a2a5e] mb-4">Comment ça marche ?</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <ClipboardList className="w-5 h-5" />, title: 'Inscrivez votre guesthouse', desc: 'Ajoutez vos informations, photos et chambres' },
                { icon: <Search className="w-5 h-5" />, title: 'Obtenez la certification', desc: 'Inspection qualité AfriBayit pour rassurer vos clients' },
                { icon: <Coins className="w-5 h-5" />, title: 'Recevez des réservations', desc: 'Gestion complète avec paiement sécurisé via AfriBayit' },
              ].map((step, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border shadow-sm text-center">
                  <div className="w-10 h-10 rounded-lg bg-[#003087]/5 flex items-center justify-center mx-auto mb-3 text-[#003087]">
                    {step.icon}
                  </div>
                  <p className="text-xs font-semibold text-[#0a2a5e] mb-1">{step.title}</p>
                  <p className="text-[10px] text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Data - Guesthouse Listing Grid */}
      {!listLoading && !listError && guesthousesList.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {guesthousesList.map((gh, i) => {
              const image = getFirstImage(gh.images);
              const { min, max } = getPriceRange(gh);
              const priceLabel = min === max
                ? `${formatPrice(min)} FCFA`
                : `${formatPrice(min)} – ${formatPrice(max)} FCFA`;
              return (
                <motion.div
                  key={gh.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, ease: easeOut }}
                  whileHover={{ y: -4 }}
                  onClick={() => onSelectGuesthouse(gh.id)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border group cursor-pointer"
                >
                  <div className="relative aspect-[16/10]">
                    {image ? (
                      <ImageWithFallback src={image} alt={gh.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" fallbackType="guesthouse" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <CertificationBadge status={gh.certificationStatus} />
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-mono flex items-center gap-1">
                      <Bed className="w-3 h-3" /> {(gh.rooms?.length || 0)} chambre{(gh.rooms?.length || 0) > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base font-bold text-[#0a2a5e] group-hover:text-[#003087] transition-colors">
                      {gh.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {gh.city}, {gh.country}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                        {gh.overallRating > 0 ? `${gh.overallRating} (${gh.reviewCount})` : 'Nouveau'}
                      </span>
                      <span>À partir de <span className="font-mono font-bold text-[#D4AF37]">{priceLabel}</span></span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Results count footer */}
          <div className="text-center mt-6 text-xs text-gray-400">
            {guesthousesList.length} guesthouse{guesthousesList.length !== 1 ? 's' : ''} trouvée{guesthousesList.length !== 1 ? 's' : ''}
            {searchQuery && <> pour &laquo;{searchQuery}&raquo;</>}
          </div>
        </>
      )}
    </motion.div>
  );
}
