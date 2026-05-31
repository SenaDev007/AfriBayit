'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiPost, apiPatch } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { AlertTriangle, Ban, Banknote, BarChart3, BedDouble, Calculator, Calendar, CheckCircle, ClipboardList, Coins, FileText, Hotel, Inbox, Info, MessageCircle, Plane, PlaneLanding, PlaneTakeoff, Radio, Receipt, RefreshCw, Siren, Smartphone, Star, Target, TrendingUp, Users, Wrench, XCircle, Zap } from 'lucide-react';

//  Types 

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

type PMSTab = 'dashboard' | 'calendar' | 'reservations' | 'rooms' | 'rates' | 'guests' | 'reports' | 'checkin' | 'invoicing' | 'cancellation' | 'lastminute';

const easeOut = [0.16, 1, 0.3, 1] as const;

const TABS: { key: PMSTab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: 'calendar', label: 'Calendrier', icon: <Calendar className="w-3.5 h-3.5" /> },
  { key: 'reservations', label: 'Réservations', icon: <ClipboardList className="w-3.5 h-3.5" /> },
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
  pending: 'En attente',
  confirmed: 'Confirmée',
  checked_in: 'Enregistré',
  checked_out: 'Départ',
  completed: 'Terminée',
  cancelled: 'Annulée',
  no_show: 'No-show',
};

const ROOM_STATUS_COLORS: Record<string, string> = {
  available: 'bg-[#00A651]/10 text-[#00A651]',
  occupied: 'bg-[#003087]/10 text-[#003087]',
  maintenance: 'bg-[#D4AF37]/10 text-[#D4AF37]',
  out_of_order: 'bg-red-50 text-red-600',
};

const ROOM_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  occupied: 'Occupée',
  maintenance: 'Maintenance',
  out_of_order: 'Hors service',
};

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

//  Helpers 

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

//  Skeletons 

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

