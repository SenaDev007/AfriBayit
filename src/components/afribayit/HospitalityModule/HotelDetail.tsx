// P3.7-2 — Detail view: hotel header (image, KPIs, OTA, amenities),
// room cards, and customer reviews.

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  Clock,
  Hotel as HotelIcon,
  MapPin,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/afribayit-utils';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import type { HotelDetailApiItem, RoomApiItem, ReviewApiItem } from './types';
import {
  AMENITY_ICONS,
  DetailSkeleton,
  easeOut,
  fmtPrice,
  getConnectionLevelLabel,
  getFirstImage,
  getOtaStatus,
  parseJsonArray,
  ROOM_TYPE_LABELS,
} from './utils';

interface HotelDetailProps {
  detail?: HotelDetailApiItem;
  rooms: RoomApiItem[];
  reviews: ReviewApiItem[];
  detailLoading: boolean;
  roomsLoading: boolean;
  onBackToList: () => void;
  onOpenBooking: (hotelId: string, roomId?: string) => void;
}

export default function HotelDetail(props: HotelDetailProps) {
  const { detail, rooms, reviews, detailLoading, roomsLoading, onBackToList, onOpenBooking } = props;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="detail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: easeOut }}
      >
        <button
          onClick={onBackToList}
          className="flex items-center gap-2 text-sm font-medium text-[#003087] hover:text-[#0047b3] mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour à la liste
        </button>

        {detailLoading ? (
          <DetailSkeleton />
        ) : detail ? (
          <div className="space-y-6">
            {/* Hotel Header */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative aspect-[21/9]">
                {getFirstImage(detail.images) ? (
                  <ImageWithFallback
                    src={getFirstImage(detail.images)}
                    alt={detail.name}
                    className="w-full h-full"
                    fallbackType="hotel"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <HotelIcon className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: detail.stars }).map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    ))}
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">{detail.name}</h2>
                  <p className="text-white/80 text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {detail.city}, {detail.country}
                  </p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      detail.available ? 'bg-[#00A651] text-white' : 'bg-gray-500 text-white'
                    }`}
                  >
                    {detail.available ? 'Disponible' : 'Complet'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${getConnectionLevelLabel(detail.connectionLevel).color}`}
                  >
                    {getConnectionLevelLabel(detail.connectionLevel).label}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37] mx-auto mb-1" />
                    <p className="font-mono text-lg font-bold text-[#0a2a5e]">{detail.rating}</p>
                    <p className="text-[10px] text-gray-500">{detail._count?.reviews_hotel || 0} avis</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <BedDouble className="w-5 h-5 text-[#003087] mx-auto mb-1" />
                    <p className="font-mono text-lg font-bold text-[#0a2a5e]">{detail._count?.rooms || 0}</p>
                    <p className="text-[10px] text-gray-500">Chambres</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <CalendarDays className="w-5 h-5 text-[#00A651] mx-auto mb-1" />
                    <p className="font-mono text-lg font-bold text-[#0a2a5e]">{detail._count?.bookings || 0}</p>
                    <p className="text-[10px] text-gray-500">Réservations</p>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 text-center">
                    <span className="text-[#D4AF37] font-mono text-lg font-bold">
                      {fmtPrice(detail.pricePerNight)}
                    </span>
                    <p className="text-[10px] text-gray-500">FCFA/nuit</p>
                  </div>
                </div>

                {/* OTA Sync Status */}
                {getOtaStatus(detail.otaRefs).length > 0 && (
                  <div className="mb-6 p-4 bg-[#003087]/5 rounded-2xl">
                    <h4 className="text-xs font-semibold text-[#003087] mb-2 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Synchronisation OTA
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getOtaStatus(detail.otaRefs).map((ota) => (
                        <span
                          key={ota.ota}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-[#00A651]"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {ota.label} — Synchronisé
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {parseJsonArray(detail.amenities).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[#0a2a5e] mb-3">Équipements</h4>
                    <div className="flex flex-wrap gap-2">
                      {parseJsonArray(detail.amenities).map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg"
                        >
                          {AMENITY_ICONS[amenity.toLowerCase()] || <CheckCircle className="w-3 h-3 text-[#00A651]" />}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Book */}
                {detail.available && (
                  <button
                    onClick={() => onOpenBooking(detail.id)}
                    className="w-full py-3 bg-[#D4AF37] text-white rounded-lg text-sm font-semibold hover:bg-[#b8961f] transition-colors flex items-center justify-center gap-2"
                  >
                    Réserver maintenant <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Rooms Section */}
            <RoomsSection
              rooms={rooms}
              roomsLoading={roomsLoading}
              hotelAvailable={detail.available}
              hotelId={detail.id}
              onOpenBooking={onOpenBooking}
            />

            {/* Reviews Section */}
            {reviews.length > 0 && <ReviewsSection reviews={reviews} />}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Hôtel non trouvé</p>
            <button
              onClick={onBackToList}
              className="mt-4 text-[#003087] text-sm font-medium hover:underline"
            >
              Retour à la liste
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Rooms Section ──
function RoomsSection({
  rooms,
  roomsLoading,
  hotelAvailable,
  hotelId,
  onOpenBooking,
}: {
  rooms: RoomApiItem[];
  roomsLoading: boolean;
  hotelAvailable: boolean;
  hotelId: string;
  onOpenBooking: (hotelId: string, roomId?: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="font-display text-xl font-bold text-[#0a2a5e] mb-4 flex items-center gap-2">
        <BedDouble className="w-5 h-5 text-[#003087]" /> Types de chambres
      </h3>
      {roomsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((room) => {
            const roomPhotos = parseJsonArray(room.photos);
            const roomAmenities = parseJsonArray(room.amenities);
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-100 rounded-2xl p-5 hover:border-[#D4AF37]/30 transition-colors"
              >
                {roomPhotos[0] && (
                  <div className="aspect-[16/8] rounded-xl overflow-hidden mb-3">
                    <ImageWithFallback
                      src={roomPhotos[0]}
                      alt={room.name || room.type}
                      className="w-full h-full"
                      fallbackType="hotel"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-display text-base font-bold text-[#0a2a5e]">
                      {room.name || ROOM_TYPE_LABELS[room.type] || room.type}
                    </h4>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <Users className="w-3 h-3" /> {room.capacity} pers.
                      <BedDouble className="w-3 h-3" /> {room.totalRooms} dispo.
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      room.available ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {room.available ? 'Libre' : 'Complet'}
                  </span>
                </div>

                {roomAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {roomAmenities.slice(0, 3).map((am) => (
                      <span key={am} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[9px] rounded-full">
                        {am}
                      </span>
                    ))}
                    {roomAmenities.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[9px] rounded-full">
                        +{roomAmenities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {room.availability && room.availability.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-400 mb-1">Disponibilités (30 prochains jours)</p>
                    <div className="flex gap-0.5 overflow-hidden">
                      {room.availability.slice(0, 14).map((av, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-sm ${
                            av.status === 'AVAILABLE'
                              ? 'bg-[#00A651]/30'
                              : av.status === 'BOOKED'
                                ? 'bg-red-200'
                                : av.status === 'MAINTENANCE'
                                  ? 'bg-[#D4AF37]/30'
                                  : 'bg-gray-200'
                          }`}
                          title={`${new Date(av.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}: ${av.status}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    <span className="font-mono text-lg font-bold text-[#D4AF37]">
                      {fmtPrice(room.basePriceXof)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">FCFA/nuit</span>
                  </div>
                  {room.available && hotelAvailable && (
                    <button
                      onClick={() => onOpenBooking(hotelId, room.id)}
                      className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg text-xs font-semibold hover:bg-[#b8961f] transition-colors"
                    >
                      Réserver
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <BedDouble className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucune chambre configurée pour cet hôtel</p>
        </div>
      )}
    </div>
  );
}

// ── Reviews Section ──
function ReviewsSection({ reviews }: { reviews: ReviewApiItem[] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="font-display text-xl font-bold text-[#0a2a5e] mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" /> Avis clients
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-0.5">
                {Array.from({ length: review.overall }).map((_, j) => (
                  <Star key={j} className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                ))}
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(review.createdAt)}
              </span>
            </div>
            {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
            {(review.cleanliness || review.comfort || review.location || review.value || review.service) && (
              <div className="flex flex-wrap gap-3 mt-2">
                {review.cleanliness && <span className="text-[10px] text-gray-400">Propreté: {review.cleanliness}/5</span>}
                {review.comfort && <span className="text-[10px] text-gray-400">Confort: {review.comfort}/5</span>}
                {review.location && <span className="text-[10px] text-gray-400">Emplacement: {review.location}/5</span>}
                {review.service && <span className="text-[10px] text-gray-400">Service: {review.service}/5</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
