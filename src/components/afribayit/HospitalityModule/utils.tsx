// P3.7-2 — Shared utilities, icon maps, and skeleton loaders
// for the HospitalityModule.

import React from 'react';
import {
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle,
  Coffee,
  Dumbbell,
  Lock,
  Phone,
  Star,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const easeOut = [0.16, 1, 0.3, 1] as const;

// ── Amenity icon mapping ──
export const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3 h-3" />,
  'wi-fi': <Wifi className="w-3 h-3" />,
  parking: <Car className="w-3 h-3" />,
  piscine: <Waves className="w-3 h-3" />,
  pool: <Waves className="w-3 h-3" />,
  restaurant: <UtensilsCrossed className="w-3 h-3" />,
  climatisation: <Wind className="w-3 h-3" />,
  'air conditioning': <Wind className="w-3 h-3" />,
  gym: <Dumbbell className="w-3 h-3" />,
  fitness: <Dumbbell className="w-3 h-3" />,
  'petit-déjeuner': <Coffee className="w-3 h-3" />,
  breakfast: <Coffee className="w-3 h-3" />,
  tv: <Tv className="w-3 h-3" />,
  téléphone: <Phone className="w-3 h-3" />,
  coffre: <Lock className="w-3 h-3" />,
  safe: <Lock className="w-3 h-3" />,
};

export const ROOM_TYPE_LABELS: Record<string, string> = {
  single: 'Simple',
  double: 'Double',
  suite: 'Suite',
  deluxe: 'Deluxe',
  family: 'Familiale',
  standard: 'Standard',
};

// ── Helpers ──
export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getFirstImage(images: string | null | undefined): string {
  const arr = parseJsonArray(images);
  return arr[0] || '';
}

export function fmtPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function getOtaStatus(
  otaRefs: string | null | undefined
): { ota: string; label: string; synced: boolean }[] {
  if (!otaRefs) return [];
  try {
    const refs = JSON.parse(otaRefs);
    const result: { ota: string; label: string; synced: boolean }[] = [];
    if (refs.booking_com_id) result.push({ ota: 'booking_com', label: 'OTA Partner', synced: true });
    if (refs.expedia_id) result.push({ ota: 'expedia', label: 'Expedia', synced: true });
    return result;
  } catch {
    return [];
  }
}

export function getConnectionLevelLabel(level: number): { label: string; color: string } {
  switch (level) {
    case 1:
      return { label: 'OTA', color: 'bg-[#009CDE]/10 text-[#009CDE]' };
    case 2:
      return { label: 'PMS', color: 'bg-[#003087]/10 text-[#003087]' };
    case 3:
      return { label: 'Guesthouse', color: 'bg-[#D4AF37]/10 text-[#D4AF37]' };
    default:
      return { label: 'Direct', color: 'bg-gray-100 text-gray-600' };
  }
}

// ── Skeleton loaders ──
export function HotelCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Star Rating Filter ──
export function StarFilter({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(value === s ? 0 : s)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-4 h-4 ${s <= value ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}
