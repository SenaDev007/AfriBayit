import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Plus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { ROOM_TYPES } from './constants';
import type { RoomItem } from './types';

export function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

export function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function channelLabel(ch: string): string {
  const map: Record<string, string> = { direct: 'Direct', booking_com: 'OTA Partner', expedia: 'Expedia', guesthouse: 'Guesthouse' };
  return map[ch] || ch;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

interface RoomFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initial?: RoomItem | null;
  loading: boolean;
}

export function RoomFormModal({ open, onClose, onSubmit, initial, loading }: RoomFormModalProps) {
  const defaultForm = { type: 'double', name: '', capacity: 2, totalRooms: 1, basePrice: 25000, currency: 'XOF' };
  const [form, setForm] = useState(defaultForm);
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initial ? {
        type: initial.type || 'double',
        name: initial.name || '',
        capacity: initial.capacity || 2,
        totalRooms: initial.totalRooms || 1,
        basePrice: initial.basePrice || 25000,
        currency: initial.currency || 'XOF',
      } : defaultForm);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4"
      >
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
          {initial ? <Pencil className="w-5 h-5 text-[#003087]" /> : <Plus className="w-5 h-5 text-[#00A651]" />}
          {initial ? 'Modifier la chambre' : 'Ajouter une chambre'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type de chambre</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm">
              {ROOM_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nom (optionnel)</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm" placeholder="Ex: Suite Panorama" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Capacite (pers.)</label>
              <input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nombre de chambres</label>
              <input type="number" min={1} max={200} value={form.totalRooms} onChange={(e) => setForm((f) => ({ ...f, totalRooms: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Prix de base (FCFA/nuit)</label>
            <input type="number" min={0} value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border text-sm font-mono" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors">Annuler</button>
          <button onClick={() => onSubmit(form)} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-[#003087] text-white text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50">
            {loading ? '...' : initial ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
