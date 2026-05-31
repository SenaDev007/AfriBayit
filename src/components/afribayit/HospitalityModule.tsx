'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHotelsFiltered, useHotel, useHotelRooms, useHotelReviews, useCreateHotelBooking } from '@/hooks/useHotels';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { COUNTRIES_CONFIG, timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Hotel,
  Star,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Waves,
  UtensilsCrossed,
  Wind,
  Dumbbell,
  Coffee,
  Tv,
  Lock,
  Phone,
  CalendarDays,
  Users,
  BedDouble,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Building2,
  Globe,
  CircleDot,
} from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

// ── API response types ──
interface HotelApiItem {
  id: string;
  name: string;
  slug?: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  currency: string;
  amenities: string | null;
  images: string | null;
  available: boolean;
  connectionLevel: number;
  otaRefs?: string | null;
  rooms: unknown[];
  createdAt?: string;
  _count?: { reviews_hotel?: number; rooms?: number };
}

interface RoomApiItem {
  id: string;
  hotelId: string;
  type: string;
  name: string | null;
  capacity: number;
  amenities: string | null;
  basePriceXof: number;
  currency: string;
  photos: string | null;
  totalRooms: number;
  available: boolean;
  availability?: { date: string; status: string; priceOverride: number | null }[];
}

interface ReviewApiItem {
  id: string;
  overall: number;
  comment: string | null;
  cleanliness?: number;
  comfort?: number;
  location?: number;
  value?: number;
  service?: number;
  createdAt: string;
}

interface HotelDetailApiItem extends HotelApiItem {
  rooms: RoomApiItem[];
  reviews_hotel: ReviewApiItem[];
  _count: { rooms: number; bookings: number; reviews_hotel: number };
  otaSyncLogs?: { ota: string; status: string; executedAt: string }[];
}

// ── Amenity icon mapping ──
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  'wi-fi': <Wifi className="w-3 h-3" />,
  parking: <Car className="w-3 h-3" />,
  piscine: <Waves className="w-3 h-3" />,
  pool: <Waves className="w-3 h-3" />,
  restaurant: <UtensilsCrossed className="w-3 h-3" />,
  climatisation: <Wind className="w-3 h-3" />,
  'air conditioning': <Wind className="w-3 h-3" />,
  gym: <Dumbbell className="w-3 h-3" />,
  fitness: <Dumbbell className="w-3 h-3" />,
  'petit-déjeuner': <Coffee className="w-3 h-3" />,
  breakfast: <Coffee className="w-3 h-3" />,
  tv: <Tv className="w-3 h-3" />,
  téléphone: <Phone className="w-3 h-3" />,
  coffre: <Lock className="w-3 h-3" />,
  safe: <Lock className="w-3 h-3" />,
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  single: 'Simple',
  double: 'Double',
  suite: 'Suite',
  deluxe: 'Deluxe',
  family: 'Familiale',
  standard: 'Standard',
};

// ── Helpers ──
function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getFirstImage(images: string | null | undefined): string {
  const arr = parseJsonArray(images);
  return arr[0] || '';
}

function fmtPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function getOtaStatus(otaRefs: string | null | undefined): { ota: string; label: string; synced: boolean }[] {
  if (!otaRefs) return [];
  try {
    const refs = JSON.parse(otaRefs);
    const result: { ota: string; label: string; synced: boolean }[] = [];
    if (refs.booking_com_id) result.push({ ota: 'booking_com', label: 'Booking.com', synced: true });
    if (refs.expedia_id) result.push({ ota: 'expedia', label: 'Expedia', synced: true });
    return result;
  } catch {
    return [];
  }
}

