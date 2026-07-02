'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Coins, X } from 'lucide-react';
import { formatPrice } from './utils';
import type { GuesthouseRoomItem } from './types';

interface BookingDialogProps {
  bookingRoom: GuesthouseRoomItem;
  bookingCheckIn: string;
  setBookingCheckIn: (v: string) => void;
  bookingCheckOut: string;
  setBookingCheckOut: (v: string) => void;
  bookingGuests: number;
  setBookingGuests: (v: number) => void;
  bookingBreakfast: boolean;
  setBookingBreakfast: (v: boolean) => void;
  dynamicPrice: number | null;
  cancellationPolicy: string;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export default function BookingDialog({
  bookingRoom,
  bookingCheckIn,
  setBookingCheckIn,
  bookingCheckOut,
  setBookingCheckOut,
  bookingGuests,
  setBookingGuests,
  bookingBreakfast,
  setBookingBreakfast,
  dynamicPrice,
  cancellationPolicy,
  onClose,
  onConfirm,
  isPending,
}: BookingDialogProps) {
  const pricePerNight = dynamicPrice || bookingRoom.basePrice;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Réserver {bookingRoom.name}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-1">
          {formatPrice(pricePerNight)} FCFA / nuit · {bookingRoom.capacity} pers.
        </p>
        {dynamicPrice && dynamicPrice !== bookingRoom.basePrice && (
          <p className="text-[10px] text-[#D4AF37] mb-1 flex items-center gap-1"><Coins className="w-3 h-3" /> Tarif dynamique appliqué (base: {formatPrice(bookingRoom.basePrice)} FCFA)</p>
        )}
        <p className="text-[10px] text-gray-400 mb-4 flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {cancellationPolicy}</p>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date d&apos;arrivée</label>
              <input
                type="date"
                value={bookingCheckIn}
                onChange={e => setBookingCheckIn(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Date de départ</label>
              <input
                type="date"
                value={bookingCheckOut}
                onChange={e => setBookingCheckOut(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nombre de voyageurs</label>
            <select
              value={bookingGuests}
              onChange={e => setBookingGuests(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
            >
              {Array.from({ length: bookingRoom.capacity }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <input
              type="checkbox"
              id="breakfast"
              checked={bookingBreakfast}
              onChange={e => setBookingBreakfast(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#003087] focus:ring-[#003087]"
            />
            <label htmlFor="breakfast" className="text-sm text-gray-700">
              Inclure le petit-déjeuner
            </label>
          </div>

          {/* Price summary */}
          {bookingCheckIn && bookingCheckOut && (
            <div className="p-3 bg-[#D4AF37]/5 rounded-xl">
              {(() => {
                const nights = Math.max(1, Math.ceil((new Date(bookingCheckOut).getTime() - new Date(bookingCheckIn).getTime()) / (1000 * 60 * 60 * 24)));
                const total = pricePerNight * nights;
                return (
                  <>
                    <p className="text-xs text-gray-500">{nights} nuit(s) × {formatPrice(pricePerNight)} FCFA</p>
                    <p className="font-mono text-lg font-bold text-[#D4AF37]">{formatPrice(total)} FCFA</p>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!bookingCheckIn || !bookingCheckOut || isPending}
            className="flex-1 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] disabled:opacity-50"
          >
            {isPending ? 'Réservation...' : 'Confirmer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
