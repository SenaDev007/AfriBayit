'use client';

/**
 * /short-term/[id] — Page de détail d'une location courte durée (CDC §5.2)
 *
 * Design aligné avec /sejours/[id] — même structure, mêmes composants UI,
 * mais adapté au workflow location (CTA "Louer", prix/nuit + hebdo,
 * hôte vérifié, réservation instantanée ou approbation).
 */

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Star, MapPin, Calendar, Users, BedDouble, Bath, Key, Zap, ShieldCheck,
  ChevronLeft, ChevronRight, CreditCard, Smartphone, MessageSquare,
  Check, Clock, Wifi, Car, Utensils, Waves, Dumbbell, Coffee,
  Snowflake, Tv, Home, ChefHat, X,
} from 'lucide-react';
import Link from 'next/link';
import { CountryFlag } from '@/components/ui/CountryFlag';

const easeOut = [0.16, 1, 0.3, 1] as const;

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', villa: 'Villa', studio: 'Studio', chambre: 'Chambre',
  maison: 'Maison', loft: 'Loft', bungalow: 'Bungalow',
};

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: 'Flexible — annulation gratuite 24h avant',
  moderate: 'Modérée — annulation 5 jours avant',
  strict: 'Stricte — 50% remboursable',
};

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, parking: Car, restaurant: Utensils, pool: Waves, gym: Dumbbell,
  breakfast: Coffee, ac: Snowflake, tv: Tv, security: ShieldCheck, kitchen: ChefHat,
};

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try { const parsed = JSON.parse(raw); return (Array.isArray(parsed) ? parsed : fallback) as T; } catch { return fallback; }
}

