'use client';

/**
 * GuesthouseCard — Carte spécifique aux guesthouses (CDC §5.3)
 *
 * Affiche :
 *   - Nombre de chambres disponibles
 *   - Prix par chambre (à partir de)
 *   - Petit-déjeuner inclus ou non
 *   - Badge "Guesthouse Certifiée AfriBayit" si certifié
 *   - Note globale + nombre d'avis
 *   - CTA : "Réserver" (workflow guesthouse : sélection chambre → approbation propriétaire → paiement)
 */

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Home, BedDouble, Coffee, Award } from 'lucide-react';
import Link from 'next/link';

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬',
};

export interface GuesthouseCardData {
  id: string;
  name: string;
  city: string;
  country: string;
  overallRating: number;
  reviewCount: number;
  roomCount: number;
  minPrice: number;
  currency: string;
  hasBreakfast: boolean;
  certified: boolean;
  amenities: string[];
  image: string | null;
  slug: string | null;
}

export default function GuesthouseCard({ guesthouse, index }: { guesthouse: GuesthouseCardData; index: number }) {
  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
    >
      <Link href={`/sejours/${guesthouse.id}`}>
        <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group rounded-3xl card-shadow border-0">
          {/* Image */}
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#00A651]/10 to-[#009CDE]/10 overflow-hidden">
            {guesthouse.image ? (
              <img
                src={guesthouse.image}
                alt={guesthouse.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <Home className="w-12 h-12 text-[#00A651]/30" />
              </div>
            )}
            {/* Badge Guesthouse */}
            <div className="absolute top-3 left-3">
              <Badge className="bg-[#00A651] text-white text-xs border-0 px-2.5 py-1">Guesthouse</Badge>
            </div>
            {/* Badge Certifiée */}
            {guesthouse.certified && (
              <div className="absolute top-3 right-3 bg-[#D4AF37] text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <Award className="w-3 h-3" />
                Certifiée
              </div>
            )}
            {/* Nombre de chambres */}
            <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-semibold text-[#2C2E2F] flex items-center gap-1">
              <BedDouble className="w-3 h-3" />
              {guesthouse.roomCount} chambre{guesthouse.roomCount > 1 ? 's' : ''}
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-[#2C2E2F] mb-1 group-hover:text-[#00A651] transition-colors text-sm truncate">
              {guesthouse.name}
            </h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" />
              {guesthouse.city}, {COUNTRY_FLAGS[guesthouse.country] || ''} {guesthouse.country}
            </p>

            {/* Petit-déjeuner */}
            {guesthouse.hasBreakfast && (
              <div className="flex items-center gap-1 mb-2 text-[10px] text-[#D4AF37] font-semibold">
                <Coffee className="w-3 h-3" />
                Petit-déjeuner inclus
              </div>
            )}

            {/* Rating + Price (à partir de) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="bg-[#00A651] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  {guesthouse.overallRating.toFixed(1)}
                </div>
                {guesthouse.reviewCount > 0 && (
                  <span className="text-xs text-gray-400">({guesthouse.reviewCount} avis)</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400">à partir de</span>
                <div>
                  <span className="text-lg font-bold text-[#D4AF37]">{fmt(guesthouse.minPrice)}</span>
                  <span className="text-xs text-gray-500"> FCFA/nuit</span>
                </div>
              </div>
            </div>

            {/* CTA — Réserver (workflow guesthouse : chambre → approbation propriétaire) */}
            <Button className="w-full mt-3 bg-[#00A651] hover:bg-[#008f47] text-white text-sm font-semibold rounded-xl">
              Réserver
            </Button>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
