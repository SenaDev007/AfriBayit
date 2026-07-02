// P3.7-2 — Booking modal: room selection, dates, guests, special
// requests, and a price estimate based on selected room/nights.

import { motion } from 'framer-motion';
import { CalendarDays, Users, X } from 'lucide-react';
import type { BookingFormState, HotelDetailApiItem, RoomApiItem } from './types';
import { ROOM_TYPE_LABELS, fmtPrice } from './utils';

interface BookingDialogProps {
  open: boolean;
  detail?: HotelDetailApiItem;
  rooms: RoomApiItem[];
  selectedRoomId: string | null;
  setSelectedRoomId: (v: string | null) => void;
  bookingForm: BookingFormState;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormState>>;
  onSubmit: () => void;
  isPending: boolean;
  onClose: () => void;
}

export default function BookingDialog(props: BookingDialogProps) {
  const {
    open,
    detail,
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    bookingForm,
    setBookingForm,
    onSubmit,
    isPending,
    onClose,
  } = props;

  if (!open) return null;

  // Price estimate
  let priceEstimate: { nights: number; pricePerNight: number; total: number } | null = null;
  if (bookingForm.checkIn && bookingForm.checkOut) {
    const nights = Math.max(
      1,
      Math.ceil(
        (new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
    const pricePerNight = selectedRoom?.basePriceXof || detail?.pricePerNight || 0;
    priceEstimate = { nights, pricePerNight, total: pricePerNight * nights };
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-[#2C2E2F]">Réserver</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Hotel Name */}
        {detail && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm font-semibold text-[#2C2E2F]">{detail.name}</p>
            <p className="text-xs text-gray-500">
              {detail.city}, {detail.country}
            </p>
          </div>
        )}

        {/* Room Selection */}
        {rooms.length > 0 && (
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type de chambre</label>
            <select
              value={selectedRoomId || ''}
              onChange={(e) => setSelectedRoomId(e.target.value || null)}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
            >
              <option value="">Sans préférence</option>
              {rooms
                .filter((r) => r.available)
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name || ROOM_TYPE_LABELS[room.type] || room.type} — {fmtPrice(room.basePriceXof)}{' '}
                    FCFA/nuit
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Date d&apos;arrivée
            </label>
            <input
              type="date"
              value={bookingForm.checkIn}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, checkIn: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> Date de départ
            </label>
            <input
              type="date"
              value={bookingForm.checkOut}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, checkOut: e.target.value }))}
              min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block flex items-center gap-1">
              <Users className="w-3 h-3" /> Nombre de personnes
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={bookingForm.guests}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, guests: Number(e.target.value) || 1 }))}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Demandes spéciales</label>
            <textarea
              rows={2}
              value={bookingForm.specialRequests}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, specialRequests: e.target.value }))}
              placeholder="Ex: chambre avec vue, lit bébé..."
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Price Estimate */}
          {priceEstimate && (
            <div className="p-3 bg-[#D4AF37]/5 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Estimation</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {fmtPrice(priceEstimate.pricePerNight)} × {priceEstimate.nights} nuit
                  {priceEstimate.nights > 1 ? 's' : ''}
                </span>
                <span className="font-mono text-lg font-bold text-[#D4AF37]">
                  {fmtPrice(priceEstimate.total)} FCFA
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onSubmit}
              disabled={isPending || !bookingForm.checkIn || !bookingForm.checkOut}
              className="flex-1 py-3 bg-[#D4AF37] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait hover:bg-[#b8961f] transition-colors"
            >
              {isPending ? 'Réservation...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
