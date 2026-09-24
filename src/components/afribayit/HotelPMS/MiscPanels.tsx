'use client';

import { motion } from 'framer-motion';
import {
  Ban, CheckCircle, ClipboardList, DollarSign, Download, Eye, MessageCircle,
  PlaneLanding, PlaneTakeoff, QrCode, Star, Target, Users, Zap,
} from 'lucide-react';
import type { PMSDashboardData, ReservationItem, RoomItem } from './types';
import { easeOut } from './types';
import { fmt, formatDate, channelLabel } from './utils';

interface CheckinPanelProps {
  reservations: ReservationItem[];
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
}

export function CheckinPanel({ reservations, onCheckIn, onCheckOut }: CheckinPanelProps) {
  return (
    <motion.div key="checkin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
          <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2"><PlaneLanding className="w-5 h-5" /> Enregistrements</h3>
          {reservations.filter(r => r.status === 'confirmed').length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reservations.filter(r => r.status === 'confirmed').map((res) => (
                <div key={res.id} className="p-3 bg-primary-pale/40 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary-deep">Res. {res.bookingRef || res.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-text">{formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-14 bg-white border-2 border-primary-deep rounded-2xl flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-primary-deep" />
                    </div>
                    <button onClick={() => onCheckIn(res.id)} className="px-3 py-2 rounded-full bg-[#00A651] text-white text-xs font-semibold shadow-md hover:bg-[#008f47] transition-all">Enregistrer</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-text/60">Aucun enregistrement prevu</p>}
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
          <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2"><PlaneTakeoff className="w-5 h-5" /> Departs</h3>
          {reservations.filter(r => r.status === 'checked_in').length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reservations.filter(r => r.status === 'checked_in').map((res) => (
                <div key={res.id} className="p-3 bg-primary-pale/40 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary-deep">Res. {res.bookingRef || res.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-text">Depart : {formatDate(res.checkOut)}</p>
                    <p className="font-mono text-sm font-bold text-accent-dark">{fmt(res.totalPrice)} FCFA</p>
                  </div>
                  <button onClick={() => onCheckOut(res.id)} className="px-3 py-2 rounded-full bg-primary-green text-white text-xs font-semibold shadow-md hover:bg-primary-deep transition-all">Depart</button>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-text/60">Aucun depart prevu</p>}
        </div>
      </div>
    </motion.div>
  );
}

interface InvoicingPanelProps {
  dashboardData: PMSDashboardData | null;
  reservations: ReservationItem[];
}

export function InvoicingPanel({ dashboardData, reservations }: InvoicingPanelProps) {
  return (
    <motion.div key="invoicing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Facturation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[#00A651]/5 rounded-2xl text-center border border-[#00A651]/10">
            <DollarSign className="w-6 h-6 text-[#00A651] mx-auto mb-1" />
            <p className="text-[10px] text-gray-text/60">Facture ce mois</p>
            <p className="font-mono text-lg font-bold text-[#00A651]">{fmt(dashboardData?.revenue.thisMonth || 0)} FCFA</p>
          </div>
          <div className="p-4 bg-primary-pale/50 rounded-2xl text-center">
            <Star className="w-6 h-6 text-primary-deep mx-auto mb-1" />
            <p className="text-[10px] text-gray-text/60">En attente</p>
            <p className="font-mono text-lg font-bold text-primary-deep">{reservations.filter(r => r.status === 'checked_out').length}</p>
          </div>
          <div className="p-4 bg-accent-yellow/10 rounded-2xl text-center">
            <CheckCircle className="w-6 h-6 text-accent-dark mx-auto mb-1" />
            <p className="text-[10px] text-gray-text/60">Payees</p>
            <p className="font-mono text-lg font-bold text-accent-dark">{reservations.filter(r => r.status === 'completed').length}</p>
          </div>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {reservations.filter(r => ['checked_out', 'completed'].includes(r.status)).length > 0 ? (
            reservations.filter(r => ['checked_out', 'completed'].includes(r.status)).map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 bg-primary-pale/40 rounded-xl">
                <div><p className="text-sm font-semibold text-primary-deep">Facture {res.bookingRef || res.id.slice(0, 8)}</p><p className="text-xs text-gray-text">{formatDate(res.checkIn)} - {formatDate(res.checkOut)}</p></div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-sm font-bold text-accent-dark">{fmt(res.totalPrice)} FCFA</p>
                  <button className="p-2 rounded-full border border-primary-pale hover:bg-primary-pale transition-colors"><Download className="w-4 h-4 text-primary-deep" /></button>
                </div>
              </div>
            ))
          ) : <p className="text-sm text-gray-text/60 text-center py-4">Aucune facture disponible</p>}
        </div>
      </div>
    </motion.div>
  );
}

export function CancellationPanel({ reservations }: { reservations: ReservationItem[] }) {
  return (
    <motion.div key="cancellation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2"><Ban className="w-5 h-5" /> Annulations</h3>
        {reservations.filter(r => r.status === 'cancelled').length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reservations.filter(r => r.status === 'cancelled').map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                <div><p className="text-sm font-semibold text-primary-deep">{res.bookingRef || res.id.slice(0, 8)}</p><p className="text-xs text-gray-text">{formatDate(res.checkIn)} &rarr; {formatDate(res.checkOut)}</p></div>
                <div className="text-right"><p className="font-mono text-sm font-bold text-[#D93025]">-{fmt(res.totalPrice)} FCFA</p><span className="text-[10px] text-gray-text/60">{channelLabel(res.sourceChannel)}</span></div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-text/60 text-center py-4">Aucune annulation enregistree</p>}
      </div>
    </motion.div>
  );
}

export function LastMinutePanel({ rooms }: { rooms: RoomItem[] }) {
  return (
    <motion.div key="lastminute" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="bg-gradient-to-br from-accent-yellow/10 to-primary-deep/10 rounded-3xl p-6 shadow-lg border border-accent-yellow/20">
        <h3 className="font-serif text-base font-bold text-primary-deep mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-accent-dark" /> Offres Last-Minute</h3>
        <p className="text-sm text-gray-text mb-4">Chambres disponibles aujourd&apos;hui avec reduction automatique</p>
        {rooms.filter(r => r.status === 'available' || r.status === 'AVAILABLE').length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.filter(r => r.status === 'available' || r.status === 'AVAILABLE').map((room) => {
              const discountPrice = Math.round(Number(room.basePrice) * 0.7);
              return (
                <div key={room.id} className="bg-white rounded-3xl p-4 border border-primary-pale shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-primary-deep">{room.name || room.type}</h4>
                    <span className="px-2 py-0.5 bg-[#D93025] text-white text-[10px] font-bold rounded-full">-30%</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-lg font-bold text-accent-dark">{fmt(discountPrice)}</span>
                    <span className="text-xs text-gray-text/60 line-through">{fmt(room.basePrice)}</span>
                    <span className="text-xs text-gray-text/60">FCFA/nuit</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-text/60 text-center">Aucune chambre disponible pour last-minute</p>}
      </div>
    </motion.div>
  );
}

export function GuestsPanel() {
  return (
    <motion.div key="guests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale max-w-2xl mx-auto text-center">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-2">Annuaire Clients</h3>
        <p className="text-sm text-gray-text mb-4">Historique des communications, preferences et sejours passes de vos clients.</p>
        <div className="p-4 bg-primary-pale/40 rounded-2xl text-left">
          <p className="text-xs text-gray-text/60 mb-2">Fonctionnalites :</p>
          <ul className="text-sm text-gray-text space-y-1">
            <li className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-gray-400" /> Repertoire des clients avec historique</li>
            <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-gray-400" /> Historique des communications</li>
            <li className="flex items-center gap-2"><Target className="w-4 h-4 text-gray-400" /> Preferences et notes client</li>
            <li className="flex items-center gap-2"><Star className="w-4 h-4 text-gray-400" /> Programme de fidelite</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

interface ReportsPanelProps {
  dashboardData: PMSDashboardData | null;
  reservations: ReservationItem[];
}

export function ReportsPanel({ dashboardData, reservations }: ReportsPanelProps) {
  const stats = [
    { label: 'RevPAR', value: dashboardData ? fmt(dashboardData.revenue.revPAR) : '—', unit: 'FCFA', icon: <DollarSign className="w-5 h-5" />, color: '#003087' },
    { label: 'ADR', value: dashboardData ? fmt(dashboardData.revenue.adr) : '—', unit: 'FCFA', icon: <Star className="w-5 h-5" />, color: '#D4AF37' },
    { label: 'Taux occupation', value: dashboardData ? `${dashboardData.occupancy.occupancyRate}%` : '—', unit: '', icon: <CheckCircle className="w-5 h-5" />, color: '#00A651' },
    { label: 'Total reservations', value: String(reservations.length), unit: '', icon: <ClipboardList className="w-5 h-5" />, color: '#009CDE' },
  ];
  return (
    <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
              <div className="flex items-center gap-2 mb-1"><span style={{ color: stat.color }}>{stat.icon}</span><span className="text-xs text-gray-text">{stat.label}</span></div>
              <p className="font-mono text-xl font-bold" style={{ color: stat.color }}>{stat.value} <span className="text-xs font-normal text-gray-text/60">{stat.unit}</span></p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
          <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2"><Eye className="w-5 h-5" /> Performance par canal</h3>
          <div className="space-y-3">
            {Object.entries(dashboardData?.channels || {}).map(([channel, chStats]) => (
              <div key={channel}>
                <div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-text">{channelLabel(channel)}</span><span className="font-mono text-xs font-bold">{chStats.bookings} res. · {fmt(chStats.revenue)} FCFA</span></div>
                <div className="w-full h-2 bg-primary-pale rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((chStats.revenue / (dashboardData?.revenue.thisMonth || 1)) * 100, 100)}%` }} transition={{ duration: 0.8, ease: easeOut }} className="h-full bg-primary-deep rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
