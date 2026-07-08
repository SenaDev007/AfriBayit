'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bed } from 'lucide-react';
import { easeOut } from './constants';
import { parseJsonArray, formatPrice } from './utils';
import { RoomCardSkeleton } from './Skeletons';
import type { GuesthouseDetail, GuesthouseListItem, GuesthouseRoomItem } from './types';

interface ChambersPanelProps {
  guesthousesList: GuesthouseListItem[];
  effectiveGhId: string | null;
  setSelectedGhId: (id: string) => void;
  detailLoadingState: boolean;
  activeDetail: GuesthouseDetail | undefined;
  onOpenBooking: (room: GuesthouseRoomItem) => void;
}

export default function ChambersPanel({
  guesthousesList,
  effectiveGhId,
  setSelectedGhId,
  detailLoadingState,
  activeDetail,
  onOpenBooking,
}: ChambersPanelProps) {
  return (
    <motion.div
      key="chambers"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: easeOut }}
    >
      {/* Guesthouse selector */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={effectiveGhId || ''}
          onChange={e => setSelectedGhId(e.target.value)}
          className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
        >
          {guesthousesList.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
        </select>
      </div>

      {detailLoadingState ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      ) : activeDetail && activeDetail.rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeDetail.rooms.map((ch, i) => {
            const amenities = parseJsonArray(ch.amenities);
            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-3xl p-5 shadow-sm border"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-base font-bold text-[#2C2E2F]">{ch.name}</h4>
                  <span className={`w-3 h-3 rounded-full ${ch.available ? 'bg-[#00A651]' : 'bg-[#D93025]'}`} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-500">Capacité</p>
                    <p className="font-mono text-sm font-bold text-[#2C2E2F]">{ch.capacity} pers.</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-gray-500">Prix/nuit</p>
                    <p className="font-mono text-sm font-bold text-[#D4AF37]">{formatPrice(ch.basePrice)} FCFA</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {amenities.map(a => (
                    <span key={a} className="px-2 py-0.5 bg-[#009CDE]/5 text-[#009CDE] rounded-full text-[10px] font-medium">{a}</span>
                  ))}
                </div>
                <button
                  onClick={() => onOpenBooking(ch)}
                  disabled={!ch.available}
                  className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${
                    ch.available ? 'bg-[#003087] text-white hover:bg-[#0047b3]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {ch.available ? 'Réserver' : 'Indisponible'}
                </button>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune chambre disponible pour cette guesthouse.</p>
        </div>
      )}
    </motion.div>
  );
}
