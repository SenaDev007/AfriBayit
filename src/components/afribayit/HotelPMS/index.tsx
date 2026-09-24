'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch, apiPost, apiPatch } from '@/lib/api-client';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';
import { Hotel, RefreshCw, CheckCircle } from 'lucide-react';
import type {
  PMSDashboardData, ReservationItem, RoomItem, RateItem, PMSTab, CalendarDay,
} from './types';
import { easeOut } from './types';
import { TABS } from './constants';
import { fmt, channelLabel, DashboardSkeleton } from './utils';
import DashboardPanel from './DashboardPanel';
import CalendarPanel from './CalendarPanel';
import ReservationsPanel from './ReservationsPanel';
import RoomsPanel from './RoomsPanel';
import RatesPanel from './RatesPanel';
import { CheckinPanel, InvoicingPanel, CancellationPanel, LastMinutePanel, GuestsPanel, ReportsPanel } from './MiscPanels';

void fmt; void channelLabel;

// OTA Sync Status Bar — declared OUTSIDE the component to avoid
// "Cannot create components during render" lint error.
function OTASyncBar({ otaSyncStatus }: { otaSyncStatus: Record<string, { status: string; lastSync: string | null }> }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {['booking_com', 'expedia', 'airbnb'].map((ota) => {
        const info = otaSyncStatus[ota];
        return (
          <span key={ota} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            info?.status === 'synced' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30'
          }`}>
            <RefreshCw className={`w-3 h-3 ${info?.status === 'synced' ? '' : 'animate-spin'}`} />
            {channelLabel(ota)}
            <CheckCircle className="w-3 h-3" />
          </span>
        );
      })}
    </div>
  );
}

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
  const calendarDays: CalendarDay[] = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: CalendarDay[] = [];
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
        airbnb: { status: 'synced', lastSync: new Date().toISOString() },
      }));
      toast.success('Synchronisation OTA lancée');
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
      toast.success('Statut chambre mis à jour');
    } catch {
      toast.error('Erreur mise à jour statut');
    }
  };

  // Add/Edit room
  const handleRoomSubmit = async (data: Record<string, unknown>) => {
    if (!hotelId) return;
    try {
      if (editingRoom) {
        await apiPatch('/api/hotels/pms/rooms', { roomId: editingRoom.id, hotelId, ...data });
        toast.success('Chambre modifiée');
      } else {
        await apiPost('/api/hotels/pms/rooms', { hotelId, ...data });
        toast.success('Chambre ajoutée');
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
      toast.success('Chambre supprimée');
    } catch {
      toast.error('Erreur suppression');
    }
  };

  // Check-in handler
  const handleCheckIn = async (bookingId: string) => {
    try {
      await apiPatch('/api/hotels/pms/reservations', { bookingId, hotelId, status: 'checked_in' });
      toast.success('Enregistrement effectué');
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

  // OTA Sync Status Bar is now declared outside the component (above).

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-cream">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-bold uppercase tracking-wider mb-3">
            <Hotel className="w-3.5 h-3.5" /> PMS Hotelier — AfriBayit
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-deep mb-3">
            Gestion <span className="text-accent-dark">Hoteliere</span>
          </h1>
          <p className="text-gray-text max-w-lg mx-auto">
            Tableau de bord PMS complet : reservations, tarifs, disponibilites et canaux OTA
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
        </motion.div>

        {/* Hotel Selector + OTA Sync */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="px-4 py-3 rounded-xl border border-primary-pale text-sm bg-white max-w-xs focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all">
            <option value="">Selectionner un hotel</option>
            {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <OTASyncBar otaSyncStatus={otaSyncStatus} />
            <button onClick={handleSyncOTA} className="px-4 py-2.5 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Sync OTA
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.key ? 'bg-primary-deep text-white shadow-md' : 'bg-white text-gray-text border border-primary-pale hover:bg-primary-pale'
            }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            loading && !dashboardData ? (
              <motion.div key="dashboard-skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DashboardSkeleton />
              </motion.div>
            ) : (
              <DashboardPanel loading={loading} data={dashboardData} />
            )
          )}
          {activeTab === 'calendar' && (
            <CalendarPanel
              calMonth={calMonth}
              calYear={calYear}
              setCalMonth={setCalMonth}
              setCalYear={setCalYear}
              calendarDays={calendarDays}
            />
          )}
          {activeTab === 'reservations' && (
            <ReservationsPanel
              resFilter={resFilter}
              setResFilter={setResFilter}
              reservations={reservations}
            />
          )}
          {activeTab === 'rooms' && (
            <RoomsPanel
              rooms={rooms}
              showRoomModal={showRoomModal}
              editingRoom={editingRoom}
              onOpenAdd={() => { setEditingRoom(null); setShowRoomModal(true); }}
              onOpenEdit={(room) => { setEditingRoom(room); setShowRoomModal(true); }}
              onCloseModal={() => { setShowRoomModal(false); setEditingRoom(null); }}
              onSubmitRoom={handleRoomSubmit}
              onDeleteRoom={handleDeleteRoom}
              onStatusChange={handleRoomStatusChange}
            />
          )}
          {activeTab === 'rates' && <RatesPanel rates={rates} />}
          {activeTab === 'checkin' && (
            <CheckinPanel reservations={reservations} onCheckIn={handleCheckIn} onCheckOut={handleCheckOut} />
          )}
          {activeTab === 'invoicing' && (
            <InvoicingPanel dashboardData={dashboardData} reservations={reservations} />
          )}
          {activeTab === 'cancellation' && <CancellationPanel reservations={reservations} />}
          {activeTab === 'lastminute' && <LastMinutePanel rooms={rooms} />}
          {activeTab === 'guests' && <GuestsPanel />}
          {activeTab === 'reports' && (
            <ReportsPanel dashboardData={dashboardData} reservations={reservations} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

void easeOut;
