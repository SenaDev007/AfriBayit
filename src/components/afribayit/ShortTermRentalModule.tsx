'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '@/lib/api-client';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, MapPin, Star, Users, BedDouble, Bath, Calendar, Filter,
  Grid3X3, Map, ChevronLeft, ChevronRight, Zap, Clock, ShieldCheck,
  BadgeCheck, Heart, Share2, X, CreditCard, Wifi, Car, Waves,
  UtensilsCrossed, AirVent, Tv, Lock, RefreshCw, Home, Building2,
  Palmtree, DoorOpen, Globe, Smartphone, QrCode, CheckCircle,
  ArrowRight, Shield, Calculator, Receipt,
} from 'lucide-react';

const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';
const GREEN = '#00A651';
const RED = '#D93025';
const easeOut = [0.16, 1, 0.3, 1] as const;

const PROPERTY_TYPES = [
  { value: '', label: 'Tous types' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'maison', label: 'Maison' },
  { value: 'loft', label: 'Loft' },
  { value: 'bungalow', label: 'Bungalow' },
];

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-4 h-4" />, ac: <AirVent className="w-4 h-4" />,
  parking: <Car className="w-4 h-4" />, pool: <Waves className="w-4 h-4" />,
  kitchen: <UtensilsCrossed className="w-4 h-4" />, tv: <Tv className="w-4 h-4" />,
  securite: <Lock className="w-4 h-4" />,
};

const CANCELLATION_LABELS: Record<string, string> = { flexible: 'Flexible', moderate: 'Moderee', strict: 'Stricte' };
const OTA_LABELS: Record<string, string> = { airbnb: 'Airbnb', booking_com: 'Booking.com' };

const MOBILE_MONEY_PROVIDERS = [
  { key: 'mtn', name: 'MTN Mobile Money', color: '#FFC300' },
  { key: 'orange', name: 'Orange Money', color: '#FF6600' },
  { key: 'moov', name: 'Moov Money', color: '#0066CC' },
];

interface RentalApiItem {
  id: string; hostId: string; title: string; slug?: string; description?: string;
  propertyType: string; city: string; country: string; quartier?: string;
  address?: string; lat?: number; lng?: number; images?: string | null;
  pricePerNight: number; weeklyPrice?: number | null; monthlyPrice?: number | null;
  currency: string; maxGuests: number; bedrooms: number; bathrooms: number; beds: number;
  amenities?: string | null; houseRules?: string | null; instantBooking: boolean;
  rating: number; reviewCount: number; views: number; otaRefs?: string | null;
  otaSyncStatus?: string | null; hostVerified: boolean; hostIdentityVerified: boolean;
  status: string; minStayNights: number; maxStayNights?: number | null;
  cancellationPolicy: string; cleaningFee: number; securityDeposit: number;
  createdAt?: string;
  _count?: { bookings?: number; reviews_str?: number };
  host?: { name: string; avatar?: string; verified?: boolean; kycLevel?: number };
  pricingRules?: ShortTermPricingRuleApi[];
}

interface ShortTermPricingRuleApi {
  id: string; name: string; period: string; multiplier: number;
  startDate?: string | null; endDate?: string | null;
}

interface AvailabilityDay {
  id: string; date: string; status: string; priceOverride?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

function parseJsonObj(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function getFirstImage(images: string | null | undefined): string {
  const arr = parseJsonArray(images); return arr[0] || '';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(price));
}

function getNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn); const d2 = new Date(checkOut);
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function getPropertyTypeIcon(type: string) {
  switch (type) {
    case 'appartement': return <Building2 className="w-4 h-4" />;
    case 'villa': return <Home className="w-4 h-4" />;
    case 'studio': return <DoorOpen className="w-4 h-4" />;
    case 'chambre': return <BedDouble className="w-4 h-4" />;
    case 'maison': return <Home className="w-4 h-4" />;
    case 'bungalow': return <Palmtree className="w-4 h-4" />;
    default: return <Building2 className="w-4 h-4" />;
  }
}

// ─── Skeletons ───────────────────────────────────────────────────

function RentalCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2"><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /><Skeleton className="h-5 w-12 rounded-full" /></div>
        <div className="flex items-center justify-between pt-3 border-t"><Skeleton className="h-6 w-28" /><Skeleton className="h-4 w-12" /></div>
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

