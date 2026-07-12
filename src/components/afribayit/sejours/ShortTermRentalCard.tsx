'use client';

/**
 * ShortTermRentalCard — Carte spécifique aux locations courte durée (CDC §5.2)
 *
 * Affiche :
 *   - Type de bien (appartement, villa, studio...)
 *   - Capacité (nb voyageurs) + chambres + lits
 *   - Prix par nuit + prix hebdo (si disponible)
 *   - Badge "Réservation instantanée" si activé
 *   - Badge "Hôte vérifié"
 *   - CTA : "Louer" (workflow location : réservation instantanée OU approbation → Mobile Money → check-in QR)
 */

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Key, Users, BedDouble, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬',
};

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  villa: 'Villa',
  studio: 'Studio',
  chambre: 'Chambre',
  maison: 'Maison',
  loft: 'Loft',
  bungalow: 'Bungalow',
};

export interface ShortTermRentalCardData {
  id: string;
  title: string;
  city: string;
  country: string;
  propertyType: string;
  pricePerNight: number;
  weeklyPrice?: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  instantBooking: boolean;
  hostVerified: boolean;
  maxGuests: number;
  bedrooms: number;
  amenities: string[];
  image: string | null;
}

export default function ShortTermRentalCard({ rental, index }: { rental: ShortTermRentalCardData; index: number }) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const propertyLabel = PROPERTY_TYPE_LABELS[rental.propertyType] || rental.propertyType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
    >
      <Link href="/short-term">
        <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group rounded-3xl card-shadow border-0">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#D4AF37]/10 to-[#003087]/10 overflow-hidden">
            {rental.image ? (
              <img
                src={rental.image}
                alt={rental.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <Key className="w-12 h-12 text-[#D4AF37]/30" />
              </div>
            )}
            {/* Badge type de bien */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-[#D4AF37] text-white text-xs border-0 px-2.5 py-1">{propertyLabel}</Badge>
            </div>
            {/* Réservation instantanée */}
            {rental.instantBooking && (
              <div className="absolute top-3 right-3 bg-[#00A651] text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Instantanée
              </div>
            )}
            {/* Capacité */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-semibold text-[#2C2E2F] flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {rental.maxGuests}
              </span>
              <span className="flex items-center gap-1">
                <BedDouble className="w-3 h-3" />
                {rental.bedrooms}
              </span>
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-[#2C2E2F] mb-1 group-hover:text-[#D4AF37] transition-colors text-sm truncate">
              {rental.title}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" />
              {rental.city}, {COUNTRY_FLAGS[rental.country] || ''} {rental.country}
            </p>

            {/* Hôte vérifié */}
            {rental.hostVerified && (
              <div className="flex items-center gap-1 mb-2 text-[10px] text-[#003087] font-semibold">
                <ShieldCheck className="w-3 h-3" />
                Hôte vérifié
              </div>
            )}

            {/* Rating + Price */}
            <div className="flex items-center justify-between">
              {rental.rating > 0 ? (
                <div className="flex items-center gap-1">
                  <div className="bg-[#D4AF37] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {rental.rating.toFixed(1)}
                  </div>
                  {rental.reviewCount > 0 && (
                    <span className="text-xs text-gray-400">({rental.reviewCount} avis)</span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-gray-400">Nouveau</span>
              )}
              <div className="text-right">
                {rental.weeklyPrice && (
                  <div className="text-[10px] text-gray-400">
                    {fmt(rental.weeklyPrice)} FCFA/semaine
                  </div>
                )}
                <div>
                  <span className="text-lg font-bold text-[#D4AF37]">{fmt(rental.pricePerNight)}</span>
                  <span className="text-xs text-gray-500"> FCFA/nuit</span>
                </div>
              </div>
            </div>

            {/* CTA — Louer (workflow location : réservation → Mobile Money → check-in QR) */}
            <Button className="w-full mt-3 bg-[#D4AF37] hover:bg-[#b8961f] text-white text-sm font-semibold rounded-xl">
              Louer
            </Button>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
