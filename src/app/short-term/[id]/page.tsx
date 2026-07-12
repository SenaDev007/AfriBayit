'use client';

/**
 * /short-term/[id] — Page de détail d'une location courte durée (CDC §5.2)
 *
 * Affiche :
 *   - Galerie photos
 *   - Titre, type, localisation
 *   - Capacité (voyageurs, chambres, lits, SDB)
 *   - Description
 *   - Équipements
 *   - Règles de la maison
 *   - Hôte (nom, avatar, vérifié)
 *   - Prix par nuit + prix hebdo/mensuel
 *   - Frais de ménage + dépôt de garantie
 *   - Politique d'annulation
 *   - Formulaire de réservation (dates, voyageurs, demande instantanée ou approbation)
 *   - Paiement Mobile Money intégré
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Star, MapPin, Users, BedDouble, Bath, Maximize, Key, Zap, ShieldCheck,
  Calendar, ArrowLeft, CreditCard, Check, X, Home, ChefHat, Wifi, Car,
  Wind, Tv, Waves, Dumbbell, Coffee, Snowflake,
} from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement', villa: 'Villa', studio: 'Studio', chambre: 'Chambre',
  maison: 'Maison', loft: 'Loft', bungalow: 'Bungalow',
};

const CANCELLATION_LABELS: Record<string, string> = {
  flexible: 'Flexible — annulation gratuite 24h avant',
  moderate: 'Modérée — annulation 5 jours avant',
  strict: 'Stricte — 50% remboursable',
};

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi, parking: Car, ac: Snowflake, tv: Tv, pool: Waves,
  gym: Dumbbell, breakfast: Coffee, kitchen: ChefHat, security: ShieldCheck,
};

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function parseJsonObj(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function getFirstImage(images: string | null | undefined): string {
  const arr = parseJsonArray(images);
  return arr[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop';
}

export default function ShortTermRentalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rentalId = params.id;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const { data: rental, isLoading } = useQuery({
    queryKey: ['short-term-rental-detail', rentalId],
    queryFn: () => apiFetch<any>(`/api/short-term/${rentalId}`),
    enabled: !!rentalId,
  });

  const bookingMutation = useMutation({
    mutationFn: (data: { rentalId: string; checkIn: string; checkOut: string; guests: number; specialRequests?: string }) =>
      apiPost(`/api/short-term/${data.rentalId}/bookings`, data),
    onSuccess: () => {
      setBookingSuccess(true);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="aspect-[16/10] rounded-3xl mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="lg:col-span-2 h-96 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="font-display text-xl font-bold text-gray-400">Location non trouvée</h2>
          <button onClick={() => router.push('/sejours')} className="mt-4 text-[#003087] font-semibold text-sm hover:underline">
            ← Retour aux séjours
          </button>
        </div>
      </div>
    );
  }

  const images = parseJsonArray(rental.images);
  const amenities = parseJsonArray(rental.amenities);
  const houseRules = parseJsonObj(rental.houseRules);
  const propertyLabel = PROPERTY_TYPE_LABELS[rental.propertyType] || rental.propertyType;
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  // Calculate nights and total
  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0;
  const subtotal = nights * rental.pricePerNight;
  const cleaningFee = rental.cleaningFee || 0;
  const total = subtotal + cleaningFee;

  const handleBook = () => {
    if (!checkIn || !checkOut) return;
    bookingMutation.mutate({
      rentalId,
      checkIn,
      checkOut,
      guests,
      specialRequests: specialRequests || undefined,
    });
  };

  return (
    <section className="min-h-screen pt-20 pb-16 bg-gray-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/sejours')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux séjours
        </motion.button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#D4AF37] text-white text-xs border-0 px-2.5 py-1">{propertyLabel}</Badge>
            {rental.instantBooking && (
              <Badge className="bg-[#00A651] text-white text-xs border-0 px-2.5 py-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Réservation instantanée
              </Badge>
            )}
            {rental.hostVerified && (
              <Badge className="bg-[#003087] text-white text-xs border-0 px-2.5 py-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Hôte vérifié
              </Badge>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">{rental.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {rental.city}, {COUNTRY_FLAGS[rental.country] || ''} {rental.country}
              {rental.quartier ? ` · ${rental.quartier}` : ''}
            </span>
            {rental.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#D4AF37] fill-current" />
                {rental.rating.toFixed(1)} ({rental.reviewCount} avis)
              </span>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-4 gap-2 mb-6 rounded-3xl overflow-hidden">
          <div className="col-span-4 sm:col-span-2 row-span-2 aspect-square sm:aspect-auto">
            <img
              src={images[0] || getFirstImage(rental.images)}
              alt={rental.title}
              className="w-full h-full object-cover"
            />
          </div>
          {images.slice(1, 5).map((img, i) => (
            <div key={i} className="aspect-square hidden sm:block">
              <img src={img} alt={`${rental.title} ${i + 2}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Capacity */}
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <Users className="w-5 h-5 mx-auto mb-1 text-[#003087]" />
                    <p className="text-xs text-gray-400">Voyageurs</p>
                    <p className="font-bold text-[#2C2E2F]">{rental.maxGuests}</p>
                  </div>
                  <div>
                    <BedDouble className="w-5 h-5 mx-auto mb-1 text-[#003087]" />
                    <p className="text-xs text-gray-400">Chambres</p>
                    <p className="font-bold text-[#2C2E2F]">{rental.bedrooms}</p>
                  </div>
                  <div>
                    <Bath className="w-5 h-5 mx-auto mb-1 text-[#003087]" />
                    <p className="text-xs text-gray-400">Salles de bain</p>
                    <p className="font-bold text-[#2C2E2F]">{rental.bathrooms}</p>
                  </div>
                  <div>
                    <Key className="w-5 h-5 mx-auto mb-1 text-[#003087]" />
                    <p className="text-xs text-gray-400">Lits</p>
                    <p className="font-bold text-[#2C2E2F]">{rental.beds}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {rental.description && (
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-display text-lg font-bold text-[#003087] mb-3">Description</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{rental.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-display text-lg font-bold text-[#003087] mb-3">Équipements</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenities.map((a) => {
                      const Icon = AMENITY_ICONS[a] || Check;
                      return (
                        <div key={a} className="flex items-center gap-2 text-sm text-gray-600">
                          <Icon className="w-4 h-4 text-[#003087]" />
                          <span className="capitalize">{a}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* House rules */}
            {Object.keys(houseRules).length > 0 && (
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-display text-lg font-bold text-[#003087] mb-3">Règles de la maison</h2>
                  <div className="space-y-2">
                    {houseRules.checkInTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Arrivée : {houseRules.checkInTime}
                      </div>
                    )}
                    {houseRules.checkOutTime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Départ : {houseRules.checkOutTime}
                      </div>
                    )}
                    {houseRules.noSmoking && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <X className="w-4 h-4 text-red-400" />
                        Non fumeur
                      </div>
                    )}
                    {houseRules.noPets && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <X className="w-4 h-4 text-red-400" />
                        Animaux non admis
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Host */}
            {rental.host && (
              <Card className="rounded-3xl border-0 shadow-sm">
                <CardContent className="p-6">
                  <h2 className="font-display text-lg font-bold text-[#003087] mb-3">Votre hôte</h2>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] font-bold text-lg">
                      {rental.host.name?.[0]?.toUpperCase() || 'H'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#2C2E2F]">{rental.host.name}</p>
                      {rental.host.verified && (
                        <p className="text-xs text-[#00A651] flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Hôte vérifié
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cancellation policy */}
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-bold text-[#003087] mb-3">Politique d&apos;annulation</h2>
                <p className="text-sm text-gray-600">
                  {CANCELLATION_LABELS[rental.cancellationPolicy] || rental.cancellationPolicy}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right — booking sidebar */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
              {bookingSuccess ? (
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#00A651]/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-[#00A651]" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Demande envoyée !</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {rental.instantBooking
                      ? 'Votre réservation est confirmée. Vous allez recevoir un email de confirmation avec le QR code de check-in.'
                      : 'Votre demande a été envoyée à l\'hôte. Vous recevrez une réponse sous 24h.'}
                  </p>
                  <Button
                    onClick={() => router.push('/sejours')}
                    className="w-full bg-[#003087] hover:bg-[#0047b3] text-white rounded-full"
                  >
                    Retour aux séjours
                  </Button>
                </CardContent>
              ) : (
                <CardContent className="p-6">
                  {/* Price */}
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="font-mono-data text-2xl font-bold text-[#D4AF37]">{fmt(rental.pricePerNight)}</span>
                      <span className="text-sm text-gray-500"> FCFA/nuit</span>
                    </div>
                    {rental.rating > 0 && (
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-current" />
                        {rental.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Booking form */}
                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Arrivée</label>
                        <Input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="text-sm rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">Départ</label>
                        <Input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="text-sm rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Voyageurs</label>
                      <select
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                      >
                        {Array.from({ length: rental.maxGuests }).map((_, i) => (
                          <option key={i + 1} value={i + 1}>{i + 1} voyageur{i + 1 > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 mb-1 block">Demandes spéciales (optionnel)</label>
                      <Textarea
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Heure d'arrivée, questions..."
                        className="text-sm rounded-xl min-h-[60px]"
                      />
                    </div>
                  </div>

                  {/* Price breakdown */}
                  {nights > 0 && (
                    <div className="space-y-2 py-3 border-t border-b border-gray-100 mb-4 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>{fmt(rental.pricePerNight)} FCFA × {nights} nuit{nights > 1 ? 's' : ''}</span>
                        <span className="font-mono">{fmt(subtotal)} FCFA</span>
                      </div>
                      {cleaningFee > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Frais de ménage</span>
                          <span className="font-mono">{fmt(cleaningFee)} FCFA</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-[#2C2E2F] pt-1">
                        <span>Total</span>
                        <span className="font-mono">{fmt(total)} FCFA</span>
                      </div>
                    </div>
                  )}

                  {/* CTA — Louer (workflow location) */}
                  <Button
                    onClick={handleBook}
                    disabled={!checkIn || !checkOut || bookingMutation.isPending}
                    className="w-full bg-[#D4AF37] hover:bg-[#b8961f] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {bookingMutation.isPending ? (
                      'Traitement...'
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        {rental.instantBooking ? 'Louer maintenant' : 'Demander à louer'}
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-gray-400 text-center mt-3">
                    {rental.instantBooking
                      ? 'Paiement Mobile Money sécurisé · Confirmation immédiate'
                      : 'L\'hôte doit approuver votre demande sous 24h'}
                  </p>

                  {/* Security deposit notice */}
                  {rental.securityDeposit > 0 && (
                    <div className="mt-3 p-2 bg-[#003087]/5 rounded-xl text-[10px] text-gray-500 text-center">
                      Dépôt de garantie : {fmt(rental.securityDeposit)} FCFA (sécurisé via Escrow)
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
