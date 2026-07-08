'use client';

import type { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { ReservationItem } from './types';
import { easeOut } from './types';
import { fmt, formatDate, channelLabel } from './utils';
import { STATUS_COLORS, STATUS_LABELS } from './constants';

interface ReservationsPanelProps {
  resFilter: { status: string; source: string };
  setResFilter: Dispatch<SetStateAction<{ status: string; source: string }>>;
  reservations: ReservationItem[];
}

export default function ReservationsPanel({ resFilter, setResFilter, reservations }: ReservationsPanelProps) {
  return (
    <motion.div key="reservations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={resFilter.status} onChange={(e) => setResFilter((f) => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-xl border text-sm bg-white">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option><option value="confirmed">Confirmee</option><option value="checked_in">Enregistre</option><option value="cancelled">Annulee</option>
        </select>
        <select value={resFilter.source} onChange={(e) => setResFilter((f) => ({ ...f, source: e.target.value }))} className="px-3 py-2 rounded-xl border text-sm bg-white">
          <option value="">Tous les canaux</option>
          <option value="direct">Direct</option><option value="booking_com">OTA Partner</option><option value="expedia">Expedia</option>
        </select>
      </div>
      {reservations.length > 0 ? (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {reservations.map((res) => (
            <motion.div key={res.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-gray-400">{res.bookingRef || res.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[res.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[res.status] || res.status}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#2C2E2F]">{formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)} · {res.guests} pers.</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{channelLabel(res.sourceChannel)}</span>
                    {res.specialRequests && <span className="text-xs text-[#D4AF37] flex items-center gap-1"><FileText className="w-3 h-3" /> Demande speciale</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-[#D4AF37]">{fmt(res.totalPrice)}</p>
                  <p className="text-[10px] text-gray-400">{res.currency}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : <div className="text-center py-16"><p className="text-gray-500">Aucune reservation trouvee</p></div>}
    </motion.div>
  );
}
