// P3.7-2 — HospitalityModule orchestrator.
// Owns view/filter/booking state and SWR queries, delegates rendering
// to HotelList, HotelDetail, and BookingDialog.

'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Hotel } from 'lucide-react';
import { useHotelsFiltered, useHotel, useHotelRooms, useHotelReviews, useCreateHotelBooking } from '@/hooks/useHotels';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import BookingDialog from './BookingDialog';
import HotelDetail from './HotelDetail';
import HotelList from './HotelList';
import type {
  BookingFormState,
  HotelApiItem,
  HotelDetailApiItem,
  HotelPagination,
  HotelsApiResponse,
  ReviewApiItem,
  RoomApiItem,
  View,
} from './types';
import { DEFAULT_BOOKING_FORM, DEFAULT_PRICE_RANGE } from './types';

export default function HospitalityModule() {
  // View state
  const [view, setView] = useState<View>('list');
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);

  // Filter state
  const [searchCity, setSearchCity] = useState('');
  const [filterStars, setFilterStars] = useState(0);
  const [filterAvailable, setFilterAvailable] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>(DEFAULT_PRICE_RANGE);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Booking state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingHotelId, setBookingHotelId] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<BookingFormState>(DEFAULT_BOOKING_FORM);

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

  const hotels: HotelApiItem[] =
    ((hotelsData as HotelsApiResponse | undefined)?.hotels as HotelApiItem[] | undefined) ?? [];
  const pagination = (hotelsData as { pagination?: HotelPagination } | undefined)?.pagination;

  const detail = hotelDetail as HotelDetailApiItem | undefined;
  const rooms: RoomApiItem[] = (roomsData as RoomApiItem[] | undefined) ?? [];
  const reviews: ReviewApiItem[] =
    ((reviewsData as { reviews: ReviewApiItem[] } | undefined)?.reviews as ReviewApiItem[] | undefined) ?? [];

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
    return cfg ? [...cfg.cities] : [];
  }, [selectedCountry]);

  const hasActiveFilters =
    searchCity ||
    filterStars > 0 ||
    filterAvailable ||
    priceRange[0] > 0 ||
    priceRange[1] < DEFAULT_PRICE_RANGE[1];

  // Handlers
  const handleSelectHotel = (hotelId: string) => {
    setSelectedHotelId(hotelId);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedHotelId(null);
  };

  const handleOpenBooking = (hotelId: string, roomId?: string) => {
    setBookingHotelId(hotelId);
    setSelectedRoomId(roomId || null);
    setBookingForm(DEFAULT_BOOKING_FORM);
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
          toast({
            title: 'Réservation confirmée',
            description: 'Votre réservation a été enregistrée avec succès.',
          });
          setShowBookingDialog(false);
          setBookingHotelId(null);
          setSelectedRoomId(null);
          setBookingForm(DEFAULT_BOOKING_FORM);
        },
        onError: (err) => {
          toast({
            title: 'Erreur',
            description: err.message || 'Impossible de créer la réservation.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const resetFilters = () => {
    setSearchCity('');
    setFilterStars(0);
    setFilterAvailable(false);
    setPriceRange(DEFAULT_PRICE_RANGE);
    setPage(1);
  };

  // Show booking dialog only when the selected hotel matches the booking hotel
  const bookingDetail = bookingHotelId === selectedHotelId ? detail : undefined;

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
          <HotelList
            searchCity={searchCity}
            setSearchCity={setSearchCity}
            filterStars={filterStars}
            setFilterStars={setFilterStars}
            filterAvailable={filterAvailable}
            setFilterAvailable={setFilterAvailable}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            page={page}
            setPage={setPage}
            cities={cities}
            selectedCountry={selectedCountry}
            hasActiveFilters={!!hasActiveFilters}
            onResetFilters={resetFilters}
            hotels={filteredHotels}
            pagination={pagination}
            isLoading={isLoading}
            isError={isError}
            errorMessage={(error as Error)?.message}
            onSelectHotel={handleSelectHotel}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {/* ─── DETAIL VIEW ─── */}
        {view === 'detail' && selectedHotelId && (
          <HotelDetail
            detail={detail}
            rooms={rooms}
            reviews={reviews}
            detailLoading={detailLoading}
            roomsLoading={roomsLoading}
            onBackToList={handleBackToList}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {/* ─── BOOKING DIALOG ─── */}
        <BookingDialog
          open={showBookingDialog && !!bookingHotelId}
          detail={bookingDetail}
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          setSelectedRoomId={setSelectedRoomId}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          onSubmit={handleSubmitBooking}
          isPending={createBooking.isPending}
          onClose={() => setShowBookingDialog(false)}
        />
      </div>
    </section>
  );
}
