'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MapPin,
  Star,
  Users,
  BedDouble,
  Bath,
  Calendar,
  Filter,
  Grid3X3,
  Map,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  ShieldCheck,
  BadgeCheck,
  Heart,
  Share2,
  X,
  CreditCard,
  Wifi,
  Car,
  Waves,
  UtensilsCrossed,
  AirVent,
  Tv,
  Lock,
  ChevronDown,
  RefreshCw,
  Home,
  Building2,
  Palmtree,
  DoorOpen,
  Globe,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────
const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';
const GREEN = '#00A651';
const RED = '#D93025';

const easeOut = [0.16, 1, 0.3, 1] as const;

const PROPERTY_TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'maison', label: 'Maison' },
  { value: 'loft', label: 'Loft' },
  { value: 'bungalow', label: 'Bungalow' },
];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />,
  ac: <AirVent className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />,
  pool: <Waves className="w-4 h-4" />,
  kitchen: <UtensilsCrossed className="w-4 h-4" />,
  tv: <Tv className="w-4 h-4" />,
  securite: <Lock className="w-4 h-4" />,
};

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: 'Flexible',
  moderate: 'Moderee',
  strict: 'Stricte',
};

const OTA_LABELS: Record<string, string> = {
  airbnb: 'Airbnb',
  booking_com: 'Booking.com',
};

// ─── API types ───────────────────────────────────────────────────
interface RentalApiItem {
  id: string;
  hostId: string;
  title: string;
  slug?: string;
  description?: string;
  propertyType: string;
  city: string;
  country: string;
  quartier?: string;
  address?: string;
  lat?: number;
  lng?: number;
  images?: string | null;
  pricePerNight: number;
  weeklyPrice?: number | null;
  monthlyPrice?: number | null;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  beds: number;
  amenities?: string | null;
  houseRules?: string | null;
  instantBooking: boolean;
  rating: number;
  reviewCount: number;
  views: number;
  otaRefs?: string | null;
  otaSyncStatus?: string | null;
  hostVerified: boolean;
  hostIdentityVerified: boolean;
  status: string;
  minStayNights: number;
  maxStayNights?: number | null;
  cancellationPolicy: string;
  cleaningFee: number;
  securityDeposit: number;
  createdAt?: string;
  _count?: { bookings?: number; reviews_str?: number };
  host?: { name: string; avatar?: string; verified?: boolean; kycLevel?: number };
  pricingRules?: ShortTermPricingRuleApi[];
}

interface ShortTermPricingRuleApi {
  id: string;
  name: string;
  period: string;
  multiplier: number;
  startDate?: string | null;
  endDate?: string | null;
}

interface AvailabilityDay {
  id: string;
  date: string;
  status: string;
  priceOverride?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────
function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseJsonObj(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getFirstImage(images: string | null | undefined): string {
  const arr = parseJsonArray(images);
  return arr[0] || '';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price));
}

function getNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function getPropertyTypeIcon(type: string) {
  switch (type) {
    case 'appartement': return <Building2 className="w-4 h-4" />;
    case 'villa': return <Home className="w-4 h-4" />;
    case 'studio': return <DoorOpen className="w-4 h-4" />;
    case 'chambre': return <BedDouble className="w-4 h-4" />;
    case 'maison': return <Home className="w-4 h-4" />;
    case 'bungalow': return <Palmtree className="w-4 h-4" />;
    default: return <Building2 className="w-4 h-4" />;
  }
}

// ─── Skeletons ───────────────────────────────────────────────────
function RentalCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