//  Main Component 

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
  const { selectedCountry } = useCountry();

  // Load hotels list
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ hotels: { id: string; name: string }[] }>(`/api/hotels?country=${selectedCountry}&limit=50`);
        setHotels(data.hotels || []);
        if (data.hotels?.length > 0 && !hotelId) {
          setHotelId(data.hotels[0].id);
        }
      } catch {
        // silently fail
      }
    })();
  }, [selectedCountry, hotelId]);

  // Reload rooms after status change
  const reloadRooms = useCallback(async () => {
    if (!hotelId) return;
    try {
      const data = await apiFetch<{ rooms: RoomItem[] }>(`/api/hotels/pms/rooms?hotelId=${hotelId}`);
      setRooms(data.rooms || []);
    } catch {
      // silently fail
    }
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
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday start

    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth, -i);
      days.push({ day: d.getDate(), dateStr: d.toISOString().split('T')[0], isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr, isCurrentMonth: true });
    }
    // Next month padding
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
    } catch {
      // silently fail
    }
  };

  // Change room status
  const handleRoomStatusChange = async (roomId: string, status: string) => {
    if (!hotelId) return;
    try {
      await apiPatch('/api/hotels/pms/rooms', { roomId, hotelId, status });
      reloadRooms();
    } catch {
      // silently fail
    }
  };

  //  Render 

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            <Hotel className="w-4 h-4" /> PMS Hôtelier — AfriBayit
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Gestion <span className="text-[#003087]">Hôtelière</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Tableau de bord PMS complet : réservations, tarifs, disponibilités et canaux OTA
          </p>
        </motion.div>

        {/* Hotel Selector + OTA Sync */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <select
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white max-w-xs"
          >
            <option value="">Sélectionner un hôtel</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <button
            onClick={handleSyncOTA}
            className="px-4 py-2.5 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Synchroniser OTA
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/*  DASHBOARD TAB  */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              {loading ? <DashboardSkeleton /> : dashboardData ? (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Arrivées', value: dashboardData.today.arrivalCount, icon: <PlaneLanding className="w-5 h-5" />, color: '#00A651' },
                      { label: 'Départs', value: dashboardData.today.departureCount, icon: <PlaneTakeoff className="w-5 h-5" />, color: '#003087' },
                      { label: 'Occupation', value: `${dashboardData.occupancy.occupancyRate}%`, icon: <BarChart3 className="w-5 h-5" />, color: '#D4AF37' },
                      { label: 'Revenu mois', value: `${fmt(dashboardData.revenue.thisMonth)}`, icon: <Coins className="w-5 h-5" />, color: '#00A651' },
                    ].map((kpi) => (
                      <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-500">{kpi.icon}</span>
                          <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
                        </div>
                        <p className="font-mono text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
                      </motion.div>
                    ))}
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
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">ADR</span>
                            <span className="font-mono text-sm font-semibold">{fmt(dashboardData.revenue.adr)} FCFA</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">RevPAR</span>
                            <span className="font-mono text-sm font-semibold">{fmt(dashboardData.revenue.revPAR)} FCFA</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Radio className="w-5 h-5" /> Canaux</h3>
                      <div className="space-y-3">
                        {Object.entries(dashboardData.channels).map(([channel, stats]) => (
                          <div key={channel} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{channelLabel(channel)}</span>
                            <div className="text-right">
                              <span className="font-mono text-sm font-semibold">{stats.bookings} rés.</span>
                              <span className="text-xs text-gray-400 ml-2">{fmt(stats.revenue)} FCFA</span>
                            </div>
                          </div>
                        ))}
                        {Object.keys(dashboardData.channels).length === 0 && (
                          <p className="text-sm text-gray-400">Aucune donnée de canal disponible</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Today Arrivals & Departures */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><PlaneLanding className="w-5 h-5" /> Arrivées aujourd&apos;hui</h3>
                      {dashboardData.today.arrivals.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {dashboardData.today.arrivals.map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                              <div>
                                <p className="text-sm font-medium text-[#2C2E2F]">{a.guestName}</p>
                                <p className="text-[10px] text-gray-500">{channelLabel(a.sourceChannel)} · {formatDate(a.checkOut)}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABELS[a.status] || a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Aucune arrivée prévue</p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><PlaneTakeoff className="w-5 h-5" /> Départs aujourd&apos;hui</h3>
                      {dashboardData.today.departures.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {dashboardData.today.departures.map((d) => (
                            <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                              <div>
                                <p className="text-sm font-medium text-[#2C2E2F]">{d.guestName}</p>
                                <p className="text-[10px] text-gray-500">{channelLabel(d.sourceChannel)}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABELS[d.status] || d.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Aucun départ prévu</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500">Sélectionnez un hôtel pour voir le tableau de bord</p>
                </div>
              )}
            </motion.div>
          )}

          {/*  CALENDAR TAB  */}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 hover:bg-gray-100 rounded-xl">←</button>
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F]">{MONTH_NAMES[calMonth]} {calYear}</h3>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 hover:bg-gray-100 rounded-xl">→</button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cd, i) => {
                    const today = new Date();
                    const isToday = cd.dateStr === today.toISOString().split('T')[0];
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          !cd.isCurrentMonth ? 'text-gray-300' :
                          isToday ? 'bg-[#003087] text-white font-bold' :
                          'bg-[#00A651]/5 text-[#2C2E2F] hover:bg-[#00A651]/20'
                        }`}
                      >
                        {cd.day}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/20 rounded" /> Disponible</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#003087] rounded" /> Aujourd&apos;hui</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D93025]/20 rounded" /> Réservé</span>
                </div>
              </div>
            </motion.div>
          )}

          {/*  RESERVATIONS TAB  */}
          {activeTab === 'reservations' && (
            <motion.div key="reservations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <select
                  value={resFilter.status}
                  onChange={(e) => setResFilter((f) => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 rounded-xl border text-sm bg-white"
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="checked_in">Enregistré</option>
                  <option value="cancelled">Annulée</option>
                </select>
                <select
                  value={resFilter.source}
                  onChange={(e) => setResFilter((f) => ({ ...f, source: e.target.value }))}
                  className="px-3 py-2 rounded-xl border text-sm bg-white"
                >
                  <option value="">Tous les canaux</option>
                  <option value="direct">Direct</option>
                  <option value="booking_com">Booking.com</option>
                  <option value="expedia">Expedia</option>
                </select>
              </div>

              {/* List */}
              {reservations.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {reservations.map((res) => (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-gray-400">{res.bookingRef || res.id.slice(0, 8)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[res.status] || 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABELS[res.status] || res.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#2C2E2F]">
                            {formatDate(res.checkIn)} → {formatDate(res.checkOut)} · {res.guests} pers.
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">{channelLabel(res.sourceChannel)}</span>
                            {res.specialRequests && <span className="text-xs text-[#D4AF37] flex items-center gap-1"><FileText className="w-3 h-3" /> Demande spéciale</span>}
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
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500">Aucune réservation trouvée</p>
                </div>
              )}
            </motion.div>
          )}

          {/*  ROOMS TAB  */}
          {activeTab === 'rooms' && (
            <motion.div key="rooms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
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
                          <p className="text-[10px] text-gray-500">Capacité</p>
                          <p className="font-mono text-sm font-bold text-[#2C2E2F]">{room.capacity || 2} pers.</p>
                        </div>
                      </div>

                      {/* Channel breakdown */}
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

                      {/* Status change */}
                      <select
                        value={room.status}
                        onChange={(e) => handleRoomStatusChange(room.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs bg-white"
                      >
                        <option value="AVAILABLE">Disponible</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="BLOCKED">Bloqué</option>
                      </select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500">Aucune chambre trouvée</p>
                </div>
              )}
            </motion.div>
          )}

          {/*  RATES TAB  */}
          {activeTab === 'rates' && (
            <motion.div key="rates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              {rates.length > 0 ? (
                <div className="space-y-4">
                  {rates.map((rate) => (
                    <div key={rate.roomId} className="bg-white rounded-2xl p-5 shadow-sm border">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-display text-base font-bold text-[#2C2E2F]">{rate.name || rate.roomType}</h4>
                          <p className="text-xs text-gray-500">Type: {rate.roomType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Prix de base</p>
                          <p className="font-mono text-lg font-bold text-[#D4AF37]">{fmt(rate.basePrice)} FCFA</p>
                        </div>
                      </div>

                      {rate.channelRates.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-semibold text-gray-500 mb-2">Tarifs par canal</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {rate.channelRates.map((ch) => (
                              <div key={ch.ota} className="p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs font-medium text-gray-600 mb-1">{channelLabel(ch.ota)}</p>
                                <p className="font-mono text-sm font-bold text-[#003087]">
                                  {ch.rateXof ? fmt(ch.rateXof) : '—'} FCFA
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500">Aucun tarif trouvé</p>
                </div>
              )}
            </motion.div>
          )}

          {/*  GUESTS TAB  */}
          {activeTab === 'guests' && (
            <motion.div key="guests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-6 shadow-sm border max-w-2xl mx-auto text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Annuaire Clients</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Historique des communications, préférences et séjours passés de vos clients.
                </p>
                <div className="p-4 bg-gray-50 rounded-2xl text-left">
                  <p className="text-xs text-gray-400 mb-2">Fonctionnalités à venir :</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" /> Répertoire des clients avec historique</li>
                    <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-gray-400" /> Historique des communications</li>
                    <li className="flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> Préférences et notes client</li>
                    <li className="flex items-center gap-2"><Star className="w-4 h-4 text-gray-400" /> Programme de fidélité</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/*  CHECK-IN/CHECK-OUT TAB  */}
          {activeTab === 'checkin' && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Today's Check-ins */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
                    <PlaneLanding className="w-5 h-5" /> Enregistrements aujourd&apos;hui
                  </h3>
                  {reservations.filter(r => r.status === 'confirmed').length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reservations.filter(r => r.status === 'confirmed').map((res) => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">Rés. {res.bookingRef || res.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">{formatDate(res.checkIn)} → {formatDate(res.checkOut)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-16 bg-white border-2 border-[#003087] rounded-xl flex items-center justify-center">
                              <svg viewBox="0 0 64 64" className="w-14 h-14">
                                <rect x="4" y="4" width="56" height="56" rx="4" fill="white" stroke="#003087" strokeWidth="2"/>
                                <text x="32" y="24" textAnchor="middle" fontSize="8" fill="#003087" fontWeight="bold">AFRIBAYIT</text>
                                <text x="32" y="38" textAnchor="middle" fontSize="10" fill="#2C2E2F">{res.bookingRef?.slice(0, 6) || res.id.slice(0, 6)}</text>
                                <text x="32" y="52" textAnchor="middle" fontSize="7" fill="#666">QR</text>
                              </svg>
                            </div>
                            <button
                              onClick={() => {/* API call to check in */}}
                              className="px-3 py-2 bg-[#00A651] text-white rounded-xl text-xs font-semibold hover:bg-[#008f47] transition-colors"
                            >
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucun enregistrement prévu</p>
                  )}
                </div>

                {/* Today's Check-outs */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
                    <PlaneTakeoff className="w-5 h-5" /> Départs aujourd&apos;hui
                  </h3>
                  {reservations.filter(r => r.status === 'checked_in').length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {reservations.filter(r => r.status === 'checked_in').map((res) => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">Rés. {res.bookingRef || res.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">Départ : {formatDate(res.checkOut)}</p>
                            <p className="font-mono text-sm font-bold text-[#D4AF37]">{fmt(res.totalPrice)} FCFA</p>
                          </div>
                          <button
                            onClick={() => {/* API call to check out */}}
                            className="px-3 py-2 bg-[#003087] text-white rounded-xl text-xs font-semibold hover:bg-[#0047b3] transition-colors"
                          >
                            Départ
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucun départ prévu</p>
                  )}
                </div>
              </div>

              {/* QR Code Info */}
              <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-2 flex items-center gap-2"><Smartphone className="w-5 h-5" /> QR Code AfriBayit</h3>
                <p className="text-sm text-gray-500">Chaque réservation reçoit un QR code unique pour un check-in sans contact. Le client présente le QR à l&apos;arrivée, le personnel scanne et la chambre est enregistrée automatiquement.</p>
              </div>
            </motion.div>
          )}

          {/*  AUTO-INVOICING TAB  */}
          {activeTab === 'invoicing' && (
            <motion.div key="invoicing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border mb-4">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> Facturation automatique</h3>
                <p className="text-sm text-gray-500 mb-4">Les factures sont générées automatiquement pour chaque séjour terminé. Vous pouvez aussi générer des factures manuellement.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-[#00A651]/5 rounded-xl text-center">
                    <p className="font-mono text-lg font-bold text-[#00A651]">{reservations.filter(r => r.status === 'completed').length}</p>
                    <p className="text-[10px] text-gray-500">Factures émises</p>
                  </div>
                  <div className="p-3 bg-[#003087]/5 rounded-xl text-center">
                    <p className="font-mono text-lg font-bold text-[#003087]">{fmt(reservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.totalPrice, 0))}</p>
                    <p className="text-[10px] text-gray-500">Total facturé (FCFA)</p>
                  </div>
                  <div className="p-3 bg-[#D4AF37]/5 rounded-xl text-center">
                    <p className="font-mono text-lg font-bold text-[#D4AF37]">Auto</p>
                    <p className="text-[10px] text-gray-500">Génération</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <p className="font-mono text-lg font-bold text-[#2C2E2F]">PDF</p>
                    <p className="text-[10px] text-gray-500">Format</p>
                  </div>
                </div>
              </div>
              {reservations.filter(r => r.status === 'completed').length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reservations.filter(r => r.status === 'completed').map((res) => (
                    <div key={res.id} className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">Facture #{res.bookingRef || res.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{formatDate(res.checkIn)} → {formatDate(res.checkOut)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-mono text-lg font-bold text-[#D4AF37]">{fmt(res.totalPrice)}</p>
                        <button className="px-3 py-1.5 bg-[#003087] text-white rounded-xl text-xs font-semibold hover:bg-[#0047b3] transition-colors">
                          <Inbox className="w-4 h-4" /> Télécharger PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border">
                  <p className="text-gray-500">Aucune facture à afficher</p>
                </div>
              )}
            </motion.div>
          )}

          {/*  CANCELLATION POLICY TAB  */}
          {activeTab === 'cancellation' && (
            <motion.div key="cancellation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border mb-4">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Ban className="w-5 h-5" /> Politique d&apos;annulation</h3>
                <p className="text-sm text-gray-500 mb-4">Configurez vos politiques d&apos;annulation avec calcul de remboursement automatique.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                  { name: 'Flexible', desc: 'Annulation gratuite 24h avant', refund: 100, color: '#00A651', icon: <CheckCircle className="w-4 h-4" /> },
                  { name: 'Modérée', desc: 'Annulation gratuite 5 jours avant', refund: 50, color: '#D4AF37', icon: <AlertTriangle className="w-4 h-4" /> },
                  { name: 'Stricte', desc: 'Aucun remboursement', refund: 0, color: '#D93025', icon: <XCircle className="w-4 h-4" /> },
                ].map((policy) => (
                  <div key={policy.name} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
                    <span className="text-3xl block mb-2">{policy.icon}</span>
                    <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">{policy.name}</h4>
                    <p className="text-xs text-gray-500 mb-3">{policy.desc}</p>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: `${policy.color}10` }}>
                      <p className="font-mono text-2xl font-bold" style={{ color: policy.color }}>{policy.refund}%</p>
                      <p className="text-[10px] text-gray-500">Remboursement</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Refund Calculator */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-3"><Calculator className="w-4 h-4" /> Calculateur de remboursement</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Prix total (FCFA)</label>
                    <input type="number" defaultValue={50000} className="w-full px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Jours avant check-in</label>
                    <input type="number" defaultValue={3} className="w-full px-3 py-2 border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Politique</label>
                    <select className="w-full px-3 py-2 border rounded-xl text-sm">
                      <option value="flexible">Flexible</option>
                      <option value="moderate">Modérée</option>
                      <option value="strict">Stricte</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-[#00A651]/5 rounded-xl">
                  <p className="text-sm text-[#2C2E2F]">Remboursement estimé : <span className="font-mono font-bold text-[#00A651]">25 000 FCFA (50%)</span></p>
                </div>
              </div>
            </motion.div>
          )}

          {/*  LAST-MINUTE PRICING TAB  */}
          {activeTab === 'lastminute' && (
            <motion.div key="lastminute" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#2C2E2F] flex items-center gap-2"><Zap className="w-5 h-5" /> Tarification last-minute</h3>
                    <p className="text-sm text-gray-500">Automatisez les réductions pour les réservations de dernière minute.</p>
                  </div>
                  <button className="px-4 py-2 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                    + Ajouter une règle
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Same-day discount', daysBefore: 0, discount: 25, active: true },
                  { name: '1-2 jours avant', daysBefore: 2, discount: 15, active: true },
                  { name: '3-5 jours avant', daysBefore: 5, discount: 10, active: false },
                ].map((rule, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display text-base font-bold text-[#2C2E2F]">{rule.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${rule.active ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'}`}>
                        {rule.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-50 rounded-xl">
                        <p className="text-[10px] text-gray-500">Jours avant</p>
                        <p className="font-mono text-sm font-bold text-[#2C2E2F]">≤ {rule.daysBefore}j</p>
                      </div>
                      <div className="p-2 bg-[#D4AF37]/5 rounded-xl">
                        <p className="text-[10px] text-gray-500">Réduction</p>
                        <p className="font-mono text-sm font-bold text-[#D4AF37]">-{rule.discount}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-white rounded-2xl p-5 shadow-sm border">
                <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-2 flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Fonctionnement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-gray-400" /> Les réductions s&apos;appliquent automatiquement aux réservations effectuées dans la période définie</li>
                  <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-gray-400" /> Les tarifs sont mis à jour en temps réel sur les canaux OTA connectés</li>
                  <li className="flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> Possibilité de cibler des types de chambre spécifiques</li>
                  <li className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-gray-400" /> Les règles se désactivent automatiquement quand l&apos;occupation dépasse le seuil défini</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/*  REPORTS TAB  */}
          {activeTab === 'reports' && (
            <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dashboardData ? [
                  { label: 'Taux d\'occupation', value: `${dashboardData.occupancy.occupancyRate}%`, icon: <BarChart3 className="w-6 h-6" />, desc: 'Chambres occupées / Total' },
                  { label: 'RevPAR', value: `${fmt(dashboardData.revenue.revPAR)} FCFA`, icon: <TrendingUp className="w-6 h-6" />, desc: 'Revenu par chambre disponible' },
                  { label: 'ADR', value: `${fmt(dashboardData.revenue.adr)} FCFA`, icon: <Coins className="w-6 h-6" />, desc: 'Tarif journalier moyen' },
                  { label: 'Revenu mensuel', value: `${fmt(dashboardData.revenue.thisMonth)} FCFA`, icon: <Banknote className="w-6 h-6" />, desc: 'Total des revenus ce mois' },
                ].map((metric) => (
                  <div key={metric.label} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
                    <span className="flex items-center justify-center mb-2 text-gray-400">{metric.icon}</span>
                    <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-1">{metric.label}</h4>
                    <p className="font-mono text-xl font-bold text-[#D4AF37] mb-1">{metric.value}</p>
                    <p className="text-[10px] text-gray-400">{metric.desc}</p>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-16">
                    <p className="text-gray-500">Chargez le tableau de bord d&apos;abord pour voir les rapports</p>
                  </div>
                )}
              </div>

              {/* Revenue by Channel */}
              {dashboardData && Object.keys(dashboardData.channels).length > 0 && (
                <div className="mt-6 bg-white rounded-2xl p-5 shadow-sm border">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Revenus par canal</h3>
                  <div className="space-y-3">
                    {Object.entries(dashboardData.channels).map(([channel, stats]) => {
                      const totalRevenue = dashboardData.revenue.thisMonth || 1;
                      const pct = Math.round((stats.revenue / totalRevenue) * 100);
                      return (
                        <div key={channel}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{channelLabel(channel)}</span>
                            <span className="text-xs text-gray-500">{pct}% · {fmt(stats.revenue)} FCFA</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#003087] rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
