'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useHotels, useHotel, useCreateHotelBooking } from '@/hooks/useHotels';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Hotel, Star } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

//  API response types 
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
  rooms: unknown[];
  createdAt?: string;
  _count?: { reviews_hotel?: number };
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

//  Skeleton loaders 
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

function CalendarSkeleton() {
  return (
    <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  );
}

//  Main component 
export default function HospitalityModule() {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingHotelId, setBookingHotelId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    specialRequests: '',
  });
  const { user } = useAuthStore();
  const { selectedCountry } = useCountry();

  const { data: hotelsData, isLoading, isError, error } = useHotels(undefined, selectedCountry);
  const { data: hotelDetail } = useHotel(selectedHotelId || '');

  const createBooking = useCreateHotelBooking();

  const hotels: HotelApiItem[] = (hotelsData as { hotels: HotelApiItem[] } | undefined)?.hotels ?? [];

  const handleOpenBooking = (hotelId: string) => {
    setBookingHotelId(hotelId);
    setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
    setShowBookingDialog(true);
  };

  const handleSubmitBooking = () => {
    if (!bookingHotelId) return;
    createBooking.mutate(
      {
        hotelId: bookingHotelId,
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
          setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible de créer la réservation.', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
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
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Impossible de charger les hôtels</h3>
            <p className="text-sm text-gray-500">{(error as Error)?.message || 'Une erreur est survenue. Veuillez réessayer.'}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && hotels.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Aucun hôtel disponible</h3>
            <p className="text-sm text-gray-500">Les hôtels seront bientôt disponibles. Revenez plus tard.</p>
          </div>
        )}

        {/* Hotels Grid */}
        {!isLoading && !isError && hotels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel, i) => {
              const amenities = parseJsonArray(hotel.amenities);
              const image = getFirstImage(hotel.images);
              return (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm border"
                >
                  <div className="relative aspect-[16/10]">
                    {image ? (
                      <ImageWithFallback src={image} alt={hotel.name} className="w-full h-full" fallbackType="hotel" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1">
                      {Array.from({ length: hotel.stars }).map((_, j) => (
                        <span key={j} className="text-[#D4AF37] text-sm"><Star className="w-4 h-4" /></span>
                      ))}
                    </div>
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold ${
                      hotel.available ? 'bg-[#00A651] text-white' : 'bg-gray-500 text-white'
                    }`}>
                      {hotel.available ? 'Disponible' : 'Complet'}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">{hotel.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {hotel.city}, {hotel.country}
                    </p>
                    {hotel.createdAt && (
                      <p className="text-[10px] text-gray-400 mb-3">Publié {timeAgo(hotel.createdAt)}</p>
                    )}

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {amenities.slice(0, 4).map((amenity) => (
                        <span key={amenity} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">
                          {amenity}
                        </span>
                      ))}
                      {amenities.length > 4 && (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full">
                          +{amenities.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="font-mono-data text-xl font-bold text-[#D4AF37]">
                          {new Intl.NumberFormat('fr-FR').format(hotel.pricePerNight)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">FCFA/nuit</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold">{hotel.rating}</span>
                      </div>
                    </div>

                    {hotel.available && (
                      <button
                        onClick={() => handleOpenBooking(hotel.id)}
                        className="w-full mt-4 py-2.5 bg-[#D4AF37] text-white rounded-full text-sm font-semibold hover:bg-[#b8961f] transition-colors"
                      >
                        Réserver
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Availability Calendar */}
        {selectedHotelId && (
          isLoading ? (
            <CalendarSkeleton />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-white rounded-3xl p-6 shadow-sm border"
            >
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">
                Disponibilités — {hotelDetail ? (hotelDetail as { name?: string })?.name || 'Hôtel' : 'Chargement…'}
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => {
                  const day = i + 1;
                  // All days shown as available — real availability would come from RoomAvailability API data
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-xl flex items-center justify-center text-xs font-medium cursor-pointer transition-colors bg-[#00A651]/10 text-[#00A651] hover:bg-[#00A651]/20"
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/10 rounded" /> Disponible</span>
              </div>
            </motion.div>
          )
        )}

        {/* Booking Dialog */}
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
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Réserver</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date d&apos;arrivée</label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Date de départ</label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nombre de guests</label>
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
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingDialog(false)}
                    className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitBooking}
                    disabled={createBooking.isPending || !bookingForm.checkIn || !bookingForm.checkOut}
                    className="flex-1 py-3 bg-[#D4AF37] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
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
