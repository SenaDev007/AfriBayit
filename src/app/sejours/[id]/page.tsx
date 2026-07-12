'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Star,
  MapPin,
  Calendar,
  Users,
  Wifi,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Coffee,
  Tv,
  Wind,
  Shield,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Smartphone,
  MessageSquare,
  Check,
  Phone,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for PropertyMap to avoid SSR issues with Mapbox
const PropertyMap = dynamic(
  () => import('@/components/afribayit/PropertyMap'),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-gray-300" />
    </div>
  ) }
);

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  pool: Waves,
  gym: Dumbbell,
  breakfast: Coffee,
  tv: Tv,
  ac: Wind,
  security: Shield,
};

const easeOut = [0.16, 1, 0.3, 1] as const;

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try { const parsed = JSON.parse(raw); return (Array.isArray(parsed) ? parsed : fallback) as T; } catch { return fallback; }
}

export default function BookingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [currentImage, setCurrentImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');

  // Try hotel first, then guesthouse
  const { data: hotelData, isLoading: hotelLoading } = useQuery({
    queryKey: ['booking-hotel', id],
    queryFn: () =>
      apiFetch<{
        id: string;
        name: string;
        city: string;
        country: string;
        stars: number;
        rating: number;
        pricePerNight: number;
        currency: string;
        amenities: string | null;
        images: string | null;
        policies: string | null;
        rooms: Array<{
          id: string;
          type: string;
          name: string | null;
          capacity: number;
          amenities: string | null;
          basePriceXof: number;
          currency: string;
          totalRooms: number;
          available: boolean;
        }>;
        reviews_hotel: Array<{
          id: string;
          overall: number;
          comment: string | null;
          cleanliness: number | null;
          comfort: number | null;
          location: number | null;
          value: number | null;
          service: number | null;
          createdAt: string;
          response: string | null;
        }>;
        _count: { rooms: number; bookings: number; reviews_hotel: number };
      }>(`/api/hotels/${id}`),
    retry: false,
  });

  const { data: guesthouseData, isLoading: ghLoading } = useQuery({
    queryKey: ['booking-guesthouse', id],
    queryFn: () =>
      apiFetch<{
        id: string;
        name: string;
        city: string;
        country: string;
        overallRating: number;
        reviewCount: number;
        description: string | null;
        images: string | null;
        amenities: string | null;
        address: string | null;
        quartier: string | null;
        rooms: Array<{
          id: string;
          name: string;
          capacity: number;
          basePrice: number;
          currency: string;
          amenities: string | null;
          available: boolean;
        }>;
        meals: Array<{
          id: string;
          mealType: string;
          price: number;
          currency: string;
          includedInPrice: boolean;
          description: string | null;
        }>;
      }>(`/api/guesthouses/${id}`),
    enabled: !hotelData,
    retry: false,
  });

  const isLoading = hotelLoading || ghLoading;
  const hotel = hotelData;
  const guesthouse = guesthouseData;
  const isHotel = !!hotel;

  const name = hotel?.name || guesthouse?.name || '';
  const city = hotel?.city || guesthouse?.city || '';
  const country = hotel?.country || guesthouse?.country || '';
  const rating = hotel?.rating || guesthouse?.overallRating || 0;
  const stars = hotel?.stars || 0;
  const pricePerNight = hotel?.pricePerNight || guesthouse?.rooms?.[0]?.basePrice || 0;
  const currency = hotel?.currency || guesthouse?.rooms?.[0]?.currency || 'XOF';
  const imagesRaw = hotel?.images || guesthouse?.images || null;
  const images: string[] = imagesRaw
    ? typeof imagesRaw === 'string'
      ? safeJsonParse<string[]>(imagesRaw, [])
      : []
    : [];
  const amenitiesRaw = hotel?.amenities || guesthouse?.amenities || null;
  const amenities: string[] = amenitiesRaw
    ? typeof amenitiesRaw === 'string'
      ? safeJsonParse<string[]>(amenitiesRaw, [])
      : Array.isArray(amenitiesRaw)
        ? amenitiesRaw
        : []
    : [];
  const description =
    guesthouse?.description ||
    `Séjournez au ${name}, un établissement de qualité situé à ${city}, ${COUNTRY_FLAGS[country] || ''} ${country}. Profitez d'un confort exceptionnel et d'un service irréprochable.`;
  const reviewCount = hotel?._count?.reviews_hotel || guesthouse?.reviewCount || 0;
  const address = guesthouse?.address || guesthouse?.quartier ? `${guesthouse?.quartier || ''}, ${city}` : city;
  const lat = (hotel as any)?.lat || (guesthouse as any)?.lat || null;
  const lng = (hotel as any)?.lng || (guesthouse as any)?.lng || null;
  const rooms = hotel?.rooms || guesthouse?.rooms || [];
  const reviews = hotel?.reviews_hotel || [];

  // Compute nights for price estimate
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const nights =
    checkInDate && checkOutDate && checkOutDate > checkInDate
      ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const totalPrice = nights * pricePerNight;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded-xl col-span-2" />
            <div className="h-32 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotel && !guesthouse) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4">
        <div className="max-w-5xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-400 mb-2">Établissement non trouvé</h2>
          <p className="text-gray-400 mb-6">L&apos;établissement que vous recherchez n&apos;existe pas ou a été supprimé.</p>
          <Link href="/booking">
            <Button className="bg-[#003087] text-white rounded-xl px-6">
              Retour aux résultats
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Link href="/booking" className="text-sm text-[#003087] hover:underline flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Retour aux résultats
          </Link>
        </motion.div>

        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-xl overflow-hidden mb-6 card-shadow"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-[#003087]/10 to-[#009CDE]/10">
            {images.length > 0 ? (
              <img
                src={images[currentImage] || images[0]}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#003087]/20">
                {isHotel ? (
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 20h20M4 20V8l8-4 8 4v12M9 20v-6h6v6" />
                  </svg>
                ) : (
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === currentImage ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
          <Badge className="absolute top-4 left-4 bg-[#D4AF37] text-white border-0 px-3 py-1">
            {isHotel ? 'Hôtel' : 'Guesthouse'}
          </Badge>
          {stars > 0 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-[#D4AF37] flex items-center gap-1">
              {Array.from({ length: stars }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
              ))}
            </div>
          )}
        </motion.div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-[#0a2a5e]">{name}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1 text-sm">
                <MapPin className="w-4 h-4" />
                {address}, {COUNTRY_FLAGS[country] || ''} {country}
              </p>
              <div className="flex items-center gap-3 mt-2">
                {stars > 0 && (
                  <span className="text-[#D4AF37] text-sm flex items-center gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                    ))}
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#003087] text-white text-xs font-bold px-2 py-0.5 rounded">
                    {rating.toFixed(1)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {reviewCount > 0 ? `${reviewCount} avis` : 'Aucun avis'}
                  </span>
                </div>
                {isHotel && (
                  <Badge variant="outline" className="text-xs border-[#00A651] text-[#00A651]">
                    <Check className="w-3 h-3 mr-1" /> Vérifié
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="rounded-xl card-shadow border-0">
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <Card className="rounded-xl card-shadow border-0">
                  <CardHeader>
                    <CardTitle className="text-base">Équipements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {amenities.map((amenity) => {
                        const Icon = AMENITY_ICONS[String(amenity).toLowerCase()] || Star;
                        return (
                          <div key={String(amenity)} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                            <span className="capitalize">{String(amenity)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Room types */}
            {rooms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="rounded-xl card-shadow border-0">
                  <CardHeader>
                    <CardTitle className="text-base">Types de chambres</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {rooms.map((room) => {
                      const roomPrice = isHotel
                        ? (room as { basePriceXof: number }).basePriceXof
                        : (room as { basePrice: number }).basePrice;
                      const roomName = isHotel
                        ? (room as { name: string | null }).name || (room as { type: string }).type
                        : (room as { name: string }).name;
                      const roomCapacity = room.capacity;

                      return (
                        <div
                          key={room.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm text-[#0a2a5e] capitalize">{roomName}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" /> {roomCapacity} personne{roomCapacity > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-[#D4AF37]">
                                {roomPrice.toLocaleString('fr-FR')} FCFA
                              </p>
                              <p className="text-xs text-gray-500">/nuit</p>
                            </div>
                            <Button className="bg-[#D4AF37] hover:bg-[#b8961f] text-white text-xs rounded-lg px-3">
                              Réserver
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Card className="rounded-xl card-shadow border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#003087]" />
                    Avis clients
                    {reviewCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {reviewCount}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-[#003087] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                              {review.overall}
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < review.overall ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-200'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                          )}
                          {review.response && (
                            <div className="mt-2 ml-4 p-3 bg-[#003087]/5 rounded-xl">
                              <p className="text-xs font-medium text-[#003087] mb-1">Réponse de l&apos;établissement</p>
                              <p className="text-xs text-gray-600">{review.response}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Aucun avis pour le moment</p>
                      <p className="text-gray-300 text-xs mt-1">Soyez le premier à donner votre avis !</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="rounded-xl card-shadow border-0">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#003087]" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lat && lng ? (
                    <div className="h-64 rounded-2xl overflow-hidden">
                      <PropertyMap
                        properties={[{
                          id: id,
                          title: name,
                          price: pricePerNight,
                          transaction: 'location_courte_duree',
                          type: 'hotel',
                          city: city,
                          quartier: guesthouse?.quartier || '',
                          bedrooms: 0,
                          surface: 0,
                          images: images,
                          lat: lat,
                          lng: lng,
                          verified: false,
                          geoTrust: false,
                          investmentScore: null,
                          address: address,
                        }]}
                        selectedPropertyId={id}
                        selectedCountry={country}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-[#003087]/5">
                        <div className="absolute inset-0 opacity-[0.07]">
                          <div className="absolute top-1/4 left-0 right-0 h-px bg-[#003087]" />
                          <div className="absolute top-2/4 left-0 right-0 h-px bg-[#003087]" />
                          <div className="absolute top-3/4 left-0 right-0 h-px bg-[#003087]" />
                          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-[#003087]" />
                          <div className="absolute left-2/4 top-0 bottom-0 w-px bg-[#003087]" />
                          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-[#003087]" />
                        </div>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-lg bg-[#003087]/10 flex items-center justify-center mb-2 mx-auto">
                          <MapPin className="w-6 h-6 text-[#003087]" />
                        </div>
                        <p className="text-sm font-semibold text-[#0a2a5e] mt-2">Carte interactive</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {address}, {city}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right - Booking form */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="sticky top-24 rounded-xl card-shadow border-0">
                <CardContent className="p-6 space-y-4">
                  {/* Price */}
                  <div className="text-center mb-2">
                    <span className="text-3xl font-bold text-[#D4AF37]">
                      {pricePerNight.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-gray-500 text-sm"> FCFA/nuit</span>
                  </div>

                  <Separator />

                  {/* Date inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Date d&apos;arrivée
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="pl-9 rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Date de départ
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="pl-9 rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Voyageurs</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={guests}
                          onChange={(e) => setGuests(Number(e.target.value))}
                          className="w-full h-10 pl-9 pr-3 border border-gray-200 rounded-xl text-sm bg-white"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n} voyageur{n > 1 ? 's' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Demandes spéciales
                      </label>
                      <Textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Arrivée tardive, lit bébé..."
                        rows={3}
                        className="rounded-xl resize-none"
                      />
                    </div>
                  </div>

                  {/* Price summary */}
                  {nights > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {pricePerNight.toLocaleString('fr-FR')} FCFA × {nights} nuit{nights > 1 ? 's' : ''}
                        </span>
                        <span className="font-medium">{totalPrice.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm font-bold">
                        <span>Total</span>
                        <span className="text-[#D4AF37]">{totalPrice.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <Button className="w-full bg-[#D4AF37] hover:bg-[#b8961f] text-white text-base font-bold py-6 rounded-xl">
                    Réserver maintenant
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full border-[#00A651] text-[#00A651] hover:bg-[#00A651]/10 rounded-xl py-5"
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    Paiement Mobile Money
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Paiement sécurisé
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Annulation 24h
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
