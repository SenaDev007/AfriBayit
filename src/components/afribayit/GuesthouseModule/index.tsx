'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuesthouses, useGuesthouse, useGuesthouseBookings, useCreateBooking } from '@/hooks/useGuesthouses';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api-client';
import {
  Award,
  Bed,
  Calendar,
  Coins,
  Croissant,
  Home,
  TrendingUp,
  Users,
} from 'lucide-react';

import type {
  ModuleProps,
  TabKey,
  TabConfig,
  GuesthouseListItem,
  GuesthouseDetail,
  GuesthouseRoomItem,
  BookingItem,
  CalendarCell,
} from './types';

import ListingsPanel from './ListingsPanel';
import ChambersPanel from './ChambersPanel';
import BookingCalendarPanel from './BookingCalendarPanel';
import MealsPanel from './MealsPanel';
import StaffPanel from './StaffPanel';
import PricingPanel from './PricingPanel';
import CertificationPanel from './CertificationPanel';
import BookingDialog from './BookingDialog';
import { useTranslation } from '@/lib/i18n/use-translate';

export default function GuesthouseModule({ onNavigate }: ModuleProps) {
  const { t } = useTranslation();
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
  const [cancellationPolicy, setCancellationPolicy] = useState<string>('');

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
  const calendarDays = useMemo<CalendarCell[]>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-based
    const cells: CalendarCell[] = [];
    for (let i = 0; i < offset; i++) cells.push({ day: null, booked: false });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, booked: bookedDays.has(d) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, booked: false });
    return cells;
  }, [bookedDays]);

  // Create booking mutation
  const createBooking = useCreateBooking(effectiveGhId || '');

  const tabs: TabConfig[] = [
    { key: 'listings', label: t('guesthouse.tabListings', 'Listings'), icon: <Home className="w-4 h-4" /> },
    { key: 'chambers', label: t('guesthouse.tabChambers', 'Chambres'), icon: <Bed className="w-4 h-4" /> },
    { key: 'booking', label: t('guesthouse.tabBooking', 'Réservations'), icon: <Calendar className="w-4 h-4" /> },
    { key: 'meals', label: t('guesthouse.tabMeals', 'Repas'), icon: <Croissant className="w-4 h-4" /> },
    { key: 'staff', label: t('guesthouse.tabStaff', 'Personnel'), icon: <Users className="w-4 h-4" /> },
    { key: 'pricing', label: t('guesthouse.tabPricing', 'Tarifs saisonniers'), icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'certification', label: t('guesthouse.tabCertification', 'Certification'), icon: <Award className="w-4 h-4" /> },
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
        // Round 3 — Gap 24 fix: use `apiFetch` (carries JWT + country
        // header) and the correct backend route
        // (`/hotels/pricing/calculate`, no `/api/` prefix).
        const data = await apiFetch<any>('/hotels/pricing/calculate', {
          method: 'POST',
          body: {
            // Backend expects `hotelId` + `roomId`; we don't have a
            // hotelId here so we pass the guesthouse id and the room id.
            hotelId: activeDetail?.id,
            roomId: bookingRoom.id,
            basePrice: bookingRoom.basePrice,
            checkIn: bookingCheckIn,
            checkOut: bookingCheckOut,
            country: activeDetail?.country || 'BJ',
            includeBreakdown: false,
          },
        });
        if (!cancelled) {
          setDynamicPrice(data.dynamicPrice ?? data.total ?? data.pricePerNight);
          if (data.season === 'haute') setCancellationPolicy(t('guesthouse.policyModerate', 'Modérée — Annulation gratuite 5 jours avant'));
          else if (data.season === 'basse') setCancellationPolicy(t('guesthouse.policyFlexible', 'Flexible — Annulation gratuite 24h avant'));
          else setCancellationPolicy(t('guesthouse.policyFlexible', 'Flexible — Annulation gratuite 24h avant'));
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
          toast.success(t('guesthouse.bookingConfirmed', 'Réservation confirmée'), { description: t('guesthouse.bookingConfirmedDesc', `${bookingRoom.name} réservée pour ${nights} nuit(s)`) });
          setShowBookingDialog(false);
          setBookingRoom(null);
        },
        onError: (error: Error) => {
          toast.error(t('guesthouse.bookingError', 'Erreur lors de la réservation'), { description: error.message });
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
            <Home className="w-4 h-4" /> {t('guesthouse.badge', 'PMS Hôtelier')}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0a2a5e] mb-3">
            {t('guesthouse.headerTitle1', 'Maisons')} <span className="text-[#00A651]">{t('guesthouse.headerTitleAccent', "d'Hôtes")}</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            {t('guesthouse.headerSubtitle', 'Gestion complète de votre guesthouse : chambres, réservations, repas et personnel')}
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">{t('guesthouse.countryLabel', 'Pays:')}</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#003087]/10 text-[#003087] text-xs font-semibold">
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
              <p className="text-sm font-semibold text-[#0a2a5e]">{t('guesthouse.revenueModel', 'Modèle de revenus')}</p>
              <p className="text-xs text-gray-500">{t('guesthouse.commissionInfo', 'Commission voyageur : 10-13% · Commission propriétaire : 3%')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#00A651]">10-13%</p>
              <p className="text-[10px] text-gray-500">{t('guesthouse.traveler', 'Voyageur')}</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#003087]">3%</p>
              <p className="text-[10px] text-gray-500">{t('guesthouse.owner', 'Propriétaire')}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'listings' && (
            <ListingsPanel
              guesthousesList={guesthousesList}
              listLoading={listLoading}
              listError={listError}
              listErrorObj={listErrorObj}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              certFilter={certFilter}
              setCertFilter={setCertFilter}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              onNavigate={onNavigate}
              onSelectGuesthouse={(id) => { setSelectedGhId(id); setActiveTab('chambers'); }}
            />
          )}

          {activeTab === 'chambers' && (
            <ChambersPanel
              guesthousesList={guesthousesList}
              effectiveGhId={effectiveGhId}
              setSelectedGhId={setSelectedGhId}
              detailLoadingState={detailLoadingState}
              activeDetail={activeDetail}
              onOpenBooking={handleOpenBooking}
            />
          )}

          {activeTab === 'booking' && (
            <BookingCalendarPanel calendarDays={calendarDays} />
          )}

          {activeTab === 'meals' && (
            <MealsPanel
              guesthousesList={guesthousesList}
              effectiveGhId={effectiveGhId}
              setSelectedGhId={setSelectedGhId}
              detailLoadingState={detailLoadingState}
              activeDetail={activeDetail}
            />
          )}

          {activeTab === 'staff' && (
            <StaffPanel
              guesthousesList={guesthousesList}
              effectiveGhId={effectiveGhId}
              setSelectedGhId={setSelectedGhId}
              detailLoadingState={detailLoadingState}
              activeDetail={activeDetail}
              staffForm={staffForm}
              setStaffForm={setStaffForm}
              staffSubmitting={staffSubmitting}
              setStaffSubmitting={setStaffSubmitting}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingPanel
              guesthousesList={guesthousesList}
              effectiveGhId={effectiveGhId}
              setSelectedGhId={setSelectedGhId}
              detailLoadingState={detailLoadingState}
              activeDetail={activeDetail}
              pricingForm={pricingForm}
              setPricingForm={setPricingForm}
              pricingSubmitting={pricingSubmitting}
              setPricingSubmitting={setPricingSubmitting}
            />
          )}

          {activeTab === 'certification' && (
            <CertificationPanel activeDetail={activeDetail} />
          )}
        </AnimatePresence>
      </div>

      {/* Booking Dialog */}
      {showBookingDialog && bookingRoom && (
        <BookingDialog
          bookingRoom={bookingRoom}
          bookingCheckIn={bookingCheckIn}
          setBookingCheckIn={setBookingCheckIn}
          bookingCheckOut={bookingCheckOut}
          setBookingCheckOut={setBookingCheckOut}
          bookingGuests={bookingGuests}
          setBookingGuests={setBookingGuests}
          bookingBreakfast={bookingBreakfast}
          setBookingBreakfast={setBookingBreakfast}
          dynamicPrice={dynamicPrice}
          cancellationPolicy={cancellationPolicy}
          onClose={() => setShowBookingDialog(false)}
          onConfirm={handleSubmitBooking}
          isPending={createBooking.isPending}
        />
      )}
    </section>
  );
}
