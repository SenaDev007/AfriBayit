'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuesthouses, useGuesthouse, useGuesthouseBookings, useCreateBooking } from '@/hooks/useGuesthouses';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// ── Static UI config (NOT database data) ────────────────────────
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const certificationProcessSteps = [
  { step: 1, title: 'Demande', desc: 'Soumission du dossier de certification', icon: '📋' },
  { step: 2, title: 'Inspection', desc: 'Visite de contrôle qualité AfriBayit', icon: '🔍' },
  { step: 3, title: 'Conformité', desc: 'Vérification sécurité, hygiène, confort', icon: '✅' },
  { step: 4, title: 'Certification', desc: 'Badge Guesthouse Certifié délivré', icon: '🏅' },
];

const mealTypeConfig = [
  { key: 'breakfast', label: 'Petit-déjeuner', icon: '🥐', color: '#D4AF37' },
  { key: 'lunch', label: 'Déjeuner', icon: '🍲', color: '#00A651' },
  { key: 'dinner', label: 'Dîner', icon: '🍷', color: '#003087' },
];

const roleIconMap: Record<string, string> = {
  receptionist: '🛎️',
  housekeeping: '🧹',
  cook: '👨‍🍳',
  security: '🛡️',
};

// ── API response types ──────────────────────────────────────────
interface GuesthouseListItem {
  id: string;
  name: string;
  city: string;
  country: string;
  certificationStatus: string;
  overallRating: number;
  reviewCount: number;
  images: string | null;
  rooms: GuesthouseRoomItem[];
  _count?: { bookings?: number };
}

interface GuesthouseDetail extends GuesthouseListItem {
  ownerId: string;
  description?: string;
  quartier?: string;
  address?: string;
  amenities: string | null;
  meals: GuesthouseMealItem[];
  staff: GuesthouseStaffItem[];
  pricingRules: GuesthousePricingRuleItem[];
}

interface GuesthouseRoomItem {
  id: string;
  name: string;
  capacity: number;
  amenities: string | null;
  basePrice: number;
  available: boolean;
}

interface GuesthouseMealItem {
  id: string;
  mealType: string;
  price: number;
  includedInPrice: boolean;
}

interface GuesthouseStaffItem {
  id: string;
  name: string;
  role: string;
  schedule: string | null;
}

interface GuesthousePricingRuleItem {
  id: string;
  name: string;
  period: string;
  multiplier: number;
  startDate: string | null;
  endDate: string | null;
  event_name: string | null;
}

