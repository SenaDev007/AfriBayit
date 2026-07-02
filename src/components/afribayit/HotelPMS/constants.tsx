import {
  Ban, BarChart3, BedDouble, Calendar, ClipboardList, Coins, Hotel,
  Receipt, TrendingUp, Users, Zap,
} from 'lucide-react';
import type { PMSTab } from './types';

export const TABS: { key: PMSTab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: 'calendar', label: 'Calendrier', icon: <Calendar className="w-3.5 h-3.5" /> },
  { key: 'reservations', label: 'Reservations', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: 'checkin', label: 'Check-in/out', icon: <Hotel className="w-3.5 h-3.5" /> },
  { key: 'rooms', label: 'Chambres', icon: <BedDouble className="w-3.5 h-3.5" /> },
  { key: 'rates', label: 'Tarifs', icon: <Coins className="w-3.5 h-3.5" /> },
  { key: 'invoicing', label: 'Facturation', icon: <Receipt className="w-3.5 h-3.5" /> },
  { key: 'cancellation', label: 'Annulation', icon: <Ban className="w-3.5 h-3.5" /> },
  { key: 'lastminute', label: 'Last-minute', icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'guests', label: 'Clients', icon: <Users className="w-3.5 h-3.5" /> },
  { key: 'reports', label: 'Rapports', icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  confirmed: 'bg-[#00A651]/10 text-[#00A651]',
  checked_in: 'bg-[#003087]/10 text-[#003087]',
  checked_out: 'bg-gray-100 text-gray-600',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  no_show: 'bg-orange-50 text-orange-600',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmee', checked_in: 'Enregistre',
  checked_out: 'Depart', completed: 'Terminee', cancelled: 'Annulee', no_show: 'No-show',
};

export const ROOM_STATUS_COLORS: Record<string, string> = {
  available: 'bg-[#00A651]/10 text-[#00A651]',
  occupied: 'bg-[#003087]/10 text-[#003087]',
  maintenance: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  out_of_order: 'bg-red-50 text-red-600',
};

export const ROOM_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible', occupied: 'Occuppee', maintenance: 'Maintenance', out_of_order: 'Hors service',
};

export const ROOM_TYPES = ['single', 'double', 'suite', 'deluxe', 'family', 'studio', 'penthouse'];

export const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const MONTH_NAMES = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

// Seasonal pricing demo cards
export const SEASONAL_PRICING = [
  { name: 'Haute saison', period: 'Dec - Jan, Juil - Aout', multiplier: 1.3, color: '#D93025', icon: 'zap' },
  { name: 'Saison moyenne', period: 'Fev - Mai', multiplier: 1.0, color: '#009CDE', icon: 'clock' },
  { name: 'Basse saison', period: 'Sep - Nov', multiplier: 0.75, color: '#00A651', icon: 'down' },
];
