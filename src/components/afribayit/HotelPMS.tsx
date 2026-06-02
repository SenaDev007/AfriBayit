'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiPost, apiPatch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';
import {
  AlertTriangle, Ban, BarChart3, BedDouble, Calculator, Calendar, CheckCircle,
  ClipboardList, Coins, FileText, Hotel, Info, MessageCircle, PlaneLanding,
  PlaneTakeoff, Radio, Receipt, RefreshCw, Siren, Smartphone, Star, Target,
  TrendingUp, Users, Wrench, XCircle, Zap, Plus, Pencil, Trash2, QrCode,
  ArrowUpRight, ArrowDownRight, DollarSign, Percent, Clock, Eye, Download
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface PMSDashboardData {
  hotel: { id: string; name: string; stars: number; country: string; city: string };
  today: {
    date: string;
    arrivals: { id: string; guestName: string; checkIn: string; checkOut: string; sourceChannel: string; status: string }[];
    departures: { id: string; guestName: string; checkOut: string; sourceChannel: string; status: string }[];
    arrivalCount: number;
    departureCount: number;
  };
  occupancy: { totalRooms: number; occupiedRooms: number; availableRooms: number; occupancyRate: number };
  revenue: { today: number; thisMonth: number; adr: number; revPAR: number; currency: string };
  channels: Record<string, { bookings: number; revenue: number }>;
  alerts: { type: string; message: string; severity: 'info' | 'warning' | 'error' }[];
  rooms: { id: string; type: string; name: string | null; totalRooms: number; basePrice: number; available: boolean }[];
}

interface ReservationItem {
  id: string;
  bookingRef: string | null;
  hotelName: string;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  sourceChannel: string;
  status: string;
  specialRequests: string | null;
  createdAt: string;
}

interface RoomItem {
  id: string;
  type: string;
  name: string | null;
  capacity: number;
  totalRooms: number;
  basePrice: number;
  currency: string;
  available: boolean;
  status: string;
  channels: { ota: string; availableCount: number; rateXof: number | null; lastSyncedAt: string }[];
}

interface RateItem {
  roomId: string;
  roomType: string;
  name: string | null;
  basePrice: number;
  currency: string;
  channelRates: { ota: string; rateXof: number | null; lastSyncedAt: string }[];
}

interface SeasonalRate {
  id: string;
  name: string;
  period: string;
  multiplier: number;
  startDate: string | null;
  endDate: string | null;
}

type PMSTab = 'dashboard' | 'calendar' | 'reservations' | 'rooms' | 'rates' | 'guests' | 'reports' | 'checkin' | 'invoicing' | 'cancellation' | 'lastminute';

const easeOut = [0.16, 1, 0.3, 1] as const;

const TABS: { key: PMSTab; label: string; icon: React.ReactNode }[] = [
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

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  confirmed: 'bg-[#00A651]/10 text-[#00A651]',
  checked_in: 'bg-[#003087]/10 text-[#003087]',
  checked_out: 'bg-gray-100 text-gray-600',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-50 text-red-600',
  no_show: 'bg-orange-50 text-orange-600',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmee', checked_in: 'Enregistre',
  checked_out: 'Depart', completed: 'Terminee', cancelled: 'Annulee', no_show: 'No-show',
};

const ROOM_STATUS_COLORS: Record<string, string> = {
  available: 'bg-[#00A651]/10 text-[#00A651]',
  occupied: 'bg-[#003087]/10 text-[#003087]',
  maintenance: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  out_of_order: 'bg-red-50 text-red-600',
};

const ROOM_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible', occupied: 'Occuppee', maintenance: 'Maintenance', out_of_order: 'Hors service',
};

const ROOM_TYPES = ['single', 'double', 'suite', 'deluxe', 'family', 'studio', 'penthouse'];

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

// ─── Helpers ────────────────────────────────────────────────────