export default function ShortTermRentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [currentImage, setCurrentImage] = useState(0);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: rental, isLoading } = useQuery({
    queryKey: ['short-term-rental-detail', id],
    queryFn: () => apiFetch<any>(`/api/short-term/${id}`),
    enabled: !!id,
    retry: false,
  });

  const bookingMutation = useMutation({
    mutationFn: (data: { rentalId: string; checkIn: string; checkOut: string; guests: number; specialRequests?: string }) =>
      apiPost(`/api/short-term/${data.rentalId}/bookings`, data),
    onSuccess: () => setBookingSuccess(true),
  });

  // Extract data
  const images: string[] = rental?.images ? safeJsonParse<string[]>(rental.images, []) : [];
  const amenities: string[] = rental?.amenities ? safeJsonParse<string[]>(rental.amenities, []) : [];
  const houseRules: Record<string, any> = rental?.houseRules ? safeJsonParse<Record<string, any>>(rental.houseRules, {}) : {};
  const propertyLabel = PROPERTY_TYPE_LABELS[rental?.propertyType] || rental?.propertyType || 'Location';

  const pricePerNight = rental?.pricePerNight || 0;
  const cleaningFee = rental?.cleaningFee || 0;
  const securityDeposit = rental?.securityDeposit || 0;
  const weeklyPrice = rental?.weeklyPrice || null;
  const rating = rental?.rating || 0;
  const reviewCount = rental?.reviewCount || 0;

  // Compute nights and total
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const nights = checkInDate && checkOutDate && checkOutDate > checkInDate
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const subtotal = nights * pricePerNight;
  const totalPrice = subtotal + cleaningFee;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream pt-20 px-4">
        <div className="max-w-5xl mx-auto animate-pulse space-y-6">
          <div className="h-64 bg-primary-pale/60 rounded-3xl" />
          <div className="h-8 bg-primary-pale/60 rounded w-1/2" />
          <div className="h-4 bg-primary-pale/60 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-primary-pale/60 rounded-3xl col-span-2" />
            <div className="h-32 bg-primary-pale/60 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-cream pt-20 px-4">
        <div className="max-w-5xl mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary-pale flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-primary-green" />
          </div>
          <h2 className="font-serif text-2xl font-extrabold text-primary-deep mb-2">Location non trouvée</h2>
          <p className="text-gray-text mb-6">Cette location n&apos;existe pas ou a été retirée.</p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto rounded-full mb-8" />
          <Link href="/sejours">
            <Button className="bg-primary-green hover:bg-primary-deep text-white rounded-full px-6 font-bold shadow-md hover:shadow-lg transition-all">Retour aux résultats</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleBook = () => {
    if (!checkIn || !checkOut) return;
    bookingMutation.mutate({ rentalId: id, checkIn, checkOut, guests, specialRequests: specialRequests || undefined });
  };

  return (
    <div className="min-h-screen bg-cream pt-20 pb-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <Link href="/sejours" className="text-sm text-primary-deep hover:underline flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Retour aux résultats
          </Link>
        </motion.div>

        {/* Image Gallery — carrousel identique à /sejours/[id] */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden mb-6 border border-primary-pale shadow-lg"
        >
          <div className="aspect-[16/9] bg-gradient-to-br from-accent-yellow/10 to-primary-deep/10">
            {images.length > 0 ? (
              <img
                src={images[currentImage] || images[0]}
                alt={rental.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary-deep/20">
                <Key className="w-24 h-24" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white transition-colors shadow-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur p-2 rounded-full hover:bg-white transition-colors shadow-md"
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
          {/* Badge type */}
          <Badge className="absolute top-4 left-4 bg-accent-yellow text-primary-deep border-0 px-3 py-1 rounded-full font-bold shadow-md">{propertyLabel}</Badge>
          {/* Badge instant booking */}
          {rental.instantBooking && (
            <div className="absolute top-4 right-4 bg-[#00A651] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
              <Zap className="w-3 h-3" />
              Réservation instantanée
            </div>
          )}
        </motion.div>

        {/* Main content — grid 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-primary-deep">{rental.title}</h1>
              <p className="text-gray-text flex items-center gap-2 mt-1 text-sm">
                <MapPin className="w-4 h-4" />
                {rental.quartier ? `${rental.quartier}, ` : ''}{rental.city}, <CountryFlag code={rental.country} /> {rental.country}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {/* Capacity badges */}
                <span className="text-xs text-gray-text flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {rental.maxGuests} voyageur{rental.maxGuests > 1 ? 's' : ''}
                </span>
                <span className="text-xs text-gray-text flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5" /> {rental.bedrooms} ch.
                </span>
                <span className="text-xs text-gray-text flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" /> {rental.bathrooms} sdb
                </span>
                <span className="text-xs text-gray-text flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> {rental.beds} lit{rental.beds > 1 ? 's' : ''}
                </span>
                {/* Rating */}
                {rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="bg-accent-yellow text-primary-deep text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {rating.toFixed(1)}
                    </div>
                    <span className="text-xs text-gray-text">{reviewCount} avis</span>
                  </div>
                )}
                {/* Host verified */}
                {rental.hostVerified && (
                  <Badge variant="outline" className="text-xs border-primary-green/40 text-primary-green rounded-full">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Hôte vérifié
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Description */}
            {rental.description && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="rounded-3xl border border-primary-pale shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-serif font-bold text-primary-deep">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-text leading-relaxed whitespace-pre-line">{rental.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Amenities — même design que /sejours/[id] */}
            {amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <Card className="rounded-3xl border border-primary-pale shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-serif font-bold text-primary-deep">Équipements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {amenities.map((amenity) => {
                        const Icon = AMENITY_ICONS[String(amenity).toLowerCase()] || Check;
                        return (
                          <div key={String(amenity)} className="flex items-center gap-2 text-sm text-gray-text">
                            <div className="w-8 h-8 rounded-full bg-accent-yellow/15 border border-accent-yellow/30 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-accent-dark" />
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

            {/* House rules */}
            {Object.keys(houseRules).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card className="rounded-3xl border border-primary-pale shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-serif font-bold text-primary-deep">Règles de la maison</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {houseRules.checkInTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-text">
                        <Calendar className="w-4 h-4 text-primary-green" /> Arrivée : {houseRules.checkInTime}
                      </div>
                    )}
                    {houseRules.checkOutTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-text">
                        <Calendar className="w-4 h-4 text-primary-green" /> Départ : {houseRules.checkOutTime}
                      </div>
                    )}
                    {houseRules.noSmoking && (
                      <div className="flex items-center gap-2 text-sm text-gray-text">
                        <X className="w-4 h-4 text-red-400" /> Non fumeur
                      </div>
                    )}
                    {houseRules.noPets && (
                      <div className="flex items-center gap-2 text-sm text-gray-text">
                        <X className="w-4 h-4 text-red-400" /> Animaux non admis
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Host */}
            {rental.host && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <Card className="rounded-3xl border border-primary-pale shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base font-serif font-bold text-primary-deep">Votre hôte</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-pale border border-primary-green/20 flex items-center justify-center text-primary-deep font-bold text-lg">
                        {rental.host.name?.[0]?.toUpperCase() || 'H'}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-primary-deep">{rental.host.name}</p>
                        {rental.host.verified && (
                          <p className="text-xs text-[#00A651] flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Hôte vérifié
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Cancellation policy */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="rounded-3xl border border-primary-pale shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base font-serif font-bold text-primary-deep">Politique d&apos;annulation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-text">
                    {CANCELLATION_LABELS[rental.cancellationPolicy] || rental.cancellationPolicy}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right - Booking form — sticky, même design que /sejours/[id] */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="sticky top-24 rounded-3xl border border-primary-pale shadow-lg">
                {bookingSuccess ? (
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#00A651]/10 flex items-center justify-center mx-auto mb-4">
                      <Check className="w-8 h-8 text-[#00A651]" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-primary-deep mb-2">Demande envoyée !</h3>
                    <p className="text-sm text-gray-text mb-4">
                      {rental.instantBooking
                        ? 'Votre réservation est confirmée. Vous allez recevoir un email avec le QR code de check-in.'
                        : 'Votre demande a été envoyée à l\'hôte. Vous recevrez une réponse sous 24h.'}
                    </p>
                    <Button
                      onClick={() => router.push('/sejours')}
                      className="w-full bg-primary-green hover:bg-primary-deep text-white rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                    >
                      Retour aux séjours
                    </Button>
                  </CardContent>
                ) : (
                  <CardContent className="p-6 space-y-4">
                    {/* Price */}
                    <div className="text-center mb-2">
                      <span className="font-serif text-3xl font-extrabold text-accent-dark">
                        {pricePerNight.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-gray-text text-sm"> FCFA/nuit</span>
                      {weeklyPrice && (
                        <p className="text-xs text-gray-text mt-1">
                          {weeklyPrice.toLocaleString('fr-FR')} FCFA/semaine
                        </p>
                      )}
                      <div className="h-1 w-12 bg-accent-yellow mx-auto mt-3 rounded-full" />
                    </div>

                    <Separator />

                    {/* Date inputs — même design que /sejours/[id] */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Date d&apos;arrivée</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-green" />
                          <Input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="pl-9 rounded-xl border-primary-pale focus-visible:ring-primary-green/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Date de départ</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-green" />
                          <Input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="pl-9 rounded-xl border-primary-pale focus-visible:ring-primary-green/30"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Voyageurs</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-green" />
                          <select
                            value={guests}
                            onChange={(e) => setGuests(Number(e.target.value))}
                            className="w-full h-10 pl-9 pr-3 border border-primary-pale rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
                          >
                            {Array.from({ length: rental.maxGuests }).map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1} voyageur{i + 1 > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Demandes spéciales</label>
                        <Textarea
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          placeholder="Arrivée tardive, questions..."
                          rows={3}
                          className="rounded-xl resize-none border-primary-pale focus-visible:ring-primary-green/30"
                        />
                      </div>
                    </div>

                    {/* Price summary */}
                    {nights > 0 && (
                      <div className="bg-primary-pale/40 rounded-2xl p-4 space-y-2 border border-primary-pale">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-text">
                            {pricePerNight.toLocaleString('fr-FR')} FCFA × {nights} nuit{nights > 1 ? 's' : ''}
                          </span>
                          <span className="font-bold">{subtotal.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        {cleaningFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-text">Frais de ménage</span>
                            <span className="font-bold">{cleaningFee.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-sm font-bold">
                          <span>Total</span>
                          <span className="text-accent-dark">{totalPrice.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      </div>
                    )}

                    {/* CTA — Louer (workflow location) */}
                    <Button
                      onClick={handleBook}
                      disabled={!checkIn || !checkOut || bookingMutation.isPending}
                      className="w-full bg-primary-green hover:bg-primary-deep text-white text-base font-bold py-6 rounded-full shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {bookingMutation.isPending
                        ? 'Traitement...'
                        : rental.instantBooking
                          ? 'Louer maintenant'
                          : 'Demander à louer'}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full border-primary-green/40 text-primary-green hover:bg-primary-pale rounded-full py-5 font-bold"
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      Paiement Mobile Money
                    </Button>

                    {/* Security deposit */}
                    {securityDeposit > 0 && (
                      <div className="text-center text-xs text-gray-text">
                        Dépôt de garantie : {securityDeposit.toLocaleString('fr-FR')} FCFA (sécurisé Escrow)
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4 text-xs text-gray-text">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Paiement sécurisé
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Annulation 24h
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
