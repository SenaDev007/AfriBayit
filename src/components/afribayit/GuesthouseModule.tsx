'use client';

import React, { useState, useMemo, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuesthouses, useGuesthouse, useGuesthouseBookings, useCreateBooking } from '@/hooks/useGuesthouses';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Award,
  BarChart3,
  Bed,
  Calendar,
  CheckCircle,
  ClipboardList,
  Coins,
  Croissant,
  Home,
  Key,
  MapPin,
  PartyPopper,
  Plus,
  Search,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wrench,
  X,
  XCircle,
  Filter,
  ChevronDown,
} from 'lucide-react';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

//  Static UI config (NOT database data)
const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const certificationProcessSteps = [
  { step: 1, title: 'Demande', desc: 'Soumission du dossier de certification', icon: <ClipboardList className="w-4 h-4" /> },
  { step: 2, title: 'Inspection', desc: 'Visite de contrôle qualité AfriBayit', icon: <Search className="w-4 h-4" /> },
  { step: 3, title: 'Conformité', desc: 'Vérification sécurité, hygiène, confort', icon: <CheckCircle className="w-4 h-4" /> },
  { step: 4, title: 'Certification', desc: 'Badge Guesthouse Certifié délivré', icon: <Award className="w-4 h-4" /> },
];

const mealTypeConfig = [
  { key: 'breakfast', label: 'Petit-déjeuner', icon: <Croissant className="w-6 h-6" />, color: '#D4AF37' },
  { key: 'lunch', label: 'Déjeuner', icon: <Users className="w-6 h-6" />, color: '#00A651' },
  { key: 'dinner', label: 'Dîner', icon: <Home className="w-6 h-6" />, color: '#003087' },
];

const roleIconMap: Record<string, ReactNode> = {
  receptionist: <User className="w-4 h-4" />,
  housekeeping: <Home className="w-4 h-4" />,
  cook: <Croissant className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  manager: <Users className="w-4 h-4" />,
  maintenance: <Wrench className="w-4 h-4" />,
  concierge: <Key className="w-4 h-4" />,
};

const staffRoleOptions = [
  { value: 'receptionist', label: 'Réceptionniste' },
  { value: 'housekeeping', label: 'Femme de ménage' },
  { value: 'cook', label: 'Cuisinier(e)' },
  { value: 'security', label: 'Sécurité' },
  { value: 'manager', label: 'Gérant(e)' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'concierge', label: 'Concierge' },
];

const staffSchedulePresets = [
  '7h-15h',
  '15h-23h',
  '23h-7h',
  '8h-17h',
  '9h-18h',
  'Temps plein',
  'Temps partiel matin',
  'Temps partiel après-midi',
];

const pricingPeriodOptions = [
  { value: 'low_season', label: 'Basse saison', icon: <TrendingDown className="w-4 h-4" />, color: '#009CDE' },
  { value: 'high_season', label: 'Haute saison', icon: <TrendingUp className="w-4 h-4" />, color: '#D4AF37' },
  { value: 'event', label: 'Événementiel', icon: <PartyPopper className="w-4 h-4" />, color: '#D93025' },
  { value: 'holiday', label: 'Fêtes', icon: <Calendar className="w-4 h-4" />, color: '#D4AF37' },
  { value: 'custom', label: 'Personnalisé', icon: <BarChart3 className="w-4 h-4" />, color: '#6b7280' },
];

//  API response types
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

//  Helpers
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
      if (parsed.shift) return String(parsed.shift);
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

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    receptionist: 'Réceptionniste',
    housekeeping: 'Femme de ménage',
    cook: 'Cuisinier(e)',
    security: 'Sécurité',
    manager: 'Gérant(e)',
    maintenance: 'Maintenance',
    concierge: 'Concierge',
  };
  return map[role] || role;
}

function getPricingPeriodIcon(period: string): ReactNode {
  const map: Record<string, ReactNode> = {
    low_season: <TrendingDown className="w-5 h-5" />,
    high_season: <TrendingUp className="w-5 h-5" />,
    event: <PartyPopper className="w-5 h-5" />,
    holiday: <Calendar className="w-5 h-5" />,
    custom: <BarChart3 className="w-5 h-5" />,
  };
  return map[period] || <BarChart3 className="w-5 h-5" />;
}

