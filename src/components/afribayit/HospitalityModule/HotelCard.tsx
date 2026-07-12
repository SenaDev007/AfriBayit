// P3.7-2 — Hotel card used in the list grid.
// Renders image (with star/availability/connection-level/OTA badges),
// name, location, amenities, price/rating row, and a CTA button.

import { motion } from 'framer-motion';
import {
  Hotel as HotelIcon,
  MapPin,
  RefreshCw,
  Star,
} from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import type { HotelApiItem } from './types';
import {
  AMENITY_ICONS,
  easeOut,
  fmtPrice,
  getConnectionLevelLabel,
  getFirstImage,
  getOtaStatus,
  parseJsonArray,
} from './utils';

interface HotelCardProps {
  hotel: HotelApiItem;
  index: number;
  onSelect: (hotelId: string) => void;
  onBook: (hotelId: string) => void;
}

export default function HotelCard({ hotel, index, onSelect, onBook }: HotelCardProps) {
  const amenities = parseJsonArray(hotel.amenities);
  const image = getFirstImage(hotel.images);
  const otaStatus = getOtaStatus(hotel.otaRefs);
  const connLevel = getConnectionLevelLabel(hotel.connectionLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: easeOut }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border cursor-pointer group"
      onClick={() => onSelect(hotel.id)}
    >
      <div className="relative aspect-[16/10]">
        {image ? (
          <ImageWithFallback src={image} alt={hotel.name} className="w-full h-full" fallbackType="hotel" />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <HotelIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {/* Star Rating Overlay */}
        <div className="absolute top-3 left-3 flex gap-0.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
          {Array.from({ length: hotel.stars }).map((_, j) => (
            <Star key={j} className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
          ))}
        </div>
        {/* Availability Badge */}
        <div
          className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold ${
            hotel.available ? 'bg-[#00A651] text-white' : 'bg-gray-500 text-white'
          }`}
        >
          {hotel.available ? 'Disponible' : 'Complet'}
        </div>
        {/* Connection Level Badge */}
        <div className={`absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${connLevel.color}`}>
          {connLevel.label}
        </div>
        {/* OTA Sync Indicators */}
        {otaStatus.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {otaStatus.map((ota) => (
              <span
                key={ota.ota}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/90 text-[8px] font-bold text-[#00A651]"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                {ota.label === 'OTA Partner' ? 'B.com' : 'Exp.'}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-1 group-hover:text-[#003087] transition-colors">
          {hotel.name}
        </h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          {hotel.city}, {hotel.country}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full"
            >
              {AMENITY_ICONS[amenity.toLowerCase()] || null}
              {amenity}
            </span>
          ))}
          {amenities.length > 4 && (
            <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full">
              +{amenities.length - 4}
            </span>
          )}
        </div>

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <span className="font-mono text-xl font-bold text-[#D4AF37]">
              {fmtPrice(hotel.pricePerNight)}
            </span>
            <span className="text-xs text-gray-400 ml-1">FCFA/nuit</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
            <span className="text-sm font-semibold">{hotel.rating}</span>
            {hotel._count?.reviews_hotel !== undefined && (
              <span className="text-[10px] text-gray-400">({hotel._count.reviews_hotel})</span>
            )}
          </div>
        </div>

        {/* CTA */}
        {hotel.available ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook(hotel.id);
            }}
            className="w-full mt-4 py-2.5 bg-[#D4AF37] text-white rounded-lg text-sm font-semibold hover:bg-[#b8961f] transition-colors"
          >
            Réserver
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(hotel.id);
            }}
            className="w-full mt-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Voir les détails
          </button>
        )}
      </div>
    </motion.div>
  );
}