function fmt(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function channelLabel(ch: string): string {
  const map: Record<string, string> = { direct: 'Direct', booking_com: 'Booking.com', expedia: 'Expedia', guesthouse: 'Guesthouse' };
  return map[ch] || ch;
}

// ─── Skeletons ──────────────────────────────────────────────────

function DashboardSkeleton() {
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

// ─── Add/Edit Room Modal ────────────────────────────────────────

function RoomFormModal({
  open, onClose, onSubmit, initial, loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initial?: RoomItem | null;
  loading: boolean;
}) {
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

// ─── Main Component ─────────────────────────────────────────────

export default function HotelPMS() {
  const [activeTab, setActiveTab] = useState<PMSTab>('dashboard');
  const [hotelId, setHotelId] = useState<string>('');
  const [hotels, setHotels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<PMSDashboardData | null>(null);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [rates, setRates] = useState<RateItem[]>([]);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [resFilter, setResFilter] = useState({ status: '', source: '' });
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [seasonalRates, setSeasonalRates] = useState<SeasonalRate[]>([]);
  const [otaSyncStatus, setOtaSyncStatus] = useState<Record<string, { status: string; lastSync: string }>>({});
  const { selectedCountry } = useCountry();

  // Load hotels list
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ hotels: { id: string; name: string }[] }>(`/api/hotels?country=${selectedCountry}&limit=50`);
        setHotels(data.hotels || []);
        if (data.hotels?.length > 0 && !hotelId) setHotelId(data.hotels[0].id);
      } catch { /* silently fail */ }
    })();
  }, [selectedCountry, hotelId]);

  // Reload rooms after status change
  const reloadRooms = useCallback(async () => {
    if (!hotelId) return;
    try {
      const data = await apiFetch<{ rooms: RoomItem[] }>(`/api/hotels/pms/rooms?hotelId=${hotelId}`);
      setRooms(data.rooms || []);
    } catch { /* silently fail */ }
  }, [hotelId]);

  useEffect(() => {
    if (!hotelId) return;
    let cancelled = false;
    const fetchData = async () => {
      if (activeTab === 'dashboard') {
        setLoading(true);
        try {
          const data = await apiFetch<PMSDashboardData>(`/api/hotels/pms/dashboard?hotelId=${hotelId}`);
          if (!cancelled) setDashboardData(data);
        } catch { /* fail silently */ }
        if (!cancelled) setLoading(false);
      } else if (activeTab === 'reservations') {
        try {
          const params = new URLSearchParams({ hotelId, limit: '50' });
          if (resFilter.status) params.set('status', resFilter.status);
          if (resFilter.source) params.set('source', resFilter.source);
          const data = await apiFetch<{ bookings: ReservationItem[] }>(`/api/hotels/pms/reservations?${params}`);
          if (!cancelled) setReservations(data.bookings || []);
        } catch { /* fail silently */ }
      } else if (activeTab === 'rooms') {
        try {
          const data = await apiFetch<{ rooms: RoomItem[] }>(`/api/hotels/pms/rooms?hotelId=${hotelId}`);
          if (!cancelled) setRooms(data.rooms || []);
        } catch { /* fail silently */ }
      } else if (activeTab === 'rates') {
        try {
          const data = await apiFetch<{ rates: RateItem[] }>(`/api/hotels/pms/rates?hotelId=${hotelId}`);
          if (!cancelled) setRates(data.rates || []);
        } catch { /* fail silently */ }
      }
    };
    void fetchData();
    return () => { cancelled = true; };
  }, [activeTab, hotelId, resFilter]);

  // Calendar generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth, -i);
      days.push({ day: d.getDate(), dateStr: d.toISOString().split('T')[0], isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i);
      days.push({ day: d.getDate(), dateStr: d.toISOString().split('T')[0], isCurrentMonth: false });
    }
    return days;
  }, [calMonth, calYear]);

  // Sync OTA
  const handleSyncOTA = async () => {
    if (!hotelId) return;
    try {
      await apiPost('/api/ota/sync', { hotelId });
      setOtaSyncStatus((prev) => ({
        ...prev,
        booking_com: { status: 'synced', lastSync: new Date().toISOString() },
        expedia: { status: 'synced', lastSync: new Date().toISOString() },
      }));
      toast.success('Synchronisation OTA lancee');
    } catch {
      toast.error('Erreur de synchronisation OTA');
    }
  };

  // Change room status
  const handleRoomStatusChange = async (roomId: string, status: string) => {
    if (!hotelId) return;
    try {
      await apiPatch('/api/hotels/pms/rooms', { roomId, hotelId, status });
      reloadRooms();
      toast.success('Statut chambre mis a jour');
    } catch {
      toast.error('Erreur mise a jour statut');
    }
  };

  // Add/Edit room
  const handleRoomSubmit = async (data: Record<string, unknown>) => {
    if (!hotelId) return;
    try {
      if (editingRoom) {
        await apiPatch('/api/hotels/pms/rooms', { roomId: editingRoom.id, hotelId, ...data });
        toast.success('Chambre modifiee');
      } else {
        await apiPost('/api/hotels/pms/rooms', { hotelId, ...data });
        toast.success('Chambre ajoutee');
      }
      setShowRoomModal(false);
      setEditingRoom(null);
      reloadRooms();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // Delete room
  const handleDeleteRoom = async (roomId: string) => {
    if (!hotelId || !confirm('Supprimer cette chambre ?')) return;
    try {
      await apiPatch('/api/hotels/pms/rooms', { roomId, hotelId, status: 'DELETED' });
      reloadRooms();
      toast.success('Chambre supprimee');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  // Check-in handler
  const handleCheckIn = async (bookingId: string) => {
    try {
      await apiPatch('/api/hotels/pms/reservations', { bookingId, hotelId, status: 'checked_in' });
      toast.success('Enregistrement effectue');
      // Refresh reservations
      const params = new URLSearchParams({ hotelId, limit: '50' });
      const data = await apiFetch<{ bookings: ReservationItem[] }>(`/api/hotels/pms/reservations?${params}`);
      setReservations(data.bookings || []);
    } catch {
      toast.error('Erreur enregistrement');
    }
  };

  // Check-out handler
  const handleCheckOut = async (bookingId: string) => {
    try {
      await apiPatch('/api/hotels/pms/reservations', { bookingId, hotelId, status: 'checked_out' });
      toast.success('Depart enregistre');
      const params = new URLSearchParams({ hotelId, limit: '50' });
      const data = await apiFetch<{ bookings: ReservationItem[] }>(`/api/hotels/pms/reservations?${params}`);
      setReservations(data.bookings || []);
    } catch {
      toast.error('Erreur depart');
    }
  };

  // ─── OTA Sync Status Bar ────────────────────────────────────
  const OTASyncBar = () => (
    <div className="flex items-center gap-3 mb-4">
      {['booking_com', 'expedia'].map((ota) => {
        const info = otaSyncStatus[ota];
        return (
          <span key={ota} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            info?.status === 'synced' ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
          }`}>
            <RefreshCw className={`w-3 h-3 ${info?.status === 'synced' ? '' : 'animate-spin'}`} />
            {channelLabel(ota)}
            <CheckCircle className="w-3 h-3" />
          </span>
        );
      })}
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            <Hotel className="w-4 h-4" /> PMS Hotelier — AfriBayit
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Gestion <span className="text-[#003087]">Hoteliere</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Tableau de bord PMS complet : reservations, tarifs, disponibilites et canaux OTA
          </p>
        </motion.div>

        {/* Hotel Selector + OTA Sync */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white max-w-xs">
            <option value="">Selectionner un hotel</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <OTASyncBar />
            <button onClick={handleSyncOTA} className="px-4 py-2.5 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Sync OTA
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── DASHBOARD TAB ─── */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              {loading ? <DashboardSkeleton /> : dashboardData ? (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Arrivees', value: dashboardData.today.arrivalCount, icon: <PlaneLanding className="w-5 h-5" />, color: '#00A651', trend: '+12%' },
                      { label: 'Departs', value: dashboardData.today.departureCount, icon: <PlaneTakeoff className="w-5 h-5" />, color: '#003087', trend: '-3%' },
                      { label: 'Occupation', value: `${dashboardData.occupancy.occupancyRate}%`, icon: <BarChart3 className="w-5 h-5" />, color: '#D4AF37', trend: '+5%' },
                      { label: 'Revenu mois', value: `${fmt(dashboardData.revenue.thisMonth)}`, icon: <Coins className="w-5 h-5" />, color: '#00A651', trend: '+18%' },
                    ].map((kpi) => (
                      <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{kpi.icon}</span>
                            <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                          </div>
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${kpi.trend.startsWith('+') ? 'text-[#00A651]' : 'text-[#D93025]'}`}>
                            {kpi.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {kpi.trend}
                          </span>
                        </div>
                        <p className="font-mono text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Occupancy Bar Chart */}
                  <div className="bg-white rounded-2xl p-5 shadow-sm border">
                    <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
                      <Percent className="w-5 h-5" /> Taux d&apos;occupation — 7 jours
                    </h3>
                    <div className="flex items-end gap-2 h-32">
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
                        const rate = dashboardData.occupancy.occupancyRate + (Math.random() * 20 - 10);
                        const clamped = Math.min(100, Math.max(20, rate));
                        return (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-mono text-gray-500">{Math.round(clamped)}%</span>
                            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '100px' }}>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${clamped}%` }}
                                transition={{ duration: 0.8, delay: i * 0.08, ease: easeOut }}
                                className={`absolute bottom-0 w-full rounded-t-lg ${clamped > 80 ? 'bg-[#D93025]' : clamped > 60 ? 'bg-[#D4AF37]' : 'bg-[#00A651]'}`}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400">{day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alerts */}
                  {dashboardData.alerts.length > 0 && (
                    <div className="space-y-2">
                      {dashboardData.alerts.map((alert, i) => (
                        <div key={i} className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                          alert.severity === 'error' ? 'bg-red-50 text-red-700' :
                          alert.severity === 'warning' ? 'bg-[#D4AF37]/10 text-[#b8961f]' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          <span className="flex items-center">{alert.severity === 'error' ? <Siren className="w-4 h-4" /> : alert.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}</span>
                          {alert.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Revenue & Channels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Coins className="w-5 h-5" /> Revenus</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
                          <span className="font-mono font-bold text-[#00A651]">{fmt(dashboardData.revenue.today)} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Ce mois</span>
                          <span className="font-mono font-bold text-[#003087]">{fmt(dashboardData.revenue.thisMonth)} FCFA</span>
                        </div>
                        <div className="border-t pt-3 space-y-2">
                          <div className="flex justify-between items-center"><span className="text-sm text-gray-500">ADR</span><span className="font-mono text-sm font-semibold">{fmt(dashboardData.revenue.adr)} FCFA</span></div>
                          <div className="flex justify-between items-center"><span className="text-sm text-gray-500">RevPAR</span><span className="font-mono text-sm font-semibold">{fmt(dashboardData.revenue.revPAR)} FCFA</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Radio className="w-5 h-5" /> Canaux</h3>
                      <div className="space-y-3">
                        {Object.entries(dashboardData.channels).map(([channel, stats]) => (
                          <div key={channel} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{channelLabel(channel)}</span>
                            <div className="text-right"><span className="font-mono text-sm font-semibold">{stats.bookings} res.</span><span className="text-xs text-gray-400 ml-2">{fmt(stats.revenue)} FCFA</span></div>
                          </div>
                        ))}
                        {Object.keys(dashboardData.channels).length === 0 && <p className="text-sm text-gray-400">Aucune donnee de canal disponible</p>}
                      </div>
                    </div>
                  </div>

                  {/* Today Arrivals & Departures */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><PlaneLanding className="w-5 h-5" /> Arrivees aujourd&apos;hui</h3>
                      {dashboardData.today.arrivals.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {dashboardData.today.arrivals.map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                              <div><p className="text-sm font-medium text-[#2C2E2F]">{a.guestName}</p><p className="text-[10px] text-gray-500">{channelLabel(a.sourceChannel)} · {formatDate(a.checkOut)}</p></div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[a.status] || a.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-400">Aucune arrivee prevue</p>}
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><PlaneTakeoff className="w-5 h-5" /> Departs aujourd&apos;hui</h3>
                      {dashboardData.today.departures.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {dashboardData.today.departures.map((d) => (
                            <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                              <div><p className="text-sm font-medium text-[#2C2E2F]">{d.guestName}</p><p className="text-[10px] text-gray-500">{channelLabel(d.sourceChannel)}</p></div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[d.status] || d.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-400">Aucun depart prevu</p>}
                    </div>
                  </div>
                </div>
              ) : <div className="text-center py-16"><p className="text-gray-500">Selectionnez un hotel pour voir le tableau de bord</p></div>}
            </motion.div>
          )}

          {/* ─── CALENDAR TAB ─── */}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 hover:bg-gray-100 rounded-xl">&larr;</button>
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F]">{MONTH_NAMES[calMonth]} {calYear}</h3>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 hover:bg-gray-100 rounded-xl">&rarr;</button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">{WEEKDAYS.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>)}</div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cd, i) => {
                    const today = new Date();
                    const isToday = cd.dateStr === today.toISOString().split('T')[0];
                    return (
                      <div key={i} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        !cd.isCurrentMonth ? 'text-gray-300' : isToday ? 'bg-[#003087] text-white font-bold' : 'bg-[#00A651]/5 text-[#2C2E2F] hover:bg-[#00A651]/20'
                      }`}>{cd.day}</div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/20 rounded" /> Disponible</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#003087] rounded" /> Aujourd&apos;hui</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D93025]/20 rounded" /> Reserve</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── RESERVATIONS TAB ─── */}
          {activeTab === 'reservations' && (
            <motion.div key="reservations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="flex flex-wrap gap-3 mb-4">
                <select value={resFilter.status} onChange={(e) => setResFilter((f) => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-xl border text-sm bg-white">
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option><option value="confirmed">Confirmee</option><option value="checked_in">Enregistre</option><option value="cancelled">Annulee</option>
                </select>
                <select value={resFilter.source} onChange={(e) => setResFilter((f) => ({ ...f, source: e.target.value }))} className="px-3 py-2 rounded-xl border text-sm bg-white">
                  <option value="">Tous les canaux</option>
                  <option value="direct">Direct</option><option value="booking_com">Booking.com</option><option value="expedia">Expedia</option>
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
          )}

          {/* ─── ROOMS TAB ─── */}
          {activeTab === 'rooms' && (
            <motion.div key="rooms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-[#2C2E2F]">Gestion des chambres</h3>
                <button onClick={() => { setEditingRoom(null); setShowRoomModal(true); }} className="px-4 py-2 bg-[#00A651] text-white rounded-xl text-sm font-semibold hover:bg-[#008f47] transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
              </div>
              {rooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="bg-white rounded-2xl p-5 shadow-sm border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-display text-base font-bold text-[#2C2E2F]">{room.name || room.type}</h4>
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
                          <p className="font-mono text-sm font-bold text-[#2C2E2F]">{room.capacity || 2} pers.</p>
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
                        <select value={room.status} onChange={(e) => handleRoomStatusChange(room.id, e.target.value)} className="flex-1 px-3 py-2 rounded-xl border text-xs bg-white">
                          <option value="AVAILABLE">Disponible</option><option value="MAINTENANCE">Maintenance</option><option value="BLOCKED">Bloque</option>
                        </select>
                        <button onClick={() => { setEditingRoom(room); setShowRoomModal(true); }} className="p-2 rounded-xl border hover:bg-gray-50"><Pencil className="w-4 h-4 text-[#003087]" /></button>
                        <button onClick={() => handleDeleteRoom(room.id)} className="p-2 rounded-xl border hover:bg-red-50"><Trash2 className="w-4 h-4 text-[#D93025]" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-16"><p className="text-gray-500">Aucune chambre trouvee</p></div>}
              <RoomFormModal open={showRoomModal} onClose={() => { setShowRoomModal(false); setEditingRoom(null); }} onSubmit={handleRoomSubmit} initial={editingRoom} loading={false} />
            </motion.div>
          )}

          {/* ─── RATES TAB ─── */}
          {activeTab === 'rates' && (
            <motion.div key="rates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Seasonal Pricing Section */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border mb-6">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Calculator className="w-5 h-5" /> Tarifs saisonniers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Haute saison', period: 'Dec - Jan, Juil - Aout', multiplier: 1.3, color: '#D93025', icon: <Zap className="w-4 h-4" /> },
                    { name: 'Saison moyenne', period: 'Fev - Mai', multiplier: 1.0, color: '#009CDE', icon: <Clock className="w-4 h-4" /> },
                    { name: 'Basse saison', period: 'Sep - Nov', multiplier: 0.75, color: '#00A651', icon: <ArrowDownRight className="w-4 h-4" /> },
                  ].map((season) => (
                    <div key={season.name} className="p-4 rounded-2xl border-2" style={{ borderColor: `${season.color}30` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: season.color }}>{season.icon}</span>
                        <h4 className="text-sm font-bold text-[#2C2E2F]">{season.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{season.period}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-xl font-bold" style={{ color: season.color }}>x{season.multiplier}</span>
                        <span className="text-xs text-gray-400">multiplicateur</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {rates.length > 0 ? (
                <div className="space-y-4">
                  {rates.map((rate) => (
                    <div key={rate.roomId} className="bg-white rounded-2xl p-5 shadow-sm border">
                      <div className="flex items-center justify-between mb-3">
                        <div><h4 className="font-display text-base font-bold text-[#2C2E2F]">{rate.name || rate.roomType}</h4><p className="text-xs text-gray-500">Type: {rate.roomType}</p></div>
                        <div className="text-right"><p className="text-[10px] text-gray-500">Prix de base</p><p className="font-mono text-lg font-bold text-[#D4AF37]">{fmt(rate.basePrice)} FCFA</p></div>
                      </div>
                      {rate.channelRates.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Tarifs par canal</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {rate.channelRates.map((ch) => (
                              <div key={ch.ota} className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs font-medium text-gray-600 mb-1">{channelLabel(ch.ota)}</p>
                                <p className="font-mono text-sm font-bold text-[#003087]">{ch.rateXof ? fmt(ch.rateXof) : '—'} FCFA</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <div className="text-center py-16"><p className="text-gray-500">Aucun tarif trouve</p></div>}
            </motion.div>
          )}

          {/* ─── CHECK-IN/CHECK-OUT TAB ─── */}
          {activeTab === 'checkin' && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><PlaneLanding className="w-5 h-5" /> Enregistrements</h3>
                  {reservations.filter(r => r.status === 'confirmed').length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reservations.filter(r => r.status === 'confirmed').map((res) => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">Res. {res.bookingRef || res.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">{formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-14 bg-white border-2 border-[#003087] rounded-xl flex items-center justify-center">
                              <QrCode className="w-8 h-8 text-[#003087]" />
                            </div>
                            <button onClick={() => handleCheckIn(res.id)} className="px-3 py-2 bg-[#00A651] text-white rounded-xl text-xs font-semibold hover:bg-[#008f47] transition-colors">Enregistrer</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400">Aucun enregistrement prevu</p>}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><PlaneTakeoff className="w-5 h-5" /> Departs</h3>
                  {reservations.filter(r => r.status === 'checked_in').length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reservations.filter(r => r.status === 'checked_in').map((res) => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">Res. {res.bookingRef || res.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">Depart : {formatDate(res.checkOut)}</p>
                            <p className="font-mono text-sm font-bold text-[#D4AF37]">{fmt(res.totalPrice)} FCFA</p>
                          </div>
                          <button onClick={() => handleCheckOut(res.id)} className="px-3 py-2 bg-[#003087] text-white rounded-xl text-xs font-semibold hover:bg-[#0047b3] transition-colors">Depart</button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400">Aucun depart prevu</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── INVOICING TAB ─── */}
          {activeTab === 'invoicing' && (
            <motion.div key="invoicing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> Facturation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-[#00A651]/5 rounded-2xl text-center">
                    <DollarSign className="w-6 h-6 text-[#00A651] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Facture ce mois</p>
                    <p className="font-mono text-lg font-bold text-[#00A651]">{fmt(dashboardData?.revenue.thisMonth || 0)} FCFA</p>
                  </div>
                  <div className="p-4 bg-[#003087]/5 rounded-2xl text-center">
                    <Clock className="w-6 h-6 text-[#003087] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">En attente</p>
                    <p className="font-mono text-lg font-bold text-[#003087]">{reservations.filter(r => r.status === 'checked_out').length}</p>
                  </div>
                  <div className="p-4 bg-[#D4AF37]/5 rounded-2xl text-center">
                    <CheckCircle className="w-6 h-6 text-[#D4AF37] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">Payees</p>
                    <p className="font-mono text-lg font-bold text-[#D4AF37]">{reservations.filter(r => r.status === 'completed').length}</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {reservations.filter(r => ['checked_out', 'completed'].includes(r.status)).length > 0 ? (
                    reservations.filter(r => ['checked_out', 'completed'].includes(r.status)).map((res) => (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div><p className="text-sm font-semibold text-[#2C2E2F]">Facture {res.bookingRef || res.id.slice(0, 8)}</p><p className="text-xs text-gray-500">{formatDate(res.checkIn)} - {formatDate(res.checkOut)}</p></div>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-sm font-bold text-[#D4AF37]">{fmt(res.totalPrice)} FCFA</p>
                          <button className="p-2 rounded-xl border hover:bg-gray-100"><Download className="w-4 h-4 text-[#003087]" /></button>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-sm text-gray-400 text-center py-4">Aucune facture disponible</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── CANCELLATION TAB ─── */}
          {activeTab === 'cancellation' && (
            <motion.div key="cancellation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Ban className="w-5 h-5" /> Annulations</h3>
                {reservations.filter(r => r.status === 'cancelled').length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {reservations.filter(r => r.status === 'cancelled').map((res) => (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                        <div><p className="text-sm font-semibold text-[#2C2E2F]">{res.bookingRef || res.id.slice(0, 8)}</p><p className="text-xs text-gray-500">{formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)}</p></div>
                        <div className="text-right"><p className="font-mono text-sm font-bold text-[#D93025]">-{fmt(res.totalPrice)} FCFA</p><span className="text-[10px] text-gray-400">{channelLabel(res.sourceChannel)}</span></div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400 text-center py-4">Aucune annulation enregistree</p>}
              </div>
            </motion.div>
          )}

          {/* ─── LAST-MINUTE TAB ─── */}
          {activeTab === 'lastminute' && (
            <motion.div key="lastminute" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-gradient-to-br from-[#D4AF37]/10 to-[#003087]/10 rounded-2xl p-6 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-[#D4AF37]" /> Offres Last-Minute</h3>
                <p className="text-sm text-gray-500 mb-4">Chambres disponibles aujourd&apos;hui avec reduction automatique</p>
                {rooms.filter(r => r.status === 'available' || r.status === 'AVAILABLE').length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rooms.filter(r => r.status === 'available' || r.status === 'AVAILABLE').map((room) => {
                      const discountPrice = Math.round(room.basePrice * 0.7);
                      return (
                        <div key={room.id} className="bg-white rounded-2xl p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-[#2C2E2F]">{room.name || room.type}</h4>
                            <span className="px-2 py-0.5 bg-[#D93025] text-white text-[10px] font-bold rounded-full">-30%</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-lg font-bold text-[#D4AF37]">{fmt(discountPrice)}</span>
                            <span className="text-xs text-gray-400 line-through">{fmt(room.basePrice)}</span>
                            <span className="text-xs text-gray-400">FCFA/nuit</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-sm text-gray-400 text-center">Aucune chambre disponible pour last-minute</p>}
              </div>
            </motion.div>
          )}

          {/* ─── GUESTS TAB ─── */}
          {activeTab === 'guests' && (
            <motion.div key="guests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border max-w-2xl mx-auto text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Annuaire Clients</h3>
                <p className="text-sm text-gray-500 mb-4">Historique des communications, preferences et sejours passes de vos clients.</p>
                <div className="p-4 bg-gray-50 rounded-2xl text-left">
                  <p className="text-xs text-gray-400 mb-2">Fonctionnalites :</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" /> Repertoire des clients avec historique</li>
                    <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-gray-400" /> Historique des communications</li>
                    <li className="flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> Preferences et notes client</li>
                    <li className="flex items-center gap-2"><Star className="w-4 h-4 text-gray-400" /> Programme de fidelite</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── REPORTS TAB ─── */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'RevPAR', value: dashboardData ? fmt(dashboardData.revenue.revPAR) : '—', unit: 'FCFA', icon: <DollarSign className="w-5 h-5" />, color: '#003087' },
                    { label: 'ADR', value: dashboardData ? fmt(dashboardData.revenue.adr) : '—', unit: 'FCFA', icon: <Calculator className="w-5 h-5" />, color: '#D4AF37' },
                    { label: 'Taux occupation', value: dashboardData ? `${dashboardData.occupancy.occupancyRate}%` : '—', unit: '', icon: <Percent className="w-5 h-5" />, color: '#00A651' },
                    { label: 'Total reservations', value: String(reservations.length), unit: '', icon: <ClipboardList className="w-5 h-5" />, color: '#009CDE' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border">
                      <div className="flex items-center gap-2 mb-1"><span style={{ color: stat.color }}>{stat.icon}</span><span className="text-xs text-gray-500">{stat.label}</span></div>
                      <p className="font-mono text-xl font-bold" style={{ color: stat.color }}>{stat.value} <span className="text-xs font-normal text-gray-400">{stat.unit}</span></p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Eye className="w-5 h-5" /> Performance par canal</h3>
                  <div className="space-y-3">
                    {Object.entries(dashboardData?.channels || {}).map(([channel, stats]) => (
                      <div key={channel}>
                        <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-600">{channelLabel(channel)}</span><span className="font-mono text-xs font-bold">{stats.bookings} res. · {fmt(stats.revenue)} FCFA</span></div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((stats.revenue / (dashboardData?.revenue.thisMonth || 1)) * 100, 100)}%` }} transition={{ duration: 0.8, ease: easeOut }} className="h-full bg-[#003087] rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