function getPricingPeriodColor(period: string): string {
  const isLow = period === 'low_season';
  const isHigh = period === 'high_season';
  const isEvent = period === 'event' || period === 'holiday';
  return isLow ? '#009CDE' : isHigh ? '#D4AF37' : isEvent ? '#D93025' : '#6b7280';
}

//  Skeleton loaders
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

// Certification badge component
function CertificationBadge({ status }: { status: string }) {
  const isCertified = status === 'certified';
  const isInProgress = status === 'pending';

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold rounded-full text-white ${
      isCertified ? 'bg-[#00A651]' : isInProgress ? 'bg-[#D4AF37]' : 'bg-gray-500'
    }`}>
      {isCertified ? <CheckCircle className="w-3 h-3" /> : isInProgress ? <Calendar className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {isCertified ? 'Certifié' : isInProgress ? 'En cours' : 'Non certifié'}
    </span>
  );
}

//  Main component
type TabKey = 'listings' | 'chambers' | 'booking' | 'meals' | 'staff' | 'pricing' | 'certification';

export default function GuesthouseModule({ onNavigate }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('listings');
  const [selectedGhId, setSelectedGhId] = useState<string | null>(null);
  const { selectedCountry } = useCountry();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [certFilter, setCertFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Staff form state
  const [staffForm, setStaffForm] = useState({ name: '', role: 'receptionist', phone: '', schedule: '' });
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // Pricing rule form state
  const [pricingForm, setPricingForm] = useState({ name: '', period: 'high_season', multiplier: 1.5, startDate: '', endDate: '', eventName: '' });
  const [pricingSubmitting, setPricingSubmitting] = useState(false);

  // Booking dialog state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingRoom, setBookingRoom] = useState<GuesthouseRoomItem | null>(null);
  const [bookingCheckIn, setBookingCheckIn] = useState('');
  const [bookingCheckOut, setBookingCheckOut] = useState('');
  const [bookingGuests, setBookingGuests] = useState(1);
  const [bookingBreakfast, setBookingBreakfast] = useState(false);
  const [dynamicPrice, setDynamicPrice] = useState<number | null>(null);
  const [cancellationPolicy, setCancellationPolicy] = useState<string>('Flexible — Annulation gratuite 24h avant');

  // List query
  const { data: listData, isLoading: listLoading, isError: listError, error: listErrorObj } = useGuesthouses(undefined, selectedCountry);
  const rawGuesthousesList: GuesthouseListItem[] =
    (listData as { guesthouses: GuesthouseListItem[] } | undefined)?.guesthouses ?? [];

  // Filtered list
  const guesthousesList = useMemo(() => {
    let list = rawGuesthousesList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(gh =>
        gh.name.toLowerCase().includes(q) ||
        gh.city.toLowerCase().includes(q) ||
        gh.country.toLowerCase().includes(q)
      );
    }
    if (certFilter !== 'all') {
      list = list.filter(gh => gh.certificationStatus === certFilter);
    }
    return list;
  }, [rawGuesthousesList, searchQuery, certFilter]);

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
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-based
    const cells: { day: number | null; booked: boolean }[] = [];
    for (let i = 0; i < offset; i++) cells.push({ day: null, booked: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, booked: bookedDays.has(d) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, booked: false });
    return cells;
  }, [bookedDays]);

  // Create booking mutation
  const createBooking = useCreateBooking(effectiveGhId || '');

  const tabs: { key: TabKey; label: string; icon: ReactNode }[] = [
    { key: 'listings', label: 'Listings', icon: <Home className="w-4 h-4" /> },
    { key: 'chambers', label: 'Chambres', icon: <Bed className="w-4 h-4" /> },
    { key: 'booking', label: 'Réservations', icon: <Calendar className="w-4 h-4" /> },
    { key: 'meals', label: 'Repas', icon: <Croissant className="w-4 h-4" /> },
    { key: 'staff', label: 'Personnel', icon: <Users className="w-4 h-4" /> },
    { key: 'pricing', label: 'Tarifs saisonniers', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'certification', label: 'Certification', icon: <Award className="w-4 h-4" /> },
  ];

  // Open booking dialog for a room
  const handleOpenBooking = useCallback((room: GuesthouseRoomItem) => {
    setBookingRoom(room);
    setBookingCheckIn('');
    setBookingCheckOut('');
    setBookingGuests(1);
    setBookingBreakfast(false);
    setDynamicPrice(null);
    setShowBookingDialog(true);
  }, []);

  // Calculate dynamic price when dates change
  useEffect(() => {
    let cancelled = false;
    if (!bookingRoom || !bookingCheckIn || !bookingCheckOut) return;
    (async () => {
      try {
        const resp = await fetch('/api/hotels/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            basePrice: bookingRoom.basePrice,
            checkIn: bookingCheckIn,
            checkOut: bookingCheckOut,
            country: activeDetail?.country || 'BJ',
            includeBreakdown: false,
          }),
        });
        if (resp.ok && !cancelled) {
          const data = await resp.json();
          setDynamicPrice(data.dynamicPrice);
          if (data.season === 'haute') setCancellationPolicy('Modérée — Annulation gratuite 5 jours avant');
          else if (data.season === 'basse') setCancellationPolicy('Flexible — Annulation gratuite 24h avant');
          else setCancellationPolicy('Flexible — Annulation gratuite 24h avant');
        }
      } catch {
        // Fallback to base price
      }
    })();
    return () => { cancelled = true; };
  }, [bookingRoom, bookingCheckIn, bookingCheckOut, activeDetail]);

  // Submit booking
  const handleSubmitBooking = () => {
    if (!bookingRoom || !bookingCheckIn || !bookingCheckOut || !effectiveGhId) return;

    const checkIn = new Date(bookingCheckIn);
    const checkOut = new Date(bookingCheckOut);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const pricePerNight = dynamicPrice || bookingRoom.basePrice;
    const totalPrice = pricePerNight * nights;

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

  // Compute min/max price for a guesthouse
  function getPriceRange(gh: GuesthouseListItem): { min: number; max: number } {
    if (gh.rooms.length === 0) return { min: 0, max: 0 };
    const prices = gh.rooms.map(r => r.basePrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }

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
            <Home className="w-4 h-4" /> PMS Hôtelier — CDC §5.3
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
            <Coins className="w-5 h-5 text-[#D4AF37]" />
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
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, ville ou pays..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20"
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
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                      showFilters || certFilter !== 'all' ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Filter className="w-4 h-4" /> Filtres
                    {certFilter !== 'all' && <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />}
                  </button>
                  <button
                    onClick={() => onNavigate?.('publish')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00A651] text-white rounded-full text-sm font-semibold hover:bg-[#008f47] transition-colors"
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
                      {[
                        { value: 'all', label: 'Toutes' },
                        { value: 'certified', label: 'Certifiées' },
                        { value: 'pending', label: 'En cours' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setCertFilter(opt.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                    <XCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Impossible de charger les guesthouses</h3>
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
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#003087]/5 mb-6">
                    <Home className="w-10 h-10 text-[#003087]/40" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-[#2C2E2F] mb-2">
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
                        className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4" /> Réinitialiser les filtres
                      </button>
                    )}
                    <button
                      onClick={() => onNavigate?.('publish')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#00A651] text-white rounded-full text-sm font-semibold hover:bg-[#008f47] transition-colors shadow-lg shadow-[#00A651]/20"
                    >
                      <Plus className="w-4 h-4" /> Publier une guesthouse
                    </button>
                  </div>

                  {/* How it works mini section */}
                  <div className="mt-12 max-w-2xl mx-auto">
                    <h4 className="text-sm font-semibold text-[#2C2E2F] mb-4">Comment ça marche ?</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { icon: <ClipboardList className="w-5 h-5" />, title: 'Inscrivez votre guesthouse', desc: 'Ajoutez vos informations, photos et chambres' },
                        { icon: <Search className="w-5 h-5" />, title: 'Obtenez la certification', desc: 'Inspection qualité AfriBayit pour rassurer vos clients' },
                        { icon: <Coins className="w-5 h-5" />, title: 'Recevez des réservations', desc: 'Gestion complète avec paiement sécurisé via AfriBayit' },
                      ].map((step, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border shadow-sm text-center">
                          <div className="w-10 h-10 rounded-full bg-[#003087]/5 flex items-center justify-center mx-auto mb-3 text-[#003087]">
                            {step.icon}
                          </div>
                          <p className="text-xs font-semibold text-[#2C2E2F] mb-1">{step.title}</p>
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
                        ? `${new Intl.NumberFormat('fr-FR').format(min)} FCFA`
                        : `${new Intl.NumberFormat('fr-FR').format(min)} – ${new Intl.NumberFormat('fr-FR').format(max)} FCFA`;
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
                                <Home className="w-12 h-12 text-gray-300" />
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <CertificationBadge status={gh.certificationStatus} />
                            </div>
                            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-mono flex items-center gap-1">
                              <Bed className="w-3 h-3" /> {gh.rooms.length} chambre{gh.rooms.length > 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-display text-base font-bold text-[#2C2E2F] group-hover:text-[#003087] transition-colors">
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
                  <Bed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
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
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        cd.day === null ? '' :
                        cd.booked
                          ? 'bg-[#D93025]/10 text-[#D93025] cursor-pointer'
                          : 'bg-[#00A651]/5 text-[#2C2E2F] hover:bg-[#00A651]/20 cursor-pointer'
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
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${mtc.color}10`, color: mtc.color }}>
                          {mtc.icon}
                        </div>
                        <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">{mtc.label}</h4>
                        {meal ? (
                          <>
                            <p className="font-mono text-2xl font-bold" style={{ color: mtc.color }}>
                              {new Intl.NumberFormat('fr-FR').format(meal.price)} FCFA
                            </p>
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-[#00A651]/10 text-[#00A651] text-[10px] font-semibold rounded-full">
                              <CheckCircle className="w-3 h-3" /> Disponible
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
              <div className="flex items-center justify-between gap-2 mb-4">
                <select
                  value={effectiveGhId || ''}
                  onChange={e => setSelectedGhId(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>

              {/* Add Staff Form */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-3">Ajouter un membre du personnel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Nom complet *</label>
                    <input
                      type="text"
                      placeholder="Ex: Aminata Dossou"
                      value={staffForm.name}
                      onChange={e => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Rôle *</label>
                    <select
                      value={staffForm.role}
                      onChange={e => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    >
                      {staffRoleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="Ex: +229 90 00 00 00"
                      value={staffForm.phone}
                      onChange={e => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Horaires</label>
                    <select
                      value={staffForm.schedule}
                      onChange={e => setStaffForm(prev => ({ ...prev, schedule: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    >
                      <option value="">-- Sélectionner --</option>
                      {staffSchedulePresets.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={async () => {
                        if (!staffForm.name.trim()) { toast.error('Le nom est requis'); return; }
                        if (!effectiveGhId) return;
                        setStaffSubmitting(true);
                        try {
                          const resp = await fetch(`/api/guesthouses/${effectiveGhId}/staff`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: staffForm.name,
                              role: staffForm.role,
                              phone: staffForm.phone || null,
                              schedule: staffForm.schedule ? JSON.stringify({ shift: staffForm.schedule }) : null,
                            }),
                          });
                          if (resp.ok) {
                            toast.success('Personnel ajouté', { description: `${staffForm.name} ajouté(e) comme ${staffRoleOptions.find(r => r.value === staffForm.role)?.label}` });
                            setStaffForm({ name: '', role: 'receptionist', phone: '', schedule: '' });
                          } else {
                            toast.error('Erreur lors de l\'ajout');
                          }
                        } catch {
                          toast.error('Erreur réseau lors de l\'ajout');
                        }
                        setStaffSubmitting(false);
                      }}
                      disabled={staffSubmitting || !staffForm.name.trim()}
                      className="w-full px-3 py-2 bg-[#00A651] text-white rounded-xl text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50"
                    >
                      {staffSubmitting ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </div>
                </div>
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
                    const icon = roleIconMap[s.role] || <User className="w-4 h-4" />;
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, ease: easeOut }}
                        className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087]">
                            {icon}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">{s.name}</p>
                            <p className="text-xs text-gray-500">{getRoleLabel(s.role)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {schedule && (
                            <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600">{schedule}</span>
                          )}
                          <button
                            onClick={async () => {
                              if (!effectiveGhId) return;
                              try {
                                const resp = await fetch(`/api/guesthouses/${effectiveGhId}/staff/${s.id}`, { method: 'DELETE' });
                                if (resp.ok) {
                                  toast.success('Personnel retiré', { description: `${s.name} a été retiré(e)` });
                                } else {
                                  toast.error('Erreur lors du retrait');
                                }
                              } catch {
                                toast.error('Erreur réseau lors du retrait');
                              }
                            }}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Retirer
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Aucun personnel enregistré pour cette guesthouse.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== SEASONAL PRICING ===== */}
          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Guesthouse selector */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <select
                  value={effectiveGhId || ''}
                  onChange={e => setSelectedGhId(e.target.value)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>

              {/* Add Pricing Rule Form */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border mb-4">
                <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-3">Ajouter une règle de tarification saisonnière</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Nom de la règle *</label>
                    <input
                      type="text"
                      placeholder="Ex: Fêtes de fin d'année"
                      value={pricingForm.name}
                      onChange={e => setPricingForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Période *</label>
                    <select
                      value={pricingForm.period}
                      onChange={e => setPricingForm(prev => ({ ...prev, period: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    >
                      {pricingPeriodOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Multiplicateur *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="5"
                      value={pricingForm.multiplier}
                      onChange={e => setPricingForm(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                    <p className="text-[9px] text-gray-400 mt-0.5">{formatModifier(pricingForm.multiplier)} du prix de base</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Date début</label>
                    <input
                      type="date"
                      value={pricingForm.startDate}
                      onChange={e => setPricingForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Date fin</label>
                    <input
                      type="date"
                      value={pricingForm.endDate}
                      onChange={e => setPricingForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={async () => {
                        if (!pricingForm.name.trim()) { toast.error('Le nom de la règle est requis'); return; }
                        if (!effectiveGhId) return;
                        setPricingSubmitting(true);
                        try {
                          const resp = await fetch(`/api/guesthouses/${effectiveGhId}/pricing-rules`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: pricingForm.name,
                              period: pricingForm.period,
                              multiplier: pricingForm.multiplier,
                              startDate: pricingForm.startDate || null,
                              endDate: pricingForm.endDate || null,
                              eventName: pricingForm.eventName || null,
                            }),
                          });
                          if (resp.ok) {
                            toast.success('Règle tarifaire ajoutée', { description: `${pricingForm.name} — ${formatModifier(pricingForm.multiplier)}` });
                            setPricingForm({ name: '', period: 'high_season', multiplier: 1.5, startDate: '', endDate: '', eventName: '' });
                          } else {
                            toast.error('Erreur lors de l\'ajout de la règle');
                          }
                        } catch {
                          toast.error('Erreur réseau lors de l\'ajout');
                        }
                        setPricingSubmitting(false);
                      }}
                      disabled={pricingSubmitting || !pricingForm.name.trim()}
                      className="w-full px-3 py-2 bg-[#00A651] text-white rounded-xl text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50"
                    >
                      {pricingSubmitting ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </div>
                </div>
                {/* Event name field for event period */}
                {(pricingForm.period === 'event' || pricingForm.period === 'holiday') && (
                  <div className="mt-3">
                    <label className="text-[10px] text-gray-500 block mb-1">Nom de l&apos;événement</label>
                    <input
                      type="text"
                      placeholder="Ex: Festival Vodoun, Fêtes de fin d'année"
                      value={pricingForm.eventName}
                      onChange={e => setPricingForm(prev => ({ ...prev, eventName: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:border-[#003087]"
                    />
                  </div>
                )}
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
                    const color = getPricingPeriodColor(pr.period);
                    return (
                      <motion.div
                        key={pr.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, ease: easeOut }}
                        className="bg-white rounded-3xl p-5 shadow-sm border text-center relative group/pricing"
                      >
                        <button
                          onClick={async () => {
                            if (!effectiveGhId) return;
                            try {
                              const resp = await fetch(`/api/guesthouses/${effectiveGhId}/pricing-rules/${pr.id}`, { method: 'DELETE' });
                              if (resp.ok) {
                                toast.success('Règle tarifaire supprimée', { description: pr.name });
                              } else {
                                toast.error('Erreur lors de la suppression');
                              }
                            } catch {
                              toast.error('Erreur réseau lors de la suppression');
                            }
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover/pricing:opacity-100 transition-all"
                          title="Supprimer cette règle"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="mb-2 mx-auto w-fit" style={{ color }}>{getPricingPeriodIcon(pr.period)}</div>
                        <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-0.5">{pr.name}</h4>
                        <p className="text-[10px] text-gray-400 mb-1">{periodLabel(pr.period)}</p>
                        <p className="font-mono text-2xl font-bold mb-1" style={{ color }}>{formatModifier(pr.multiplier)}</p>
                        <p className="text-xs text-gray-500">{formatPeriodDates(pr.startDate, pr.endDate, pr.event_name)}</p>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
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
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
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

                {/* Certification status for current guesthouse */}
                {activeDetail && (
                  <div className={`p-4 rounded-2xl mb-4 ${
                    activeDetail.certificationStatus === 'certified' ? 'bg-[#00A651]/5' :
                    activeDetail.certificationStatus === 'pending' ? 'bg-[#D4AF37]/5' :
                    'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {activeDetail.certificationStatus === 'certified' ? (
                        <CheckCircle className="w-4 h-4 text-[#00A651]" />
                      ) : activeDetail.certificationStatus === 'pending' ? (
                        <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-500" />
                      )}
                      <p className="text-sm text-[#2C2E2F] font-semibold">
                        {activeDetail.certificationStatus === 'certified'
                          ? 'Guesthouse certifiée'
                          : activeDetail.certificationStatus === 'pending'
                          ? 'En cours de certification'
                          : 'Non certifiée'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {activeDetail.certificationStatus === 'certified'
                        ? 'Cette guesthouse a passé avec succès l\'inspection AfriBayit.'
                        : activeDetail.certificationStatus === 'pending'
                        ? 'Votre demande est en cours de traitement. L\'inspection sera planifiée sous 5 jours ouvrés.'
                        : 'Soumettez votre demande de certification pour rassurer vos futurs clients.'}
                    </p>
                  </div>
                )}

                {!activeDetail && (
                  <div className="p-4 bg-[#D4AF37]/5 rounded-2xl">
                    <p className="text-sm text-[#2C2E2F] font-semibold mb-1">En cours de certification</p>
                    <p className="text-xs text-gray-500">Votre demande est en cours de traitement. L&apos;inspection sera planifiée sous 5 jours ouvrés.</p>
                  </div>
                )}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Réserver {bookingRoom.name}</h3>
              <button
                onClick={() => setShowBookingDialog(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              {new Intl.NumberFormat('fr-FR').format(dynamicPrice || bookingRoom.basePrice)} FCFA / nuit · {bookingRoom.capacity} pers.
            </p>
            {dynamicPrice && dynamicPrice !== bookingRoom.basePrice && (
              <p className="text-[10px] text-[#D4AF37] mb-1 flex items-center gap-1"><Coins className="w-3 h-3" /> Tarif dynamique appliqué (base: {new Intl.NumberFormat('fr-FR').format(bookingRoom.basePrice)} FCFA)</p>
            )}
            <p className="text-[10px] text-gray-400 mb-4 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {cancellationPolicy}</p>

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
                    const pPerNight = dynamicPrice || bookingRoom.basePrice;
                    const total = pPerNight * nights;
                    return (
                      <>
                        <p className="text-xs text-gray-500">{nights} nuit(s) × {new Intl.NumberFormat('fr-FR').format(pPerNight)} FCFA</p>
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