function AvailabilityCalendarSkeleton() {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Star Rating ─────────────────────────────────────────────────
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= Math.round(rating) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

// ─── OTA Sync Badge ──────────────────────────────────────────────
function OtaSyncBadge({ syncStatus }: { syncStatus: string | null | undefined }) {
  const parsed = parseJsonObj(syncStatus);
  const entries = Object.entries(parsed);
  if (entries.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {entries.map(([platform, status]) => (
        <span
          key={platform}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            status === 'synced'
              ? 'bg-[#00A651]/10 text-[#00A651]'
              : 'bg-[#D4AF37]/10 text-[#D4AF37]'
          }`}
        >
          <RefreshCw className="w-3 h-3" />
          {OTA_LABELS[platform] || platform}
        </span>
      ))}
    </div>
  );
}

// ─── Host Profile Card ───────────────────────────────────────────
function HostProfileCard({ host }: { host: RentalApiItem['host'] }) {
  if (!host) return null;
  return (
    <div className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-2xl border">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {host.avatar ? (
          <img src={host.avatar} alt={host.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-gray-400">
            {host.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#2C2E2F] truncate">{host.name}</p>
        <div className="flex items-center gap-1.5">
          {host.verified && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#003087] font-medium">
              <BadgeCheck className="w-3 h-3" /> Verifie
            </span>
          )}
          {(host.kycLevel ?? 0) >= 2 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-[#00A651] font-medium">
              <ShieldCheck className="w-3 h-3" /> Identite
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Availability Calendar ───────────────────────────────────────
function AvailabilityCalendar({
  availability,
  checkIn,
  checkOut,
  onDateClick,
  currentMonth,
  onPrevMonth,
  onNextMonth,
}: {
  availability: AvailabilityDay[];
  checkIn: string;
  checkOut: string;
  onDateClick: (date: string) => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const availMap = useMemo(() => {
    const m: Record<string, AvailabilityDay> = {};
    availability.forEach((d) => {
      const key = d.date.slice(0, 10);
      m[key] = d;
    });
    return m;
  }, [availability]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayLabels = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
        <h4 className="text-sm font-semibold text-[#2C2E2F]">
          {firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </h4>
        <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayLabels.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(year, month, day);
          const isPast = dateObj < today;
          const avail = availMap[dateStr];
          const isCheckIn = checkIn === dateStr;
          const isCheckOut = checkOut === dateStr;
          const isInRange =
            checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
          const status = avail?.status || 'AVAILABLE';

          let bgClass = 'bg-[#00A651]/10 text-[#00A651] hover:bg-[#00A651]/20 cursor-pointer';
          if (isPast) bgClass = 'bg-gray-50 text-gray-300 cursor-not-allowed';
          else if (status === 'BOOKED') bgClass = 'bg-[#D93025]/10 text-[#D93025] cursor-not-allowed';
          else if (status === 'BLOCKED' || status === 'MAINTENANCE') bgClass = 'bg-gray-200 text-gray-400 cursor-not-allowed';
          if (isCheckIn || isCheckOut) bgClass = 'bg-[#D4AF37] text-white';
          else if (isInRange) bgClass = 'bg-[#D4AF37]/20 text-[#D4AF37]';

          return (
            <button
              key={day}
              disabled={isPast || status === 'BOOKED' || status === 'BLOCKED' || status === 'MAINTENANCE'}
              onClick={() => !isPast && onDateClick(dateStr)}
              className={`aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-colors ${bgClass}`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/10 rounded" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D93025]/10 rounded" /> Reserve</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D4AF37] rounded" /> Selection</span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function ShortTermRentalModule() {
  const { selectedCountry } = useCountry();
  const queryClient = useQueryClient();

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingRentalId, setBookingRentalId] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState('');
  const [filterCheckOut, setFilterCheckOut] = useState('');
  const [filterGuests, setFilterGuests] = useState(1);
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
  });

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => new Date());

  // ─── Queries ─────────────────────────────────────────────────
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('country', selectedCountry);
    if (searchQuery) params.set('search', searchQuery);
    if (filterPropertyType) params.set('propertyType', filterPropertyType);
    if (filterPriceMin) params.set('priceMin', filterPriceMin);
    if (filterPriceMax) params.set('priceMax', filterPriceMax);
    if (filterCheckIn) params.set('checkIn', filterCheckIn);
    if (filterCheckOut) params.set('checkOut', filterCheckOut);
    if (filterGuests > 1) params.set('guests', String(filterGuests));
    if (filterAmenities.length > 0) params.set('amenities', filterAmenities.join(','));
    return params.toString();
  }, [selectedCountry, searchQuery, filterPropertyType, filterPriceMin, filterPriceMax, filterCheckIn, filterCheckOut, filterGuests, filterAmenities]);

  const { data: rentalsData, isLoading, isError, error } = useQuery({
    queryKey: ['short-term-rentals', queryParams],
    queryFn: () => apiFetch<{ rentals: RentalApiItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/short-term?${queryParams}`),
  });

  const { data: rentalDetail } = useQuery({
    queryKey: ['short-term-rental', selectedRentalId],
    queryFn: () => apiFetch<RentalApiItem>(`/api/short-term/${selectedRentalId}`),
    enabled: !!selectedRentalId,
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['short-term-rental-availability', selectedRentalId],
    queryFn: () => apiFetch<{ availability: AvailabilityDay[] }>(`/api/short-term/${selectedRentalId}/availability`),
    enabled: !!selectedRentalId,
  });

  // ─── Mutations ───────────────────────────────────────────────
  const createBooking = useMutation({
    mutationFn: (data: { rentalId: string; checkIn: string; checkOut: string; guests: number; specialRequests?: string }) =>
      apiPost(`/api/short-term/${data.rentalId}/bookings`, data),
    onSuccess: () => {
      toast.success('Reservation confirmee', { description: 'Votre demande de reservation a ete envoyee avec succes.' });
      queryClient.invalidateQueries({ queryKey: ['short-term-rental-bookings'] });
      setShowBookingModal(false);
      setBookingRentalId(null);
      setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message || 'Impossible de creer la reservation.' });
    },
  });

  // ─── Computed ────────────────────────────────────────────────
  const rentals: RentalApiItem[] = (rentalsData as { rentals: RentalApiItem[] } | undefined)?.rentals ?? [];
  const availDays: AvailabilityDay[] = (availabilityData as { availability: AvailabilityDay[] } | undefined)?.availability ?? [];

  // ─── Handlers ────────────────────────────────────────────────
  const handleOpenBooking = useCallback((rentalId: string) => {
    setBookingRentalId(rentalId);
    setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
    setShowBookingModal(true);
  }, []);

  const handleSubmitBooking = useCallback(() => {
    if (!bookingRentalId || !bookingForm.checkIn || !bookingForm.checkOut) return;
    createBooking.mutate({
      rentalId: bookingRentalId,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      guests: bookingForm.guests,
      specialRequests: bookingForm.specialRequests || undefined,
    });
  }, [bookingRentalId, bookingForm, createBooking]);

  const handleCalDateClick = useCallback((dateStr: string) => {
    if (!bookingForm.checkIn || (bookingForm.checkIn && bookingForm.checkOut)) {
      setBookingForm((prev) => ({ ...prev, checkIn: dateStr, checkOut: '' }));
    } else {
      if (dateStr <= bookingForm.checkIn) {
        setBookingForm((prev) => ({ ...prev, checkIn: dateStr, checkOut: '' }));
      } else {
        setBookingForm((prev) => ({ ...prev, checkOut: dateStr }));
      }
    }
  }, [bookingForm]);

  const toggleAmenityFilter = useCallback((amenity: string) => {
    setFilterAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterPropertyType('');
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterCheckIn('');
    setFilterCheckOut('');
    setFilterGuests(1);
    setFilterAmenities([]);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPropertyType) count++;
    if (filterPriceMin) count++;
    if (filterPriceMax) count++;
    if (filterCheckIn) count++;
    if (filterCheckOut) count++;
    if (filterGuests > 1) count++;
    if (filterAmenities.length > 0) count++;
    return count;
  }, [filterPropertyType, filterPriceMin, filterPriceMax, filterCheckIn, filterCheckOut, filterGuests, filterAmenities]);

  // Dynamic pricing display
  const getEffectivePrice = useCallback((rental: RentalApiItem): { price: number; label: string; isDiscounted: boolean } => {
    const now = new Date();
    const month = now.getMonth();
    // Haute saison: Dec-Jan, Juil-Aout
    const isHighSeason = month >= 11 || month <= 1 || (month >= 6 && month <= 8);

    if (rental.pricingRules && rental.pricingRules.length > 0) {
      const activeRule = rental.pricingRules.find((rule) => {
        if (rule.startDate && rule.endDate) {
          const start = new Date(rule.startDate);
          const end = new Date(rule.endDate);
          return now >= start && now <= end;
        }
        if (rule.period === 'high_season' && isHighSeason) return true;
        if (rule.period === 'low_season' && !isHighSeason) return true;
        return false;
      });
      if (activeRule) {
        const adjustedPrice = Math.round(rental.pricePerNight * activeRule.multiplier);
        return {
          price: adjustedPrice,
          label: activeRule.period === 'high_season' ? 'Haute saison' : activeRule.period === 'low_season' ? 'Basse saison' : activeRule.name,
          isDiscounted: activeRule.multiplier < 1,
        };
      }
    }

    if (isHighSeason) {
      return { price: Math.round(rental.pricePerNight * 1.2), label: 'Haute saison', isDiscounted: false };
    }
    return { price: rental.pricePerNight, label: '', isDiscounted: false };
  }, []);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            <Home className="w-4 h-4" /> Location Courte Duree
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Locations <span className="text-[#D4AF37]">Vacances</span> & Sejours
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Appartements, villas et maisons entieres pour vos sejours en Afrique de l&apos;Ouest. Reservation instantanee ou sur demande.
          </p>
        </motion.div>

        {/* ── Search & Filters Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-sm border mb-6"
        >
          {/* Main search row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ville, quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={filterCheckIn}
                onChange={(e) => setFilterCheckIn(e.target.value)}
                placeholder="Arrivee"
                className="px-3 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
              <input
                type="date"
                value={filterCheckOut}
                onChange={(e) => setFilterCheckOut(e.target.value)}
                placeholder="Depart"
                className="px-3 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-[#003087] text-white border-[#003087]'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#D4AF37] text-white text-[10px] font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="flex rounded-2xl border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#003087] text-white' : 'hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-3 transition-colors ${viewMode === 'map' ? 'bg-[#003087] text-white' : 'hover:bg-gray-50'}`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t">
                  {/* Property type */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type de bien</label>
                    <select
                      value={filterPropertyType}
                      onChange={(e) => setFilterPropertyType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-[#D4AF37]"
                    >
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Price range */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Prix (FCFA/nuit)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filterPriceMin}
                        onChange={(e) => setFilterPriceMin(e.target.value)}
                        className="w-1/2 px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-[#D4AF37]"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filterPriceMax}
                        onChange={(e) => setFilterPriceMax(e.target.value)}
                        className="w-1/2 px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                  {/* Guests */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Voyageurs</label>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border">
                      <button
                        onClick={() => setFilterGuests((g) => Math.max(1, g - 1))}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium">{filterGuests}</span>
                      <button
                        onClick={() => setFilterGuests((g) => Math.min(16, g + 1))}
                        className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Amenities */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Equipements</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(AMENITY_ICONS).map(([key, icon]) => (
                        <button
                          key={key}
                          onClick={() => toggleAmenityFilter(key)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium border transition-colors ${
                            filterAmenities.includes(key)
                              ? 'bg-[#003087] text-white border-[#003087]'
                              : 'bg-white text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#D93025] font-medium hover:underline"
                    >
                      Reinitialiser les filtres
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Country Badge ── */}
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
          {rentals.length > 0 && (
            <span className="text-xs text-gray-400 ml-2">
              {rentals.length} annonce{rentals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RentalCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* ── Error State ── */}
        {isError && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Impossible de charger les annonces</h3>
            <p className="text-sm text-gray-500">{(error as Error)?.message || 'Une erreur est survenue. Veuillez reessayer.'}</p>
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !isError && rentals.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Home className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Aucune location disponible</h3>
            <p className="text-sm text-gray-500">Les locations courte duree seront bientot disponibles. Revenez plus tard.</p>
          </div>
        )}

        {/* ── Grid View ── */}
        {!isLoading && !isError && rentals.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map((rental, i) => {
              const image = getFirstImage(rental.images);
              const amenities = parseJsonArray(rental.amenities);
              const effectivePrice = getEffectivePrice(rental);
              const otaRefs = parseJsonObj(rental.otaRefs);

              return (
                <motion.div
                  key={rental.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border cursor-pointer group"
                  onClick={() => setSelectedRentalId(rental.id)}
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10]">
                    {image ? (
                      <ImageWithFallback src={image} alt={rental.title} className="w-full h-full" fallbackType="guesthouse" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {rental.instantBooking && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37] text-white text-[10px] font-bold shadow-lg">
                          <Zap className="w-3 h-3" /> Reservation instantanee
                        </span>
                      )}
                      {!rental.instantBooking && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#003087] text-[10px] font-bold shadow">
                          <Clock className="w-3 h-3" /> Sur demande
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-[#2C2E2F] shadow">
                        {getPropertyTypeIcon(rental.propertyType)}
                        {rental.propertyType.charAt(0).toUpperCase() + rental.propertyType.slice(1)}
                      </span>
                    </div>
                    {/* Heart + Share */}
                    <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); toast.info('Ajoute aux favoris'); }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition-transform"
                      >
                        <Heart className="w-4 h-4 text-[#D93025]" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toast.info('Lien copie'); }}
                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition-transform"
                      >
                        <Share2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 line-clamp-1">{rental.title}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {rental.city}, {rental.country}
                      {rental.quartier && <span className="text-gray-400"> - {rental.quartier}</span>}
                    </p>

                    {/* Specs */}
                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {rental.maxGuests}</span>
                      <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {rental.bedrooms}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {rental.bathrooms}</span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full"
                        >
                          {AMENITY_ICONS[amenity] || null}
                          {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                        </span>
                      ))}
                      {amenities.length > 4 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full">
                          +{amenities.length - 4}
                        </span>
                      )}
                    </div>

                    {/* OTA Sync badges */}
                    <OtaSyncBadge syncStatus={rental.otaSyncStatus} />

                    {/* Price + Rating */}
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono-data text-xl font-bold text-[#D4AF37]">
                            {formatPrice(effectivePrice.price)}
                          </span>
                          {effectivePrice.isDiscounted && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(rental.pricePerNight)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">FCFA/nuit</span>
                        {effectivePrice.label && (
                          <span className="ml-1 text-[10px] text-[#D4AF37] font-medium">{effectivePrice.label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-sm font-semibold">{rental.rating > 0 ? rental.rating.toFixed(1) : '-'}</span>
                        {rental.reviewCount > 0 && (
                          <span className="text-xs text-gray-400">({rental.reviewCount})</span>
                        )}
                      </div>
                    </div>

                    {/* Host verified badge */}
                    {(rental.hostVerified || rental.hostIdentityVerified) && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {rental.hostVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#003087] font-medium">
                            <BadgeCheck className="w-3 h-3" /> Hote verifie
                          </span>
                        )}
                        {rental.hostIdentityVerified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#00A651] font-medium">
                            <ShieldCheck className="w-3 h-3" /> Identite verifiee
                          </span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenBooking(rental.id); }}
                      className={`w-full mt-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                        rental.instantBooking
                          ? 'bg-[#D4AF37] text-white hover:bg-[#b8961f]'
                          : 'bg-[#003087] text-white hover:bg-[#002060]'
                      }`}
                    >
                      {rental.instantBooking ? (
                        <span className="inline-flex items-center gap-1.5"><Zap className="w-4 h-4" /> Reserver maintenant</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> Demander a reserver</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Map View (placeholder) ── */}
        {!isLoading && !isError && rentals.length > 0 && viewMode === 'map' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border">
            <div className="aspect-[16/9] rounded-2xl bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Vue carte</p>
                <p className="text-xs text-gray-400">Carte interactive bientot disponible</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {rentals.slice(0, 6).map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#003087]/5 text-[#003087] text-xs font-medium cursor-pointer hover:bg-[#003087]/10 transition-colors"
                      onClick={() => setSelectedRentalId(r.id)}
                    >
                      <MapPin className="w-3 h-3" /> {r.title.slice(0, 20)} - {formatPrice(r.pricePerNight)} FCFA
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Rental Detail Panel ── */}
        <AnimatePresence>
          {selectedRentalId && rentalDetail && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
              onClick={() => setSelectedRentalId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl my-8 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Detail header image */}
                <div className="relative aspect-[16/7]">
                  {getFirstImage((rentalDetail as RentalApiItem).images) ? (
                    <ImageWithFallback
                      src={getFirstImage((rentalDetail as RentalApiItem).images)}
                      alt={(rentalDetail as RentalApiItem).title}
                      className="w-full h-full"
                      fallbackType="guesthouse"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Home className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedRentalId(null)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition-transform"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Detail content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">
                    {(rentalDetail as RentalApiItem).title}
                  </h2>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-4 h-4" />
                    {(rentalDetail as RentalApiItem).city}, {(rentalDetail as RentalApiItem).country}
                    {(rentalDetail as RentalApiItem).quartier && ` - ${(rentalDetail as RentalApiItem).quartier}`}
                  </p>

                  {/* Specs row */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Users className="w-4 h-4" /> {(rentalDetail as RentalApiItem).maxGuests} voyageurs</span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><BedDouble className="w-4 h-4" /> {(rentalDetail as RentalApiItem).bedrooms} chambre{(rentalDetail as RentalApiItem).bedrooms > 1 ? 's' : ''}</span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><Bath className="w-4 h-4" /> {(rentalDetail as RentalApiItem).bathrooms} SDB</span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600"><BedDouble className="w-4 h-4" /> {(rentalDetail as RentalApiItem).beds} lit{(rentalDetail as RentalApiItem).beds > 1 ? 's' : ''}</span>
                  </div>

                  {/* OTA sync badges */}
                  <OtaSyncBadge syncStatus={(rentalDetail as RentalApiItem).otaSyncStatus} />

                  {/* Description */}
                  {(rentalDetail as RentalApiItem).description && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-[#2C2E2F] mb-2">Description</h4>
                      <p className="text-sm text-gray-600 leading-relaxed">{(rentalDetail as RentalApiItem).description}</p>
                    </div>
                  )}

                  {/* Amenities */}
                  {parseJsonArray((rentalDetail as RentalApiItem).amenities).length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-[#2C2E2F] mb-2">Equipements</h4>
                      <div className="flex flex-wrap gap-2">
                        {parseJsonArray((rentalDetail as RentalApiItem).amenities).map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-medium rounded-xl"
                          >
                            {AMENITY_ICONS[amenity] || <div className="w-4 h-4" />}
                            {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* House rules & cancellation */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C2E2F] mb-2">Politique d&apos;annulation</h4>
                      <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium ${
                        (rentalDetail as RentalApiItem).cancellationPolicy === 'flexible'
                          ? 'bg-[#00A651]/10 text-[#00A651]'
                          : (rentalDetail as RentalApiItem).cancellationPolicy === 'moderate'
                          ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'bg-[#D93025]/10 text-[#D93025]'
                      }`}>
                        {CANCELLATION_LABELS[(rentalDetail as RentalApiItem).cancellationPolicy] || 'Flexible'}
                      </span>
                    </div>
                    {(rentalDetail as RentalApiItem).cleaningFee > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-[#2C2E2F] mb-2">Frais de menage</h4>
                        <span className="text-sm text-gray-600">{formatPrice((rentalDetail as RentalApiItem).cleaningFee)} FCFA</span>
                      </div>
                    )}
                  </div>

                  {/* Host card */}
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-[#2C2E2F] mb-2">Hote</h4>
                    <HostProfileCard host={(rentalDetail as RentalApiItem).host} />
                  </div>

                  {/* Availability Calendar */}
                  <div className="mt-6 bg-gray-50/50 rounded-2xl p-4">
                    <h4 className="text-sm font-semibold text-[#2C2E2F] mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Disponibilites
                    </h4>
                    <AvailabilityCalendar
                      availability={availDays}
                      checkIn={bookingForm.checkIn}
                      checkOut={bookingForm.checkOut}
                      onDateClick={handleCalDateClick}
                      currentMonth={calMonth}
                      onPrevMonth={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                      onNextMonth={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                    />
                  </div>

                  {/* Pricing summary */}
                  <div className="mt-6 bg-white/80 backdrop-blur-xl rounded-2xl p-4 border">
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <span className="font-mono-data text-2xl font-bold text-[#D4AF37]">
                          {formatPrice(getEffectivePrice(rentalDetail as RentalApiItem).price)}
                        </span>
                        <span className="text-sm text-gray-400 ml-1">FCFA/nuit</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="font-semibold">{(rentalDetail as RentalApiItem).rating > 0 ? (rentalDetail as RentalApiItem).rating.toFixed(1) : '-'}</span>
                        <span className="text-xs text-gray-400">({(rentalDetail as RentalApiItem).reviewCount} avis)</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedRentalId(null); handleOpenBooking(selectedRentalId); }}
                      className={`w-full py-3 rounded-full text-sm font-semibold transition-colors ${
                        (rentalDetail as RentalApiItem).instantBooking
                          ? 'bg-[#D4AF37] text-white hover:bg-[#b8961f]'
                          : 'bg-[#003087] text-white hover:bg-[#002060]'
                      }`}
                    >
                      {(rentalDetail as RentalApiItem).instantBooking ? (
                        <span className="inline-flex items-center gap-1.5"><Zap className="w-4 h-4" /> Reserver maintenant</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> Demander a reserver</span>
                      )}
                    </button>
                  </div>

                  {/* Reviews section */}
                  {(rentalDetail as RentalApiItem).reviewCount > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-[#2C2E2F] flex items-center gap-2">
                          <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                          {(rentalDetail as RentalApiItem).reviewCount} avis
                        </h4>
                        <StarRating rating={(rentalDetail as RentalApiItem).rating} size="md" />
                      </div>
                      <p className="text-xs text-gray-400">Consultez les avis detailles apres reservation.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Booking Modal ── */}
        <AnimatePresence>
          {showBookingModal && bookingRentalId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
              onClick={() => setShowBookingModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-[#2C2E2F]">Reserver</h3>
                  <button onClick={() => setShowBookingModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date d&apos;arrivee</label>
                    <input
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, checkIn: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date de depart</label>
                    <input
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, checkOut: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nombre de voyageurs</label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border">
                      <button
                        onClick={() => setBookingForm((prev) => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium flex-1 text-center">{bookingForm.guests} voyageur{bookingForm.guests > 1 ? 's' : ''}</span>
                      <button
                        onClick={() => setBookingForm((prev) => ({ ...prev, guests: Math.min(16, prev.guests + 1) }))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Demandes speciales</label>
                    <textarea
                      rows={2}
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Ex: arrivee tardive, bebe..."
                      className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  {/* Price summary */}
                  {bookingForm.checkIn && bookingForm.checkOut && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Nuits</span>
                        <span className="font-medium">{getNights(bookingForm.checkIn, bookingForm.checkOut)} nuit{getNights(bookingForm.checkIn, bookingForm.checkOut) > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Voyageurs</span>
                        <span className="font-medium">{bookingForm.guests}</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between">
                        <span className="text-sm font-semibold">Total estimatif</span>
                        <span className="font-mono-data font-bold text-[#D4AF37]">
                          {formatPrice(getNights(bookingForm.checkIn, bookingForm.checkOut) * (rentals.find((r) => r.id === bookingRentalId)?.pricePerNight || 0))} FCFA
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment note */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <CreditCard className="w-4 h-4" />
                    Paiement securise via Mobile Money (FedaPay)
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmitBooking}
                      disabled={createBooking.isPending || !bookingForm.checkIn || !bookingForm.checkOut}
                      className="flex-1 py-3 bg-[#D4AF37] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait hover:bg-[#b8961f] transition-colors"
                    >
                      {createBooking.isPending ? 'Reservation...' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
