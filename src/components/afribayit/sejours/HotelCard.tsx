'use client';

/**
 * HotelCard — Carte spécifique aux hôtels (CDC §5.4 / §7D)
 *
 * Affiche :
 *   - Étoiles (1-5)
 *   - Prix par nuit
 *   - Amenities (Wi-Fi, piscine, restaurant...)
 *   - Note voyageurs + nombre d'avis
 *   - CTA : "Réserver" (workflow hôtelier : sélection chambre + options → QR check-in)
 */

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Hotel } from 'lucide-react';
import Link from 'next/link';

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬',
};

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶', parking: '🅿️', restaurant: '🍽️', pool: '🏊', gym: '💪',
  breakfast: '☕', ac: '❄️', tv: '📺', security: '🔒',
};

export interface HotelCardData {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  image: string | null;
  slug: string | null;
}

export default function HotelCard({ hotel, index }: { hotel: HotelCardData; index: number }) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');
  const topAmenities = hotel.amenities.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
    >
      <Link href={`/sejours/${hotel.id}`}>
        <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group rounded-3xl card-shadow border-0">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#003087]/10 to-[#009CDE]/10 overflow-hidden">
            {hotel.image ? (
              <img
                src={hotel.image}
                alt={hotel.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <Hotel className="w-12 h-12 text-[#003087]/30" />
              </div>
            )}
            {/* Badge Hôtel */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-[#003087] text-white text-xs border-0 px-2.5 py-1">Hôtel</Badge>
            </div>
            {/* Étoiles */}
            {hotel.stars > 0 && (
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-[#D4AF37] flex items-center gap-0.5">
                {Array.from({ length: hotel.stars }).map((_, si) => (
                  <Star key={si} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-[#2C2E2F] mb-1 group-hover:text-[#003087] transition-colors text-sm truncate">
              {hotel.name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" />
              {hotel.city}, {COUNTRY_FLAGS[hotel.country] || ''} {hotel.country}
            </p>

            {/* Amenities */}
            {topAmenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {topAmenities.map((a) => (
                  <span key={a} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                    {AMENITY_ICONS[a] || '•'} {a}
                  </span>
                ))}
              </div>
            )}

            {/* Rating + Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="bg-[#003087] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {hotel.rating.toFixed(1)}
                </div>
                {hotel.reviewCount > 0 && (
                  <span className="text-xs text-gray-400">({hotel.reviewCount} avis)</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#D4AF37]">{fmt(hotel.pricePerNight)}</span>
                <span className="text-xs text-gray-500"> FCFA/nuit</span>
              </div>
            </div>

            {/* CTA — Réserver (workflow hôtelier) */}
            <Button className="w-full mt-3 bg-[#003087] hover:bg-[#0047b3] text-white text-sm font-semibold rounded-xl">
              Réserver
            </Button>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