interface BookingItem {
  id: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  breakfastIncluded: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────
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

function parseSchedule(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') {
      if (parsed.start && parsed.end) return `${parsed.start}-${parsed.end}`;
      if (parsed.hours) return parsed.hours;
    }
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

function formatModifier(multiplier: number): string {
  if (multiplier === 1) return '0%';
  if (multiplier > 1) return `+${Math.round((multiplier - 1) * 100)}%`;
  return `-${Math.round((1 - multiplier) * 100)}%`;
}

function formatPeriodDates(startDate: string | null, endDate: string | null, eventName: string | null): string {
  if (eventName) return eventName;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[start.getMonth()]} – ${months[end.getMonth()]}`;
  }
  return '';
}

function periodLabel(period: string): string {
  const map: Record<string, string> = {
    low_season: 'Basse saison',
    high_season: 'Haute saison',
    event: 'Événementiel',
    holiday: 'Fêtes',
    custom: 'Personnalisé',
  };
  return map[period] || period;
}

// ── Skeleton loaders ────────────────────────────────────────────
function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="w-3 h-3 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  );
}

function MealCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border text-center space-y-3">
      <Skeleton className="h-10 w-10 mx-auto rounded-full" />
      <Skeleton className="h-5 w-24 mx-auto" />
      <Skeleton className="h-8 w-20 mx-auto" />
    </div>
  );
}

function StaffRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

function PricingCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border text-center space-y-2">
      <Skeleton className="h-8 w-8 mx-auto rounded-full" />
      <Skeleton className="h-5 w-24 mx-auto" />
      <Skeleton className="h-7 w-16 mx-auto" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
type TabKey = 'listings' | 'chambers' | 'booking' | 'meals' | 'staff' | 'pricing' | 'certification';

export default function GuesthouseModule({ onNavigate }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('listings');
  const [selectedGhId, setSelectedGhId] = useState<string | null>(null);
  const { selectedCountry } = useCountry();

  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingRoom, setBookingRoom] = useState<GuesthouseRoomItem | null>(null);
  const [bookingCheckIn, setBookingCheckIn] = useState('');
  const [bookingCheckOut, setBookingCheckOut] = useState('');
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingBreakfast, setBookingBreakfast] = useState(false);

  // List query
  const { data: listData, isLoading: listLoading, isError: listError, error: listErrorObj } = useGuesthouses(undefined, selectedCountry);
  const guesthousesList: GuesthouseListItem[] =
    (listData as { guesthouses: GuesthouseListItem[] } | undefined)?.guesthouses ?? [];

  // Detail query (enabled when a guesthouse is selected)
  const { data: detailData, isLoading: detailLoading } = useGuesthouse(selectedGhId || '');
  const selectedGhDetail = detailData as GuesthouseDetail | undefined;

  // Default to first guesthouse for detail tabs
  const effectiveGhId = selectedGhId || (guesthousesList[0]?.id ?? null);
  const { data: fallbackDetail, isLoading: fallbackLoading } = useGuesthouse(effectiveGhId || '');
  const activeDetail = (selectedGhId ? selectedGhDetail : (fallbackDetail as GuesthouseDetail | undefined)) ?? undefined;
  const detailLoadingState = selectedGhId ? detailLoading : fallbackLoading;

  // Bookings query for the calendar
  const { data: bookingsData } = useGuesthouseBookings(effectiveGhId || '');
  const bookings: BookingItem[] = (bookingsData as { bookings: BookingItem[] } | undefined)?.bookings ?? [];

  // Compute booked days from actual booking data
  const bookedDays = useMemo(() => {
    const days = new Set<number>();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      // Only include bookings in the current month
      const start = new Date(Math.max(checkIn.getTime(), new Date(currentYear, currentMonth, 1).getTime()));
      const end = new Date(Math.min(checkOut.getTime(), new Date(currentYear, currentMonth + 1, 0).getTime()));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.add(d.getDate());
      }
    });
    return days;
  }, [bookings]);

  // Generate calendar days from actual booking data
  const calendarDays = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => {
      const day = (i % 31) + 1;
      return { day, booked: bookedDays.has(day) };
    });
  }, [bookedDays]);

  // Create booking mutation
  const createBooking = useCreateBooking(effectiveGhId || '');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'listings', label: 'Listings', icon: '🏠' },
    { key: 'chambers', label: 'Chambres', icon: '🛏️' },
    { key: 'booking', label: 'Réservations', icon: '📅' },
    { key: 'meals', label: 'Repas', icon: '🍽️' },
    { key: 'staff', label: 'Personnel', icon: '👥' },
    { key: 'pricing', label: 'Tarifs saisonniers', icon: '💹' },
    { key: 'certification', label: 'Certification', icon: '🏅' },
  ];

  // Open booking dialog for a room
  const handleOpenBooking = (room: GuesthouseRoomItem) => {
    setBookingRoom(room);
    setBookingCheckIn('');
    setBookingCheckOut('');
    setBookingGuests(1);
    setBookingBreakfast(false);
    setShowBookingDialog(true);
  };

  // Submit booking
  const handleSubmitBooking = () => {
    if (!bookingRoom || !bookingCheckIn || !bookingCheckOut || !effectiveGhId) return;

    const checkIn = new Date(bookingCheckIn);
    const checkOut = new Date(bookingCheckOut);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const totalPrice = bookingRoom.basePrice * nights;

    createBooking.mutate(
      {
        roomId: bookingRoom.id,
        checkIn: bookingCheckIn,
        checkOut: bookingCheckOut,
        guests: bookingGuests,
        totalPrice,
        currency: 'XOF',
        breakfastIncluded: bookingBreakfast,
      },
      {
        onSuccess: () => {
          toast.success('Réservation confirmée', { description: `${bookingRoom.name} réservée pour ${nights} nuit(s)` });
          setShowBookingDialog(false);
          setBookingRoom(null);
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de la réservation', { description: error.message });
        },
      }
    );
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
            🏡 PMS Hôtelier — CDC §5.3
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Maisons <span className="text-[#00A651]">d&apos;Hôtes</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Gestion complète de votre guesthouse : chambres, réservations, repas et personnel
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Revenue Model Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#003087]/5 to-[#00A651]/5 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm font-semibold text-[#2C2E2F]">Modèle de revenus</p>
              <p className="text-xs text-gray-500">Commission voyageur : 10-13% · Commission propriétaire : 3%</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#00A651]">10-13%</p>
              <p className="text-[10px] text-gray-500">Voyageur</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#003087]">3%</p>
              <p className="text-[10px] text-gray-500">Propriétaire</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ===== LISTINGS ===== */}
          {activeTab === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Impossible de charger les guesthouses</h3>
                  <p className="text-sm text-gray-500">{(listErrorObj as Error)?.message || 'Une erreur est survenue. Veuillez réessayer.'}</p>
                </div>
              )}

              {/* Empty */}
              {!listLoading && !listError && guesthousesList.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Aucune guesthouse disponible</h3>
                  <p className="text-sm text-gray-500">Les guesthouses seront bientôt disponibles. Revenez plus tard.</p>
                </div>
              )}

              {/* Data */}
              {!listLoading && !listError && guesthousesList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {guesthousesList.map((gh, i) => {
                    const image = getFirstImage(gh.images);
                    const isCertified = gh.certificationStatus === 'certified';
                    const isInProgress = gh.certificationStatus === 'pending';
                    return (
                      <motion.div
                        key={gh.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, ease: easeOut }}
                        whileHover={{ y: -4 }}
                        onClick={() => { setSelectedGhId(gh.id); setActiveTab('chambers'); }}
                        className="bg-white rounded-3xl overflow-hidden shadow-sm border group cursor-pointer"
                      >
                        <div className="relative aspect-[16/10]">
                          {image ? (
                            <ImageWithFallback src={image} alt={gh.name} className="w-full h-full group-hover:scale-105 transition-transform duration-500" fallbackType="guesthouse" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full text-white ${
                              isCertified ? 'bg-[#00A651]' : isInProgress ? 'bg-[#D4AF37]' : 'bg-gray-500'
                            }`}>
                              {isCertified ? '✅ Certifié' : isInProgress ? '⏳ En cours' : '❌ Non certifié'}
                            </span>
                          </div>
                          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-mono">
                            {gh.rooms.length} chambre{gh.rooms.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-display text-base font-bold text-[#2C2E2F] group-hover:text-[#003087] transition-colors">
                            {gh.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-2">{gh.city}, {gh.country}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              {gh.overallRating} ({gh.reviewCount})
                            </span>
                            <span>À partir de <span className="font-mono font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(gh.rooms[0]?.basePrice || 0)} FCFA</span></span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== CHAMBERS ===== */}
          {activeTab === 'chambers' && (
            <motion.div key="chambers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Guesthouse selector */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={effectiveGhId || ''}
                  onChange={e => setSelectedGhId(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>

              {detailLoadingState ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RoomCardSkeleton key={i} />
                  ))}
                </div>
              ) : activeDetail && activeDetail.rooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeDetail.rooms.map((ch, i) => {
                    const amenities = parseJsonArray(ch.amenities);
                    return (
                      <motion.div
                        key={ch.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, ease: easeOut }}
                        className="bg-white rounded-3xl p-5 shadow-sm border"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-display text-base font-bold text-[#2C2E2F]">{ch.name}</h4>
                          <span className={`w-3 h-3 rounded-full ${ch.available ? 'bg-[#00A651]' : 'bg-[#D93025]'}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <p className="text-[10px] text-gray-500">Capacité</p>
                            <p className="font-mono text-sm font-bold text-[#2C2E2F]">{ch.capacity} pers.</p>
                          </div>
                          <div className="p-2 bg-gray-50 rounded-xl">
                            <p className="text-[10px] text-gray-500">Prix/nuit</p>
                            <p className="font-mono text-sm font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(ch.basePrice)} FCFA</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {amenities.map(a => (
                            <span key={a} className="px-2 py-0.5 bg-[#009CDE]/5 text-[#009CDE] rounded-full text-[10px] font-medium">{a}</span>
                          ))}
                        </div>
                        <button
                          onClick={() => handleOpenBooking(ch)}
                          disabled={!ch.available}
                          className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${
                            ch.available ? 'bg-[#003087] text-white hover:bg-[#0047b3]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {ch.available ? 'Réserver' : 'Indisponible'}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">Aucune chambre disponible pour cette guesthouse.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== BOOKING CALENDAR ===== */}
          {activeTab === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Calendrier — {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-[#00A651]/20" /> Disponible</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-[#D93025]/20" /> Réservé</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cd, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        cd.booked
                          ? 'bg-[#D93025]/10 text-[#D93025]'
                          : 'bg-[#00A651]/5 text-[#2C2E2F] hover:bg-[#00A651]/20'
                      }`}
                    >
                      {cd.day}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== MEALS ===== */}
          {activeTab === 'meals' && (
            <motion.div key="meals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Guesthouse selector */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={effectiveGhId || ''}
                  onChange={e => setSelectedGhId(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>

              {detailLoadingState ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <MealCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {mealTypeConfig.map((mtc) => {
                    const meal = activeDetail?.meals?.find(m => m.mealType === mtc.key);
                    return (
                      <motion.div
                        key={mtc.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-6 shadow-sm border text-center"
                      >
                        <span className="text-4xl block mb-3">{mtc.icon}</span>
                        <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">{mtc.label}</h4>
                        {meal ? (
                          <>
                            <p className="font-mono text-2xl font-bold" style={{ color: mtc.color }}>
                              {new Intl.NumberFormat('fr-FR').format(meal.price)} FCFA
                            </p>
                            <span className="inline-flex mt-2 px-2 py-0.5 bg-[#00A651]/10 text-[#00A651] text-[10px] font-semibold rounded-full">
                              ✅ Disponible
                            </span>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400 mt-2">Non proposé</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== STAFF ===== */}
          {activeTab === 'staff' && (
            <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Guesthouse selector */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={effectiveGhId || ''}
                  onChange={e => setSelectedGhId(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>

              {detailLoadingState ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <StaffRowSkeleton key={i} />
                  ))}
                </div>
              ) : activeDetail?.staff && activeDetail.staff.length > 0 ? (
                <div className="space-y-3">
                  {activeDetail.staff.map((s, i) => {
                    const schedule = parseSchedule(s.schedule);
                    const icon = roleIconMap[s.role] || '👤';
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, ease: easeOut }}
                        className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center">
                            <span className="text-sm">{icon}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.role}</p>
                          </div>
                        </div>
                        {schedule && (
                          <div className="text-right">
                            <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600">🕐 {schedule}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">Aucun personnel enregistré pour cette guesthouse.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== SEASONAL PRICING ===== */}
          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Guesthouse selector */}
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={effectiveGhId || ''}
                  onChange={e => setSelectedGhId(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>

              {detailLoadingState ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PricingCardSkeleton key={i} />
                  ))}
                </div>
              ) : activeDetail?.pricingRules && activeDetail.pricingRules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {activeDetail.pricingRules.map((pr, i) => {
                    const isLow = pr.period === 'low_season';
                    const isHigh = pr.period === 'high_season';
                    const isEvent = pr.period === 'event' || pr.period === 'holiday';
                    const color = isLow ? '#009CDE' : isHigh ? '#D4AF37' : isEvent ? '#D93025' : '#6b7280';
                    const icon = isLow ? '📉' : isHigh ? '📈' : isEvent ? '🎉' : '📊';
                    return (
                      <motion.div
                        key={pr.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, ease: easeOut }}
                        className="bg-white rounded-3xl p-5 shadow-sm border text-center"
                      >
                        <span className="text-3xl block mb-2">{icon}</span>
                        <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">{periodLabel(pr.period)}</h4>
                        <p className="font-mono text-2xl font-bold mb-1" style={{ color }}>{formatModifier(pr.multiplier)}</p>
                        <p className="text-xs text-gray-500">{formatPeriodDates(pr.startDate, pr.endDate, pr.event_name)}</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">Aucune règle tarifaire définie pour cette guesthouse.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== CERTIFICATION ===== */}
          {activeTab === 'certification' && (
            <motion.div key="certification" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-6">Certification Guesthouse</h3>
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                  {certificationProcessSteps.map((s, i) => (
                    <div key={s.step} className="flex items-start shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          i < 2 ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {s.icon}
                        </div>
                        <p className={`text-[10px] font-medium mt-1 text-center w-20 ${i < 2 ? 'text-[#00A651]' : 'text-gray-400'}`}>{s.title}</p>
                      </div>
                      {i < certificationProcessSteps.length - 1 && (
                        <div className={`w-6 h-0.5 mt-6 shrink-0 ${i < 1 ? 'bg-[#00A651]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-[#D4AF37]/5 rounded-2xl">
                  <p className="text-sm text-[#2C2E2F] font-semibold mb-1">⏳ En cours de certification</p>
                  <p className="text-xs text-gray-500">Votre demande est en cours de traitement. L&apos;inspection sera planifiée sous 5 jours ouvrés.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && bookingRoom && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full"
          >
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Réserver {bookingRoom.name}</h3>
            <p className="text-xs text-gray-500 mb-4">
              {new Intl.NumberFormat('fr-FR').format(bookingRoom.basePrice)} FCFA / nuit · {bookingRoom.capacity} pers.
            </p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date d&apos;arrivée</label>
                  <input
                    type="date"
                    value={bookingCheckIn}
                    onChange={e => setBookingCheckIn(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date de départ</label>
                  <input
                    type="date"
                    value={bookingCheckOut}
                    onChange={e => setBookingCheckOut(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre de voyageurs</label>
                <select
                  value={bookingGuests}
                  onChange={e => setBookingGuests(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
                >
                  {Array.from({ length: bookingRoom.capacity }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="breakfast"
                  checked={bookingBreakfast}
                  onChange={e => setBookingBreakfast(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#003087] focus:ring-[#003087]"
                />
                <label htmlFor="breakfast" className="text-sm text-gray-700">
                  Inclure le petit-déjeuner
                </label>
              </div>

              {/* Price summary */}
              {bookingCheckIn && bookingCheckOut && (
                <div className="p-3 bg-[#D4AF37]/5 rounded-xl">
                  {(() => {
                    const nights = Math.max(1, Math.ceil((new Date(bookingCheckOut).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 60 * 60 * 24)));
                    const total = bookingRoom.basePrice * nights;
                    return (
                      <>
                        <p className="text-xs text-gray-500">{nights} nuit(s) × {new Intl.NumberFormat('fr-FR').format(bookingRoom.basePrice)} FCFA</p>
                        <p className="font-mono text-lg font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(total)} FCFA</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingDialog(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={!bookingCheckIn || !bookingCheckOut || createBooking.isPending}
                className="flex-1 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] disabled:opacity-50"
              >
                {createBooking.isPending ? 'Réservation...' : 'Confirmer'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
