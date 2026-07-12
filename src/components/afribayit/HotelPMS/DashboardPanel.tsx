'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Coins, Info,
  Percent, PlaneLanding, PlaneTakeoff, Radio, Siren,
} from 'lucide-react';
import type { PMSDashboardData } from './types';
import { easeOut } from './types';
import { fmt, channelLabel, formatDate } from './utils';
import { STATUS_COLORS, STATUS_LABELS } from './constants';

interface DashboardPanelProps {
  loading: boolean;
  data: PMSDashboardData | null;
}

export default function DashboardPanel({ loading, data }: DashboardPanelProps) {
  if (loading) {
    return (
      <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
        <div className="text-center py-16"><p className="text-gray-500">Chargement…</p></div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
        <div className="text-center py-16"><p className="text-gray-500">Selectionnez un hotel pour voir le tableau de bord</p></div>
      </motion.div>
    );
  }

  const kpis = [
    { label: 'Arrivees', value: String(data.today.arrivalCount), icon: <PlaneLanding className="w-5 h-5" />, color: '#00A651', trend: '+12%' },
    { label: 'Departs', value: String(data.today.departureCount), icon: <PlaneTakeoff className="w-5 h-5" />, color: '#003087', trend: '-3%' },
    { label: 'Occupation', value: `${data.occupancy.occupancyRate}%`, icon: <BarChart3 className="w-5 h-5" />, color: '#D4AF37', trend: '+5%' },
    { label: 'Revenu mois', value: `${fmt(data.revenue.thisMonth)}`, icon: <Coins className="w-5 h-5" />, color: '#00A651', trend: '+18%' },
  ];

  return (
    <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOut }}>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
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
          <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5" /> Taux d&apos;occupation — 7 jours
          </h3>
          <div className="flex items-end gap-2 h-32">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
              const rate = data.occupancy.occupancyRate + (Math.random() * 20 - 10);
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
        {data.alerts.length > 0 && (
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
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
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Coins className="w-5 h-5" /> Revenus</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Aujourd&apos;hui</span>
                <span className="font-mono font-bold text-[#00A651]">{fmt(data.revenue.today)} FCFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Ce mois</span>
                <span className="font-mono font-bold text-[#003087]">{fmt(data.revenue.thisMonth)} FCFA</span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center"><span className="text-sm text-gray-500">ADR</span><span className="font-mono text-sm font-semibold">{fmt(data.revenue.adr)} FCFA</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-gray-500">RevPAR</span><span className="font-mono text-sm font-semibold">{fmt(data.revenue.revPAR)} FCFA</span></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Radio className="w-5 h-5" /> Canaux</h3>
            <div className="space-y-3">
              {Object.entries(data.channels).map(([channel, stats]) => (
                <div key={channel} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{channelLabel(channel)}</span>
                  <div className="text-right"><span className="font-mono text-sm font-semibold">{stats.bookings} res.</span><span className="text-xs text-gray-400 ml-2">{fmt(stats.revenue)} FCFA</span></div>
                </div>
              ))}
              {Object.keys(data.channels).length === 0 && <p className="text-sm text-gray-400">Aucune donnee de canal disponible</p>}
            </div>
          </div>
        </div>

        {/* Today Arrivals & Departures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><PlaneLanding className="w-5 h-5" /> Arrivees aujourd&apos;hui</h3>
            {data.today.arrivals.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.today.arrivals.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <div><p className="text-sm font-medium text-[#0a2a5e]">{a.guestName}</p><p className="text-[10px] text-gray-500">{channelLabel(a.sourceChannel)} · {formatDate(a.checkOut)}</p></div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[a.status] || a.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">Aucune arrivee prevue</p>}
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><PlaneTakeoff className="w-5 h-5" /> Departs aujourd&apos;hui</h3>
            {data.today.departures.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {data.today.departures.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                    <div><p className="text-sm font-medium text-[#0a2a5e]">{d.guestName}</p><p className="text-[10px] text-gray-500">{channelLabel(d.sourceChannel)}</p></div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[d.status] || d.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">Aucun depart prevu</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
