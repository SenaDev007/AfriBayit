import { type ReactNode } from 'react';
import {
  BarChart3,
  Calendar,
  PartyPopper,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { GuesthouseListItem } from './types';

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

export function parseSchedule(raw: string | null | undefined): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') {
      if (parsed.start && parsed.end) return `${parsed.start}-${parsed.end}`;
      if (parsed.hours) return parsed.hours;
      if (parsed.shift) return String(parsed.shift);
    }
    return JSON.stringify(parsed);
  } catch {
    return raw;
  }
}

export function formatModifier(multiplier: number): string {
  if (multiplier === 1) return '0%';
  if (multiplier > 1) return `+${Math.round((multiplier - 1) * 100)}%`;
  return `-${Math.round((1 - multiplier) * 100)}%`;
}

export function formatPeriodDates(startDate: string | null, endDate: string | null, eventName: string | null): string {
  if (eventName) return eventName;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[start.getMonth()]} – ${months[end.getMonth()]}`;
  }
  return '';
}

export function periodLabel(period: string): string {
  const map: Record<string, string> = {
    low_season: 'Basse saison',
    high_season: 'Haute saison',
    event: 'Événementiel',
    holiday: 'Fêtes',
    custom: 'Personnalisé',
  };
  return map[period] || period;
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    receptionist: 'Réceptionniste',
    housekeeping: 'Femme de ménage',
    cook: 'Cuisinier(e)',
    security: 'Sécurité',
    manager: 'Gérant(e)',
    maintenance: 'Maintenance',
    concierge: 'Concierge',
  };
  return map[role] || role;
}

export function getPricingPeriodIcon(period: string): ReactNode {
  const map: Record<string, ReactNode> = {
    low_season: <TrendingDown className="w-5 h-5" />,
    high_season: <TrendingUp className="w-5 h-5" />,
    event: <PartyPopper className="w-5 h-5" />,
    holiday: <Calendar className="w-5 h-5" />,
    custom: <BarChart3 className="w-5 h-5" />,
  };
  return map[period] || <BarChart3 className="w-5 h-5" />;
}

export function getPricingPeriodColor(period: string): string {
  const isLow = period === 'low_season';
  const isHigh = period === 'high_season';
  const isEvent = period === 'event' || period === 'holiday';
  return isLow ? '#009CDE' : isHigh ? '#D4AF37' : isEvent ? '#D93025' : '#6b7280';
}

export function getPriceRange(gh: GuesthouseListItem): { min: number; max: number } {
  if (!gh.rooms?.length) return { min: 0, max: 0 };
  const prices = gh.rooms.map(r => r.basePrice);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}