function getConnectionLevelLabel(level: number): { label: string; color: string } {
  switch (level) {
    case 1: return { label: 'OTA', color: 'bg-[#009CDE]/10 text-[#009CDE]' };
    case 2: return { label: 'PMS', color: 'bg-[#003087]/10 text-[#003087]' };
    case 3: return { label: 'Guesthouse', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' };
    default: return { label: 'Direct', color: 'bg-gray-100 text-gray-600' };
  }
}

// ── Skeleton loaders ──
function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Star Rating Filter ──
function StarFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(value === s ? 0 : s)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-4 h-4 ${s <= value ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Main component ──
export default function HospitalityModule() {
  // View state
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // Filter state
  const [searchCity, setSearchCity] = useState('');
  const [filterStars, setFilterStars] = useState(0);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Booking state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingHotelId, setBookingHotelId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
  });

  const { user } = useAuthStore();
  const { selectedCountry } = useCountry();

  // Data fetching
  const { data: hotelsData, isLoading, isError, error } = useHotelsFiltered({
    city: searchCity || undefined,
    country: selectedCountry,
    stars: filterStars || undefined,
    available: filterAvailable || undefined,
    page,
    limit: 9,
  });

  const { data: hotelDetail, isLoading: detailLoading } = useHotel(selectedHotelId || '');
  const { data: roomsData, isLoading: roomsLoading } = useHotelRooms(selectedHotelId || '');
  const { data: reviewsData } = useHotelReviews(selectedHotelId || '');
  const createBooking = useCreateHotelBooking();

  const hotels: HotelApiItem[] = ((hotelsData as { hotels: HotelApiItem[] } | undefined)?.hotels ?? []);
  const pagination = (hotelsData as { pagination?: { page: number; limit: number; total: number; pages: number } } | undefined)?.pagination;

  const detail = hotelDetail as HotelDetailApiItem | undefined;
  const rooms: RoomApiItem[] = (roomsData as RoomApiItem[] | undefined) ?? [];
  const reviews: ReviewApiItem[] = ((reviewsData as { reviews: ReviewApiItem[] } | undefined)?.reviews) ?? [];

  // Client-side price filtering
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (h.pricePerNight < priceRange[0] || h.pricePerNight > priceRange[1]) return false;
      return true;
    });
  }, [hotels, priceRange]);

  // Cities for the selected country
  const cities = useMemo(() => {
    const cfg = COUNTRIES_CONFIG.find((c) => c.code === selectedCountry);
    return cfg ? cfg.cities : [];
  }, [selectedCountry]);

  // Handle hotel selection
  const handleSelectHotel = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedHotelId(null);
  };

  // Booking flow
  const handleOpenBooking = (hotelId: string, roomId?: string) => {
    setBookingHotelId(hotelId);
    setSelectedRoomId(roomId || null);
    setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
    setShowBookingDialog(true);
  };

  const handleSubmitBooking = () => {
    if (!bookingHotelId) return;
    createBooking.mutate(
      {
        hotelId: bookingHotelId,
        roomId: selectedRoomId || undefined,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: bookingForm.guests,
        specialRequests: bookingForm.specialRequests || undefined,
        userId: user?.id,
      },
      {
        onSuccess: () => {
          toast({ title: 'Réservation confirmée', description: 'Votre réservation a été enregistrée avec succès.' });
          setShowBookingDialog(false);
          setBookingHotelId(null);
          setSelectedRoomId(null);
          setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible de créer la réservation.', variant: 'destructive' });
        },
      }
    );
  };

  const resetFilters = () => {
    setSearchCity('');
    setFilterStars(0);
    setFilterAvailable(false);
    setPriceRange([0, 500000]);
    setPage(1);
  };

  const hasActiveFilters = searchCity || filterStars > 0 || filterAvailable || priceRange[0] > 0 || priceRange[1] < 500000;

  // ── Render ──
  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            <Hotel className="w-4 h-4" /> AfriBayit Hospitality
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Hôtels & <span className="text-[#D4AF37]">Séjours</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Réservez votre hébergement en Afrique de l&apos;Ouest. Hôtels, résidences, et maisons d&apos;hôtes vérifiés.
          </p>
        </motion.div>

        {/* ─── LIST VIEW ─── */}
        {view === 'list' && (
          <>
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* City Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={searchCity}
                    onChange={(e) => { setSearchCity(e.target.value); setPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none focus:border-[#D4AF37] transition-colors appearance-none"
                  >
                    <option value="">Toutes les villes</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Star Filter */}
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Étoiles:</span>
                  <StarFilter value={filterStars} onChange={(v) => { setFilterStars(v); setPage(1); }} />
                </div>

                {/* Available Toggle */}
                <button
                  onClick={() => { setFilterAvailable(!filterAvailable); setPage(1); }}
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
                          onClick={resetFilters}
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
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
                <Globe className="w-3 h-3" /> {COUNTRY_NAMES[selectedCountry] || selectedCountry}
              </span>
              {searchCity && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#009CDE]/10 text-[#009CDE] text-xs font-semibold">
                  <MapPin className="w-3 h-3" /> {searchCity}
                  <button onClick={() => { setSearchCity(''); setPage(1); }} className="ml-0.5 hover:text-[#003087]"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterStars > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold">
                  <Star className="w-3 h-3 fill-[#D4AF37]" /> {filterStars} étoile{filterStars > 1 ? 's' : ''}
                  <button onClick={() => { setFilterStars(0); setPage(1); }} className="ml-0.5 hover:text-[#2C2E2F]"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterAvailable && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00A651]/10 text-[#00A651] text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" /> Disponible
                  <button onClick={() => { setFilterAvailable(false); setPage(1); }} className="ml-0.5 hover:text-[#2C2E2F]"><X className="w-3 h-3" /></button>
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Impossible de charger les hôtels</h3>
                <p className="text-sm text-gray-500">{(error as Error)?.message || 'Une erreur est survenue. Veuillez réessayer.'}</p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-5 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}

            {/* Empty State — No Hotels */}
            {!isLoading && !isError && filteredHotels.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 mb-4">
                  <Building2 className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">
                  {hasActiveFilters ? 'Aucun hôtel ne correspond à vos critères' : 'Aucun hôtel disponible dans ce pays'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  {hasActiveFilters
                    ? 'Essayez de modifier vos filtres ou votre recherche pour trouver plus d\'options.'
                    : 'Les hôtels de cette région seront bientôt disponibles. En attendant, explorez d\'autres pays.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="px-5 py-2.5 bg-[#D4AF37] text-white rounded-full text-sm font-semibold hover:bg-[#b8961f] transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* Hotels Grid */}
            {!isLoading && !isError && filteredHotels.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map((hotel, i) => {
                  const amenities = parseJsonArray(hotel.amenities);
                  const image = getFirstImage(hotel.images);
                  const otaStatus = getOtaStatus(hotel.otaRefs);
                  const connLevel = getConnectionLevelLabel(hotel.connectionLevel);

                  return (
                    <motion.div
                      key={hotel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm border cursor-pointer group"
                      onClick={() => handleSelectHotel(hotel.id)}
                    >
                      <div className="relative aspect-[16/10]">
                        {image ? (
                          <ImageWithFallback src={image} alt={hotel.name} className="w-full h-full" fallbackType="hotel" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Hotel className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        {/* Star Rating Overlay */}
                        <div className="absolute top-3 left-3 flex gap-0.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                          {Array.from({ length: hotel.stars }).map((_, j) => (
                            <Star key={j} className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                          ))}
                        </div>
                        {/* Availability Badge */}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold ${
                          hotel.available ? 'bg-[#00A651] text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {hotel.available ? 'Disponible' : 'Complet'}
                        </div>
                        {/* Connection Level Badge */}
                        <div className={`absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${connLevel.color}`}>
                          {connLevel.label}
                        </div>
                        {/* OTA Sync Indicators */}
                        {otaStatus.length > 0 && (
                          <div className="absolute bottom-3 right-3 flex gap-1">
                            {otaStatus.map((ota) => (
                              <span key={ota.ota} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 text-[8px] font-bold text-[#00A651]">
                                <RefreshCw className="w-2.5 h-2.5" />
                                {ota.label === 'Booking.com' ? 'B.com' : 'Exp.'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 group-hover:text-[#003087] transition-colors">{hotel.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                          <MapPin className="w-3.5 h-3.5" />
                          {hotel.city}, {hotel.country}
                        </p>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {amenities.slice(0, 4).map((amenity) => (
                            <span key={amenity} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">
                              {AMENITY_ICONS[amenity.toLowerCase()] || null}
                              {amenity}
                            </span>
                          ))}
                          {amenities.length > 4 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full">
                              +{amenities.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Price & Rating Row */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <span className="font-mono text-xl font-bold text-[#D4AF37]">
                              {fmtPrice(hotel.pricePerNight)}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">FCFA/nuit</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                            <span className="text-sm font-semibold">{hotel.rating}</span>
                            {hotel._count?.reviews_hotel !== undefined && (
                              <span className="text-[10px] text-gray-400">({hotel._count.reviews_hotel})</span>
                            )}
                          </div>
                        </div>

                        {/* CTA */}
                        {hotel.available && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenBooking(hotel.id); }}
                            className="w-full mt-4 py-2.5 bg-[#D4AF37] text-white rounded-full text-sm font-semibold hover:bg-[#b8961f] transition-colors"
                          >
                            Réserver
                          </button>
                        )}
                        {!hotel.available && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSelectHotel(hotel.id); }}
                            className="w-full mt-4 py-2.5 bg-gray-100 text-gray-500 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors"
                          >
                            Voir les détails
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
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
        )}

        {/* ─── DETAIL VIEW ─── */}
        {view === 'detail' && selectedHotelId && (
          <AnimatePresence mode="wait">
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              {/* Back Button */}
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-sm font-medium text-[#003087] hover:text-[#0047b3] mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour à la liste
              </button>

              {detailLoading ? (
                <DetailSkeleton />
              ) : detail ? (
                <div className="space-y-6">
                  {/* Hotel Header */}
                  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
                    {/* Image Gallery */}
                    <div className="relative aspect-[21/9]">
                      {getFirstImage(detail.images) ? (
                        <ImageWithFallback
                          src={getFirstImage(detail.images)}
                          alt={detail.name}
                          className="w-full h-full"
                          fallbackType="hotel"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Hotel className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: detail.stars }).map((_, j) => (
                            <Star key={j} className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                          ))}
                        </div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">{detail.name}</h2>
                        <p className="text-white/80 text-sm flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {detail.city}, {detail.country}
                        </p>
                      </div>
                      {/* Status badges */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          detail.available ? 'bg-[#00A651] text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {detail.available ? 'Disponible' : 'Complet'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getConnectionLevelLabel(detail.connectionLevel).color}`}>
                          {getConnectionLevelLabel(detail.connectionLevel).label}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                          <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37] mx-auto mb-1" />
                          <p className="font-mono text-lg font-bold text-[#2C2E2F]">{detail.rating}</p>
                          <p className="text-[10px] text-gray-500">
                            {detail._count?.reviews_hotel || 0} avis
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                          <BedDouble className="w-5 h-5 text-[#003087] mx-auto mb-1" />
                          <p className="font-mono text-lg font-bold text-[#2C2E2F]">{detail._count?.rooms || 0}</p>
                          <p className="text-[10px] text-gray-500">Chambres</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                          <CalendarDays className="w-5 h-5 text-[#00A651] mx-auto mb-1" />
                          <p className="font-mono text-lg font-bold text-[#2C2E2F]">{detail._count?.bookings || 0}</p>
                          <p className="text-[10px] text-gray-500">Réservations</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 text-center">
                          <span className="text-[#D4AF37] font-mono text-lg font-bold">{fmtPrice(detail.pricePerNight)}</span>
                          <p className="text-[10px] text-gray-500">FCFA/nuit</p>
                        </div>
                      </div>

                      {/* OTA Sync Status */}
                      {getOtaStatus(detail.otaRefs).length > 0 && (
                        <div className="mb-6 p-4 bg-[#003087]/5 rounded-2xl">
                          <h4 className="text-xs font-semibold text-[#003087] mb-2 flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5" /> Synchronisation OTA
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {getOtaStatus(detail.otaRefs).map((ota) => (
                              <span key={ota.ota} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-[#00A651]">
                                <CheckCircle className="w-3 h-3" />
                                {ota.label} — Synchronisé
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {parseJsonArray(detail.amenities).length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-semibold text-[#2C2E2F] mb-3">Équipements</h4>
                          <div className="flex flex-wrap gap-2">
                            {parseJsonArray(detail.amenities).map((amenity) => (
                              <span key={amenity} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                                {AMENITY_ICONS[amenity.toLowerCase()] || <CheckCircle className="w-3 h-3 text-[#00A651]" />}
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick Book */}
                      {detail.available && (
                        <button
                          onClick={() => handleOpenBooking(detail.id)}
                          className="w-full py-3 bg-[#D4AF37] text-white rounded-full text-sm font-semibold hover:bg-[#b8961f] transition-colors flex items-center justify-center gap-2"
                        >
                          Réserver maintenant <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rooms Section */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border">
                    <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
                      <BedDouble className="w-5 h-5 text-[#003087]" /> Types de chambres
                    </h3>
                    {roomsLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-40 rounded-2xl" />
                        ))}
                      </div>
                    ) : rooms.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rooms.map((room) => {
                          const roomPhotos = parseJsonArray(room.photos);
                          const roomAmenities = parseJsonArray(room.amenities);

                          return (
                            <motion.div
                              key={room.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border border-gray-100 rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-colors"
                            >
                              {/* Room Image */}
                              {roomPhotos[0] && (
                                <div className="aspect-[16/8] rounded-xl overflow-hidden mb-3">
                                  <ImageWithFallback
                                    src={roomPhotos[0]}
                                    alt={room.name || room.type}
                                    className="w-full h-full"
                                    fallbackType="hotel"
                                  />
                                </div>
                              )}

                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-display text-base font-bold text-[#2C2E2F]">
                                    {room.name || ROOM_TYPE_LABELS[room.type] || room.type}
                                  </h4>
                                  <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <Users className="w-3 h-3" /> {room.capacity} pers.
                                    <BedDouble className="w-3 h-3" /> {room.totalRooms} dispo.
                                  </p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  room.available ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-red-50 text-red-500'
                                }`}>
                                  {room.available ? 'Libre' : 'Complet'}
                                </span>
                              </div>

                              {/* Room Amenities */}
                              {roomAmenities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {roomAmenities.slice(0, 3).map((am) => (
                                    <span key={am} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] rounded-full">
                                      {am}
                                    </span>
                                  ))}
                                  {roomAmenities.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[9px] rounded-full">
                                      +{roomAmenities.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Availability Calendar Mini */}
                              {room.availability && room.availability.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-[10px] text-gray-400 mb-1">Disponibilités (30 prochains jours)</p>
                                  <div className="flex gap-0.5 overflow-hidden">
                                    {room.availability.slice(0, 14).map((av, idx) => (
                                      <div
                                        key={idx}
                                        className={`w-4 h-4 rounded-sm ${
                                          av.status === 'AVAILABLE' ? 'bg-[#00A651]/30' :
                                          av.status === 'BOOKED' ? 'bg-red-200' :
                                          av.status === 'MAINTENANCE' ? 'bg-[#D4AF37]/30' :
                                          'bg-gray-200'
                                        }`}
                                        title={`${new Date(av.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}: ${av.status}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Price & Book */}
                              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <div>
                                  <span className="font-mono text-lg font-bold text-[#D4AF37]">
                                    {fmtPrice(room.basePriceXof)}
                                  </span>
                                  <span className="text-[10px] text-gray-400 ml-1">FCFA/nuit</span>
                                </div>
                                {room.available && detail.available && (
                                  <button
                                    onClick={() => handleOpenBooking(detail.id, room.id)}
                                    className="px-4 py-2 bg-[#D4AF37] text-white rounded-full text-xs font-semibold hover:bg-[#b8961f] transition-colors"
                                  >
                                    Réserver
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BedDouble className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Aucune chambre configurée pour cet hôtel</p>
                      </div>
                    )}
                  </div>

                  {/* Reviews Section */}
                  {reviews.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border">
                      <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" /> Avis clients
                      </h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {reviews.map((review) => (
                          <div key={review.id} className="p-4 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: review.overall }).map((_, j) => (
                                  <Star key={j} className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                                ))}
                              </div>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(review.createdAt)}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-gray-600">{review.comment}</p>
                            )}
                            {/* Sub-ratings */}
                            {(review.cleanliness || review.comfort || review.location || review.value || review.service) && (
                              <div className="flex flex-wrap gap-3 mt-2">
                                {review.cleanliness && <span className="text-[10px] text-gray-400">Propreté: {review.cleanliness}/5</span>}
                                {review.comfort && <span className="text-[10px] text-gray-400">Confort: {review.comfort}/5</span>}
                                {review.location && <span className="text-[10px] text-gray-400">Emplacement: {review.location}/5</span>}
                                {review.service && <span className="text-[10px] text-gray-400">Service: {review.service}/5</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Hôtel non trouvé</p>
                  <button onClick={handleBackToList} className="mt-4 text-[#003087] text-sm font-medium hover:underline">
                    Retour à la liste
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ─── BOOKING DIALOG ─── */}
        {showBookingDialog && bookingHotelId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowBookingDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-[#2C2E2F]">Réserver</h3>
                <button onClick={() => setShowBookingDialog(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Hotel Name */}
              {detail && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-[#2C2E2F]">{detail.name}</p>
                  <p className="text-xs text-gray-500">{detail.city}, {detail.country}</p>
                </div>
              )}

              {/* Room Selection */}
              {rooms.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type de chambre</label>
                  <select
                    value={selectedRoomId || ''}
                    onChange={(e) => setSelectedRoomId(e.target.value || null)}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  >
                    <option value="">Sans préférence</option>
                    {rooms.filter((r) => r.available).map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name || ROOM_TYPE_LABELS[room.type] || room.type} — {fmtPrice(room.basePriceXof)} FCFA/nuit
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Date d&apos;arrivée
                  </label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Date de départ
                  </label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
                    <Users className="w-3 h-3" /> Nombre de personnes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={bookingForm.guests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, guests: Number(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Demandes spéciales</label>
                  <textarea
                    rows={2}
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Ex: chambre avec vue, lit bébé..."
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                {/* Price Estimate */}
                {bookingForm.checkIn && bookingForm.checkOut && (
                  <div className="p-3 bg-[#D4AF37]/5 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Estimation</p>
                    {(() => {
                      const nights = Math.max(1, Math.ceil(
                        (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                      ));
                      const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
                      const pricePerNight = selectedRoom?.basePriceXof || detail?.pricePerNight || 0;
                      const total = pricePerNight * nights;
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {fmtPrice(pricePerNight)} × {nights} nuit{nights > 1 ? 's' : ''}
                          </span>
                          <span className="font-mono text-lg font-bold text-[#D4AF37]">{fmtPrice(total)} FCFA</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingDialog(false)}
                    className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={createBooking.isPending || !bookingForm.checkIn || !bookingForm.checkOut}
                    className="flex-1 py-3 bg-[#D4AF37] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait hover:bg-[#b8961f] transition-colors"
                  >
                    {createBooking.isPending ? 'Réservation...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
