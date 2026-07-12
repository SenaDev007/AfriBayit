'use client';

import { motion } from 'framer-motion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { RoomItem } from './types';
import { easeOut } from './types';
import { fmt, channelLabel, RoomFormModal } from './utils';
import { ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from './constants';

interface RoomsPanelProps {
  rooms: RoomItem[];
  showRoomModal: boolean;
  editingRoom: RoomItem | null;
  onOpenAdd: () => void;
  onOpenEdit: (room: RoomItem) => void;
  onCloseModal: () => void;
  onSubmitRoom: (data: Record<string, unknown>) => void;
  onDeleteRoom: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function RoomsPanel({
  rooms, showRoomModal, editingRoom,
  onOpenAdd, onOpenEdit, onCloseModal, onSubmitRoom, onDeleteRoom, onStatusChange,
}: RoomsPanelProps) {
  return (
    <motion.div key="rooms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-[#0a2a5e]">Gestion des chambres</h3>
        <button onClick={onOpenAdd} className="px-4 py-2 bg-[#00A651] text-white rounded-xl text-sm font-semibold hover:bg-[#008f47] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl p-5 shadow-sm border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-display text-base font-bold text-[#0a2a5e]">{room.name || room.type}</h4>
                  <p className="text-xs text-gray-500">{room.type} · {room.totalRooms} chambre(s)</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${ROOM_STATUS_COLORS[room.status] || 'bg-gray-100 text-gray-600'}`}>
                  {ROOM_STATUS_LABELS[room.status] || room.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500">Prix base</p>
                  <p className="font-mono text-sm font-bold text-[#D4AF37]">{fmt(room.basePrice)} FCFA</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-xl">
                  <p className="text-[10px] text-gray-500">Capacite</p>
                  <p className="font-mono text-sm font-bold text-[#0a2a5e]">{room.capacity || 2} pers.</p>
                </div>
              </div>
              {room.channels.length > 0 && (
                <div className="mb-3 space-y-1">
                  {room.channels.map((ch) => (
                    <div key={ch.ota} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500">{channelLabel(ch.ota)}</span>
                      <span className="font-mono font-medium">{ch.rateXof ? fmt(ch.rateXof) : '—'} FCFA</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select value={room.status} onChange={(e) => onStatusChange(room.id, e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-xs bg-white">
                  <option value="AVAILABLE">Disponible</option><option value="MAINTENANCE">Maintenance</option><option value="BLOCKED">Bloque</option>
                </select>
                <button onClick={() => onOpenEdit(room)} className="p-2 rounded-xl border hover:bg-gray-50"><Pencil className="w-4 h-4 text-[#003087]" /></button>
                <button onClick={() => onDeleteRoom(room.id)} className="p-2 rounded-xl border hover:bg-red-50"><Trash2 className="w-4 h-4 text-[#D93025]" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="text-center py-16"><p className="text-gray-500">Aucune chambre trouvee</p></div>}
      <RoomFormModal open={showRoomModal} onClose={onCloseModal} onSubmit={onSubmitRoom} initial={editingRoom} loading={false} />
    </motion.div>
  );
}
