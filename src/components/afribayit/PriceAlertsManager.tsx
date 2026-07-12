'use client';

/**
 * PriceAlertsManager — CDC §5.1.1 "Alertes prix : notification email/SMS sur baisse/hausse ciblée"
 *
 * Lets the investor:
 *   - Create price alerts with structured criteria (country, city, type,
 *     max price, min score, min ROI)
 *   - View existing alerts with match count + unread notifications
 *   - Toggle alerts active/inactive
 *   - Delete alerts
 *   - View recent alert matches (notifications) with click-through to property
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  useAlerts, useAlertNotifications,
  useCreateAlert, useDeleteAlert, useToggleAlert,
  useMarkAlertRead, useMarkAllAlertsRead,
} from '@/hooks/useAlerts';
import {
  Bell, Plus, Trash2, MapPin, Home, Coins, Brain, X,
  CheckCheck, BellOff, ChevronRight,
} from 'lucide-react';

const COUNTRIES = [
  { code: '', label: 'Tous les pays' },
  { code: 'BJ', label: '🇧🇯 Bénin' },
  { code: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { code: 'BF', label: '🇧🇫 Burkina Faso' },
  { code: 'TG', label: '🇹🇬 Togo' },
];

const PROPERTY_TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'villa', label: 'Villa' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
];

export default function PriceAlertsManager() {
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const { data: notifData } = useAlertNotifications(true);
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const toggleAlert = useToggleAlert();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();

  const [showForm, setShowForm] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const alerts = alertsData?.alerts || [];
  const notifications = notifData?.notifications || [];
  const totalUnread = notifications.length;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-[#003087] to-[#0047b3]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-[#D4AF37]" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-[#003087] text-[9px] font-bold flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">Mes alertes prix</h3>
            <p className="text-[10px] text-white/70">Soyez notifié dès qu&apos;un bien correspond à vos critères</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <button
              onClick={() => setShowNotifs(true)}
              className="px-3 py-1.5 bg-[#D4AF37] text-[#003087] rounded-full text-[10px] font-bold hover:bg-[#b8961f] transition-colors"
            >
              {totalUnread} nouveau{totalUnread > 1 ? 'x' : ''}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 text-white rounded-full text-[10px] font-semibold hover:bg-white/20 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Créer
          </button>
        </div>
      </div>

      {/* Alerts list */}
      <div className="p-4">
        {alertsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-lg bg-[#003087]/5 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-[#003087]" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Aucune alerte configurée</p>
            <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
              Créez votre première alerte pour être notifié dès qu&apos;un bien d&apos;investissement
              correspond à vos critères (prix, score, localisation).
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003087] text-white rounded-lg text-xs font-semibold hover:bg-[#0047b3] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Créer ma première alerte
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onToggle={(active) => toggleAlert.mutate({ alertId: alert.id, active })}
                onDelete={() => deleteAlert.mutate(alert.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create alert modal */}
      <AnimatePresence>
        {showForm && (
          <CreateAlertModal
            onClose={() => setShowForm(false)}
            onCreate={async (data) => {
              await createAlert.mutateAsync(data);
              setShowForm(false);
            }}
            isPending={createAlert.isPending}
          />
        )}
      </AnimatePresence>

      {/* Notifications modal */}
      <AnimatePresence>
        {showNotifs && (
          <NotificationsModal
            notifications={notifications}
            onClose={() => setShowNotifs(false)}
            onRead={(id) => markRead.mutate(id)}
            onReadAll={() => markAllRead.mutate()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AlertRow({ alert, onToggle, onDelete }: {
  alert: any;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const isActive = alert.isActive ?? alert.active;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isActive ? 'bg-white border-gray-100' : 'bg-gray-50/50 border-gray-50 opacity-60'}`}>
      <button
        onClick={() => onToggle(!isActive)}
        className={`shrink-0 w-9 h-5 rounded-lg transition-colors relative ${isActive ? 'bg-[#00A651]' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-lg bg-white transition-all ${isActive ? 'left-4' : 'left-0.5'}`} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-[#0a2a5e] truncate">{alert.name}</p>
          {alert.unreadCount && alert.unreadCount > 0 ? (
            <span className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-bold rounded-full">
              {alert.unreadCount} nouveau{alert.unreadCount > 1 ? 'x' : ''}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
          {alert.country && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{alert.country}</span>}
          {alert.city && <span>{alert.city}</span>}
          {alert.propertyType && <span className="flex items-center gap-0.5"><Home className="w-2.5 h-2.5" />{alert.propertyType}</span>}
          {alert.maxPrice && <span className="flex items-center gap-0.5"><Coins className="w-2.5 h-2.5" />≤ {fmt(alert.maxPrice)}</span>}
          {alert.minInvestmentScore && <span className="flex items-center gap-0.5"><Brain className="w-2.5 h-2.5" />≥ {alert.minInvestmentScore}</span>}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-[10px] text-gray-400">{alert.matchCount} match{alert.matchCount > 1 ? 's' : ''}</p>
      </div>

      <button
        onClick={onDelete}
        className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CreateAlertModal({ onClose, onCreate, isPending }: {
  onClose: () => void;
  onCreate: (data: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minSurface, setMinSurface] = useState('');
  const [minScore, setMinScore] = useState('');
  const [minRoi, setMinRoi] = useState('');

  const handleSubmit = () => {
    onCreate({
      name: name || `Alerte ${country || 'Tous pays'} ${propertyType || 'tous types'}`.trim(),
      country: country || undefined,
      city: city || undefined,
      propertyType: propertyType || undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minSurface: minSurface ? Number(minSurface) : undefined,
      minInvestmentScore: minScore ? Number(minScore) : undefined,
      minRoiPct: minRoi ? Number(minRoi) : undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#003087]">Créer une alerte</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nom de l&apos;alerte</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Villas Cotonou < 30M"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Pays</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#003087]">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Cotonou"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Type de bien</label>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#003087]">
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Prix max (FCFA)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="30000000"
                step={1_000_000}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#003087]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Surface min (m²)</label>
              <input
                type="number"
                value={minSurface}
                onChange={(e) => setMinSurface(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Score min (0-100)</label>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                placeholder="70"
                min={0}
                max={100}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ROI min (%)</label>
              <input
                type="number"
                value={minRoi}
                onChange={(e) => setMinRoi(e.target.value)}
                placeholder="7"
                step={0.5}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#003087]"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Création...' : 'Créer l\'alerte'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NotificationsModal({ notifications, onClose, onRead, onReadAll }: {
  notifications: any[];
  onClose: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alertes ({notifications.length})
          </h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onReadAll}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-[#003087] hover:bg-[#003087]/5 rounded-full"
              >
                <CheckCheck className="w-3 h-3" />
                Tout lire
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune notification non lue</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={`/property/${n.propertyId}`}
                onClick={() => onRead(n.id)}
                className="block p-3 bg-gray-50/50 rounded-2xl hover:bg-gray-100/80 transition-colors"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0a2a5e] truncate">{n.propertyTitle}</p>
                    <p className="text-[10px] text-gray-400">{n.propertyCity}, {n.propertyCountry}</p>
                  </div>
                  <p className="font-mono-data font-bold text-xs text-[#D4AF37] shrink-0">{fmt(n.propertyPrice)}</p>
                </div>
                <p className="text-[10px] text-[#003087] bg-[#003087]/5 rounded-lg px-2 py-1">
                  {n.matchReason}
                </p>
                <p className="text-[9px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString('fr-FR')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