// ─── Star Rating ─────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= Math.round(rating) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

// ─── OTA Sync Badge ──────────────────────────────────────────────

function OtaSyncBadge({ syncStatus }: { syncStatus: string | null | undefined }) {
  const parsed = parseJsonObj(syncStatus);
  const entries = Object.entries(parsed);
  if (entries.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {entries.map(([platform, status]) => (
        <span key={platform} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          status === 'synced' ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
        }`}><RefreshCw className="w-3 h-3" />{OTA_LABELS[platform] || platform}</span>
      ))}
    </div>
  );
}

// ─── Availability Calendar ───────────────────────────────────────

function AvailabilityCalendar({
  availability, checkIn, checkOut, onDateClick, currentMonth, onPrevMonth, onNextMonth,
}: {
  availability: AvailabilityDay[]; checkIn: string; checkOut: string;
  onDateClick: (date: string) => void; currentMonth: Date; onPrevMonth: () => void; onNextMonth: () => void;
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const availMap = useMemo(() => {
    const m: Record<string, AvailabilityDay> = {};
    availability.forEach((d) => { const key = d.date.slice(0, 10); m[key] = d; });
    return m;
  }, [availability]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayLabels = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
        <h4 className="text-sm font-semibold text-[#2C2E2F]">{firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h4>
        <button onClick={onNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">{dayLabels.map((d) => <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dateObj = new Date(year, month, day);
          const isPast = dateObj < today;
          const isCheckIn = checkIn === dateStr;
          const isCheckOut = checkOut === dateStr;
          const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
          const status = availMap[dateStr]?.status || 'AVAILABLE';

          let bgClass = 'bg-[#00A651]/10 text-[#00A651] hover:bg-[#00A651]/20 cursor-pointer';
          if (isPast) bgClass = 'bg-gray-50 text-gray-300 cursor-not-allowed';
          else if (status === 'BOOKED') bgClass = 'bg-[#D93025]/10 text-[#D93025] cursor-not-allowed';
          else if (status === 'BLOCKED' || status === 'MAINTENANCE') bgClass = 'bg-gray-200 text-gray-400 cursor-not-allowed';
          if (isCheckIn || isCheckOut) bgClass = 'bg-[#D4AF37] text-white';
          else if (isInRange) bgClass = 'bg-[#D4AF37]/20 text-[#D4AF37]';

          return (
            <button key={day} disabled={isPast || status === 'BOOKED' || status === 'BLOCKED' || status === 'MAINTENANCE'}
              onClick={() => !isPast && onDateClick(dateStr)}
              className={`aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-colors ${bgClass}`}>{day}</button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/10 rounded" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D93025]/10 rounded" /> Réservé</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#D4AF37] rounded" /> Selection</span>
      </div>
    </div>
  );
}

// ─── Booking Flow Modal ──────────────────────────────────────────

function BookingFlowModal({
  open, onClose, rental, availability, bookingForm, setBookingForm, onSubmit, loading,
}: {
  open: boolean; onClose: () => void; rental: RentalApiItem | null;
  availability: AvailabilityDay[]; bookingForm: { checkIn: string; checkOut: string; guests: number; specialRequests: string };
  setBookingForm: React.Dispatch<React.SetStateAction<{ checkIn: string; checkOut: string; guests: number; specialRequests: string }>>;
  onSubmit: () => void; loading: boolean;
}) {
  const [step, setStep] = useState<'dates' | 'details' | 'payment' | 'confirmation' | 'checkin'>('dates');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [calMonth, setCalMonth] = useState(() => new Date());

  const handleCalDateClick = useCallback((dateStr: string) => {
    if (!bookingForm.checkIn || (bookingForm.checkIn && bookingForm.checkOut)) {
      setBookingForm((prev) => ({ ...prev, checkIn: dateStr, checkOut: '' }));
    } else {
      if (dateStr <= bookingForm.checkIn) setBookingForm((prev) => ({ ...prev, checkIn: dateStr, checkOut: '' }));
      else setBookingForm((prev) => ({ ...prev, checkOut: dateStr }));
    }
  }, [bookingForm, setBookingForm]);

  useEffect(() => { if (open) setStep('dates'); }, [open]);

  if (!open || !rental) return null;

  const nights = bookingForm.checkIn && bookingForm.checkOut ? getNights(bookingForm.checkIn, bookingForm.checkOut) : 0;
  const subtotal = nights * rental.pricePerNight;
  const cleaningFee = rental.cleaningFee || 0;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaningFee + serviceFee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Réserver : {rental.title}</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: 'dates', label: 'Dates', icon: <Calendar className="w-4 h-4" /> },
              { key: 'details', label: 'Details', icon: <Users className="w-4 h-4" /> },
              { key: 'payment', label: 'Paiement', icon: <CreditCard className="w-4 h-4" /> },
              { key: 'confirmation', label: 'Confirmation', icon: <CheckCircle className="w-4 h-4" /> },
            ].map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.key ? 'bg-[#003087] text-white' : ['dates', 'details', 'payment', 'confirmation'].indexOf(step) > i ? 'bg-[#00A651] text-white' : 'bg-gray-100 text-gray-400'
                }`}>{s.icon}</div>
                <span className="text-[10px] font-medium text-gray-500 hidden sm:block">{s.label}</span>
                {i < 3 && <div className="flex-1 h-0.5 bg-gray-100"><div className={`h-full ${['dates', 'details', 'payment', 'confirmation'].indexOf(step) > i ? 'bg-[#00A651]' : ''}`} /></div>}
              </div>
            ))}
          </div>

          {/* Step: Dates */}
          {step === 'dates' && (
            <div>
              <AvailabilityCalendar availability={availability} checkIn={bookingForm.checkIn} checkOut={bookingForm.checkOut}
                onDateClick={handleCalDateClick} currentMonth={calMonth} onPrevMonth={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}
                onNextMonth={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))} />
              <div className="mt-4 p-3 bg-gray-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Arrivée</span>
                  <span className="text-sm font-semibold text-[#2C2E2F]">{bookingForm.checkIn || '—'}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">Départ</span>
                  <span className="text-sm font-semibold text-[#2C2E2F]">{bookingForm.checkOut || '—'}</span>
                </div>
                {nights > 0 && <p className="text-xs text-[#003087] font-semibold mt-2">{nights} nuit{nights > 1 ? 's' : ''}</p>}
              </div>
              <button onClick={() => bookingForm.checkIn && bookingForm.checkOut && setStep('details')}
                disabled={!bookingForm.checkIn || !bookingForm.checkOut}
                className="w-full mt-4 py-3 bg-[#003087] text-white rounded-2xl font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step: Details */}
          {step === 'details' && (
            <div>
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1.5 block">Nombre de voyageurs</label>
                <div className="flex items-center gap-4 px-4 py-3 rounded-2xl border">
                  <button onClick={() => setBookingForm((f) => ({ ...f, guests: Math.max(1, f.guests - 1) }))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button>
                  <span className="font-mono text-lg font-bold text-[#2C2E2F]">{bookingForm.guests}</span>
                  <button onClick={() => setBookingForm((f) => ({ ...f, guests: Math.min(rental.maxGuests, f.guests + 1) }))} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button>
                  <span className="text-xs text-gray-400 ml-2">Max {rental.maxGuests}</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1.5 block">Demandes spéciales (optionnel)</label>
                <textarea value={bookingForm.specialRequests} onChange={(e) => setBookingForm((f) => ({ ...f, specialRequests: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] resize-none h-20" placeholder="Heure d'arrivee, preferences..." />
              </div>

              {/* Pricing Summary */}
              <div className="p-4 bg-gray-50 rounded-2xl mb-4">
                <h4 className="text-sm font-bold text-[#2C2E2F] mb-3 flex items-center gap-2"><Calculator className="w-4 h-4" /> Récapitulatif</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">{formatPrice(rental.pricePerNight)} x {nights} nuit{nights > 1 ? 's' : ''}</span><span className="font-mono font-semibold">{formatPrice(subtotal)} FCFA</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Frais de ménage</span><span className="font-mono font-semibold">{formatPrice(cleaningFee)} FCFA</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Frais de service (12%)</span><span className="font-mono font-semibold">{formatPrice(serviceFee)} FCFA</span></div>
                  <div className="border-t pt-2 flex justify-between"><span className="text-sm font-bold text-[#2C2E2F]">Total</span><span className="font-mono text-lg font-bold text-[#D4AF37]">{formatPrice(total)} FCFA</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('dates')} className="px-4 py-3 rounded-2xl border text-sm font-medium hover:bg-gray-50">Retour</button>
                <button onClick={() => setStep('payment')} className="flex-1 py-3 bg-[#003087] text-white rounded-2xl font-semibold text-sm hover:bg-[#0047b3] transition-colors flex items-center justify-center gap-2">
                  Paiement <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step: Payment */}
          {step === 'payment' && (
            <div>
              <div className="p-4 bg-[#003087]/5 rounded-2xl mb-4">
                <div className="flex items-center justify-between"><span className="text-sm font-bold text-[#2C2E2F]">Total a payer</span><span className="font-mono text-xl font-bold text-[#D4AF37]">{formatPrice(total)} FCFA</span></div>
              </div>

              <label className="text-xs text-gray-500 mb-2 block">Mobile Money</label>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {MOBILE_MONEY_PROVIDERS.map((p) => (
                  <button key={p.key} onClick={() => setPaymentMethod(p.key)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${paymentMethod === p.key ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    <Smartphone className="w-5 h-5 mx-auto mb-1" style={{ color: p.color }} />
                    <p className="text-[10px] font-semibold text-[#2C2E2F]">{p.name}</p>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1.5 block">Numero de telephone</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+229 90 00 00 00"
                  className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087]" />
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#00A651]/5 rounded-2xl mb-4">
                <Shield className="w-5 h-5 text-[#00A651]" />
                <div><p className="text-xs font-semibold text-[#00A651]">Paiement sécurisé</p><p className="text-[10px] text-gray-500">Vos fonds sont en escrow jusqu&apos;à votre check-in</p></div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('details')} className="px-4 py-3 rounded-2xl border text-sm font-medium hover:bg-gray-50">Retour</button>
                <button onClick={onSubmit} disabled={!paymentMethod || !phoneNumber || loading}
                  className="flex-1 py-3 bg-[#00A651] text-white rounded-2xl font-semibold text-sm hover:bg-[#008f46] transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading ? 'Traitement...' : <>Confirmer <CheckCircle className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step: Confirmation + Digital Check-in */}
          {step === 'confirmation' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00A651]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-[#00A651]" />
              </div>
              <h4 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Réservation confirmée !</h4>
              <p className="text-sm text-gray-500 mb-4">Votre réservation a été enregistrée. Un QR code sera généré pour votre check-in digital.</p>

              {/* Digital Check-in Card */}
              <div className="p-5 bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-2xl text-white text-left mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <QrCode className="w-10 h-10 text-[#D4AF37]" />
                  <div>
                    <p className="text-sm font-bold">Check-in Digital</p>
                    <p className="text-xs text-white/60">Presentez ce QR code a l&apos;arrivee</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white/10 rounded-xl"><p className="text-white/60">Arrivée</p><p className="font-mono font-bold">{bookingForm.checkIn}</p></div>
                  <div className="p-2 bg-white/10 rounded-xl"><p className="text-white/60">Départ</p><p className="font-mono font-bold">{bookingForm.checkOut}</p></div>
                  <div className="p-2 bg-white/10 rounded-xl"><p className="text-white/60">Voyageurs</p><p className="font-mono font-bold">{bookingForm.guests}</p></div>
                  <div className="p-2 bg-white/10 rounded-xl"><p className="text-white/60">Ref.</p><p className="font-mono font-bold">AB-{Math.random().toString(36).slice(2, 8).toUpperCase()}</p></div>
                </div>
              </div>

              {/* Checkout flow info */}
              <div className="p-4 bg-[#D4AF37]/5 rounded-2xl text-left mb-4">
                <h5 className="text-sm font-bold text-[#2C2E2F] mb-2 flex items-center gap-2"><Receipt className="w-4 h-4 text-[#D4AF37]" /> Processus de check-out</h5>
                <ol className="text-xs text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2"><span className="w-5 h-5 bg-[#003087] text-white rounded-full flex items-center justify-center text-[10px] font-bold">1</span> Scannez le QR code a l&apos;arrivee</li>
                  <li className="flex items-center gap-2"><span className="w-5 h-5 bg-[#003087] text-white rounded-full flex items-center justify-center text-[10px] font-bold">2</span> Verifiez la chambre ensemble</li>
                  <li className="flex items-center gap-2"><span className="w-5 h-5 bg-[#003087] text-white rounded-full flex items-center justify-center text-[10px] font-bold">3</span> Check-out digital via l&apos;app</li>
                  <li className="flex items-center gap-2"><span className="w-5 h-5 bg-[#00A651] text-white rounded-full flex items-center justify-center text-[10px] font-bold">4</span> L&apos;escrow est libere automatiquement</li>
                </ol>
              </div>

              <button onClick={onClose} className="w-full py-3 bg-[#003087] text-white rounded-2xl font-semibold text-sm hover:bg-[#0047b3] transition-colors">Fermer</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function ShortTermRentalModule() {
  const { selectedCountry } = useCountry();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRentalId, setSelectedRentalId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingRentalId, setBookingRentalId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPropertyType, setFilterPropertyType] = useState('');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState('');
  const [filterCheckOut, setFilterCheckOut] = useState('');
  const [filterGuests, setFilterGuests] = useState(1);
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);

  const [bookingForm, setBookingForm] = useState({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('country', selectedCountry);
    if (searchQuery) params.set('search', searchQuery);
    if (filterPropertyType) params.set('propertyType', filterPropertyType);
    if (filterPriceMin) params.set('priceMin', filterPriceMin);
    if (filterPriceMax) params.set('priceMax', filterPriceMax);
    if (filterCheckIn) params.set('checkIn', filterCheckIn);
    if (filterCheckOut) params.set('checkOut', filterCheckOut);
    if (filterGuests > 1) params.set('guests', String(filterGuests));
    if (filterAmenities.length > 0) params.set('amenities', filterAmenities.join(','));
    return params.toString();
  }, [selectedCountry, searchQuery, filterPropertyType, filterPriceMin, filterPriceMax, filterCheckIn, filterCheckOut, filterGuests, filterAmenities]);

  const { data: rentalsData, isLoading, isError, error } = useQuery({
    queryKey: ['short-term-rentals', queryParams],
    queryFn: () => apiFetch<{ rentals: RentalApiItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/api/short-term?${queryParams}`),
  });

  const { data: rentalDetail } = useQuery({
    queryKey: ['short-term-rental', selectedRentalId],
    queryFn: () => apiFetch<RentalApiItem>(`/api/short-term/${selectedRentalId}`),
    enabled: !!selectedRentalId,
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['short-term-rental-availability', bookingRentalId],
    queryFn: () => apiFetch<{ availability: AvailabilityDay[] }>(`/api/short-term/${bookingRentalId}/availability`),
    enabled: !!bookingRentalId,
  });

  const createBooking = useMutation({
    mutationFn: (data: { rentalId: string; checkIn: string; checkOut: string; guests: number; specialRequests?: string }) =>
      apiPost(`/api/short-term/${data.rentalId}/bookings`, data),
    onSuccess: () => {
      toast.success('Réservation confirmée', { description: 'Votre réservation a été enregistrée avec succès.' });
      queryClient.invalidateQueries({ queryKey: ['short-term-rental-bookings'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur', { description: err.message || 'Impossible de créer la réservation.' });
    },
  });

  const rentals: RentalApiItem[] = (rentalsData as { rentals: RentalApiItem[] } | undefined)?.rentals ?? [];
  const availDays: AvailabilityDay[] = (availabilityData as { availability: AvailabilityDay[] } | undefined)?.availability ?? [];
  const bookingRental = rentals.find((r) => r.id === bookingRentalId) || null;

  const handleOpenBooking = useCallback((rentalId: string) => {
    setBookingRentalId(rentalId);
    setBookingForm({ checkIn: '', checkOut: '', guests: 1, specialRequests: '' });
    setShowBookingModal(true);
  }, []);

  const handleSubmitBooking = useCallback(() => {
    if (!bookingRentalId || !bookingForm.checkIn || !bookingForm.checkOut) return;
    createBooking.mutate({
      rentalId: bookingRentalId, checkIn: bookingForm.checkIn, checkOut: bookingForm.checkOut,
      guests: bookingForm.guests, specialRequests: bookingForm.specialRequests || undefined,
    });
  }, [bookingRentalId, bookingForm, createBooking]);

  const toggleAmenityFilter = useCallback((amenity: string) => {
    setFilterAmenities((prev) => prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery(''); setFilterPropertyType(''); setFilterPriceMin(''); setFilterPriceMax('');
    setFilterCheckIn(''); setFilterCheckOut(''); setFilterGuests(1); setFilterAmenities([]);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterPropertyType) count++; if (filterPriceMin) count++; if (filterPriceMax) count++;
    if (filterCheckIn) count++; if (filterCheckOut) count++; if (filterGuests > 1) count++;
    if (filterAmenities.length > 0) count++;
    return count;
  }, [filterPropertyType, filterPriceMin, filterPriceMax, filterCheckIn, filterCheckOut, filterGuests, filterAmenities]);

  const getEffectivePrice = useCallback((rental: RentalApiItem): { price: number; label: string; isDiscounted: boolean } => {
    const now = new Date(); const month = now.getMonth();
    const isHighSeason = month >= 11 || month <= 1 || (month >= 6 && month <= 8);
    if (rental.pricingRules && rental.pricingRules.length > 0) {
      const activeRule = rental.pricingRules.find((rule) => {
        if (rule.startDate && rule.endDate) { const start = new Date(rule.startDate); const end = new Date(rule.endDate); return now >= start && now <= end; }
        if (rule.period === 'high_season' && isHighSeason) return true;
        if (rule.period === 'low_season' && !isHighSeason) return true;
        return false;
      });
      if (activeRule) {
        return { price: Math.round(rental.pricePerNight * activeRule.multiplier), label: activeRule.period === 'high_season' ? 'Haute saison' : activeRule.period === 'low_season' ? 'Basse saison' : activeRule.name, isDiscounted: activeRule.multiplier < 1 };
      }
    }
    if (isHighSeason) return { price: Math.round(rental.pricePerNight * 1.2), label: 'Haute saison', isDiscounted: false };
    return { price: rental.pricePerNight, label: '', isDiscounted: false };
  }, []);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            <Home className="w-4 h-4" /> Location Courte Durée
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Locations <span className="text-[#D4AF37]">Vacances</span> & Séjours
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Appartements, villas et maisons entières pour vos séjours en Afrique de l&apos;Ouest. Check-in digital et paiement Mobile Money.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Rechercher par ville, quartier..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37] transition-colors" />
            </div>
            <div className="flex gap-2 items-center">
              <input type="date" value={filterCheckIn} onChange={(e) => setFilterCheckIn(e.target.value)} className="px-3 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37]" />
              <input type="date" value={filterCheckOut} onChange={(e) => setFilterCheckOut(e.target.value)} className="px-3 py-3 rounded-2xl border text-sm outline-none focus:border-[#D4AF37]" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0 ? 'bg-[#003087] text-white border-[#003087]' : 'hover:bg-gray-50'}`}>
                <Filter className="w-4 h-4" /> Filtres {activeFilterCount > 0 && <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#D4AF37] text-white text-[10px] font-bold">{activeFilterCount}</span>}
              </button>
              <div className="flex rounded-2xl border overflow-hidden">
                <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-[#003087] text-white' : 'hover:bg-gray-50'}`}><Grid3X3 className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('map')} className={`p-3 transition-colors ${viewMode === 'map' ? 'bg-[#003087] text-white' : 'hover:bg-gray-50'}`}><Map className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 mt-4 border-t">
                  <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Type de bien</label>
                    <select value={filterPropertyType} onChange={(e) => setFilterPropertyType(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-[#D4AF37]">
                      {PROPERTY_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                    </select></div>
                  <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Prix (FCFA/nuit)</label>
                    <div className="flex gap-2">
                      <input type="number" placeholder="Min" value={filterPriceMin} onChange={(e) => setFilterPriceMin(e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-[#D4AF37]" />
                      <input type="number" placeholder="Max" value={filterPriceMax} onChange={(e) => setFilterPriceMax(e.target.value)} className="w-1/2 px-3 py-2.5 rounded-xl border text-sm outline-none focus:border-[#D4AF37]" />
                    </div></div>
                  <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Voyageurs</label>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl border">
                      <button onClick={() => setFilterGuests((g) => Math.max(1, g - 1))} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50">-</button>
                      <span className="text-sm font-medium">{filterGuests}</span>
                      <button onClick={() => setFilterGuests((g) => Math.min(16, g + 1))} className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-50">+</button>
                    </div></div>
                  <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Equipements</label>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(AMENITY_ICONS).map(([key, icon]) => (
                        <button key={key} onClick={() => toggleAmenityFilter(key)} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium border transition-colors ${
                          filterAmenities.includes(key) ? 'bg-[#003087] text-white border-[#003087]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                          {icon} {key.charAt(0).toUpperCase() + key.slice(1)}
                        </button>
                      ))}
                    </div></div>
                </div>
                {activeFilterCount > 0 && <div className="flex justify-end mt-3"><button onClick={clearFilters} className="text-xs text-[#D93025] font-medium hover:underline">Réinitialiser les filtres</button></div>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Country Badge */}
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-3.5 h-3.5 text-gray-400" /><span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">{COUNTRY_NAMES[selectedCountry] || selectedCountry}</span>
          {rentals.length > 0 && <span className="text-xs text-gray-400 ml-2">{rentals.length} annonce{rentals.length !== 1 ? 's' : ''}</span>}
        </div>

        {isLoading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <RentalCardSkeleton key={i} />)}</div>}
        {isError && <div className="text-center py-16"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4"><X className="w-8 h-8 text-red-400" /></div><h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Impossible de charger les annonces</h3><p className="text-sm text-gray-500">{(error as Error)?.message || 'Une erreur est survenue.'}</p></div>}
        {!isLoading && !isError && rentals.length === 0 && <div className="text-center py-16"><div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4"><Home className="w-8 h-8 text-gray-300" /></div><h3 className="text-lg font-semibold text-[#2C2E2F] mb-2">Aucune location disponible</h3><p className="text-sm text-gray-500">Les locations courte duree seront bientot disponibles.</p></div>}

        {/* Grid View */}
        {!isLoading && !isError && rentals.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentals.map((rental, i) => {
              const image = getFirstImage(rental.images);
              const amenities = parseJsonArray(rental.amenities);
              const effectivePrice = getEffectivePrice(rental);
              return (
                <motion.div key={rental.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
                  whileHover={{ y: -4 }} className="bg-white rounded-3xl overflow-hidden shadow-sm border cursor-pointer group" onClick={() => setSelectedRentalId(rental.id)}>
                  <div className="relative aspect-[16/10]">
                    {image ? <ImageWithFallback src={image} alt={rental.title} className="w-full h-full" fallbackType="guesthouse" /> :
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Home className="w-12 h-12 text-gray-300" /></div>}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {rental.instantBooking && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37] text-white text-[10px] font-bold shadow-lg"><Zap className="w-3 h-3" /> Reservation instantanee</span>}
                      {!rental.instantBooking && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[#003087] text-[10px] font-bold shadow"><Clock className="w-3 h-3" /> Sur demande</span>}
                    </div>
                    <div className="absolute top-3 right-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-[#2C2E2F] shadow">{getPropertyTypeIcon(rental.propertyType)} {rental.propertyType.charAt(0).toUpperCase() + rental.propertyType.slice(1)}</span></div>
                    <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); toast.info('Ajoute aux favoris'); }} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition-transform"><Heart className="w-4 h-4 text-[#D93025]" /></button>
                      <button onClick={(e) => { e.stopPropagation(); toast.info('Lien copie'); }} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition-transform"><Share2 className="w-4 h-4 text-gray-500" /></button>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 line-clamp-1">{rental.title}</h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{rental.city}, {rental.country}{rental.quartier && <span className="text-gray-400"> - {rental.quartier}</span>}</p>
                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {rental.maxGuests}</span>
                      <span className="inline-flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {rental.bedrooms}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {rental.bathrooms}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {amenities.slice(0, 4).map((amenity) => <span key={amenity} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">{AMENITY_ICONS[amenity] || null}{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>)}
                      {amenities.length > 4 && <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full">+{amenities.length - 4}</span>}
                    </div>
                    <OtaSyncBadge syncStatus={rental.otaSyncStatus} />
                    <div className="flex items-center justify-between pt-3 border-t mt-3">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono-data text-xl font-bold text-[#D4AF37]">{formatPrice(effectivePrice.price)}</span>
                          {effectivePrice.isDiscounted && <span className="text-xs text-gray-400 line-through">{formatPrice(rental.pricePerNight)}</span>}
                        </div>
                        <span className="text-xs text-gray-400">FCFA/nuit</span>
                        {effectivePrice.label && <span className="ml-1 text-[10px] text-[#D4AF37] font-medium">{effectivePrice.label}</span>}
                      </div>
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" /><span className="text-sm font-semibold">{rental.rating > 0 ? rental.rating.toFixed(1) : '-'}</span>{rental.reviewCount > 0 && <span className="text-xs text-gray-400">({rental.reviewCount})</span>}</div>
                    </div>
                    {(rental.hostVerified || rental.hostIdentityVerified) && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {rental.hostVerified && <span className="inline-flex items-center gap-0.5 text-[10px] text-[#003087] font-medium"><BadgeCheck className="w-3 h-3" /> Hote verifie</span>}
                        {rental.hostIdentityVerified && <span className="inline-flex items-center gap-0.5 text-[10px] text-[#00A651] font-medium"><ShieldCheck className="w-3 h-3" /> Identite verifiee</span>}
                      </div>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleOpenBooking(rental.id); }}
                      className="w-full mt-3 py-2.5 bg-[#D4AF37] text-white rounded-2xl text-sm font-semibold hover:bg-[#c4a030] transition-colors flex items-center justify-center gap-2">
                      <Calendar className="w-4 h-4" /> Réserver
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedRentalId && rentalDetail && (
            <motion.div key="detail" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-[#2C2E2F]">{(rentalDetail as RentalApiItem).title}</h2>
                  <button onClick={() => setSelectedRentalId(null)} className="p-2 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">{(rentalDetail as RentalApiItem).description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-gray-50 rounded-2xl text-center"><Users className="w-5 h-5 text-[#003087] mx-auto mb-1" /><p className="text-xs text-gray-500">Voyageurs</p><p className="font-mono font-bold">{(rentalDetail as RentalApiItem).maxGuests}</p></div>
                  <div className="p-3 bg-gray-50 rounded-2xl text-center"><BedDouble className="w-5 h-5 text-[#003087] mx-auto mb-1" /><p className="text-xs text-gray-500">Chambres</p><p className="font-mono font-bold">{(rentalDetail as RentalApiItem).bedrooms}</p></div>
                  <div className="p-3 bg-gray-50 rounded-2xl text-center"><Bath className="w-5 h-5 text-[#003087] mx-auto mb-1" /><p className="text-xs text-gray-500">SdB</p><p className="font-mono font-bold">{(rentalDetail as RentalApiItem).bathrooms}</p></div>
                  <div className="p-3 bg-gray-50 rounded-2xl text-center"><Star className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" /><p className="text-xs text-gray-500">Note</p><p className="font-mono font-bold">{(rentalDetail as RentalApiItem).rating.toFixed(1)}</p></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-[#D4AF37]/5 rounded-2xl">
                  <div><span className="font-mono text-2xl font-bold text-[#D4AF37]">{formatPrice((rentalDetail as RentalApiItem).pricePerNight)}</span><span className="text-sm text-gray-500 ml-1">FCFA/nuit</span></div>
                  <button onClick={() => handleOpenBooking((rentalDetail as RentalApiItem).id)} className="px-6 py-3 bg-[#003087] text-white rounded-2xl font-semibold text-sm hover:bg-[#0047b3] transition-colors flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Réserver maintenant
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Flow Modal */}
        <BookingFlowModal
          open={showBookingModal}
          onClose={() => { setShowBookingModal(false); setBookingRentalId(null); }}
          rental={bookingRental}
          availability={availDays}
          bookingForm={bookingForm}
          setBookingForm={setBookingForm}
          onSubmit={handleSubmitBooking}
          loading={createBooking.isPending}
        />
      </div>
    </section>
  );
}
