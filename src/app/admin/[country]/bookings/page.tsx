'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CalendarCheck, Search, DollarSign, TrendingDown, Hotel, Home,
  Loader2, ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface BookingRow {
  id: string;
  establishment: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  currency: string;
  status: string;
  type: string;
}

interface BookingsResponse {
  bookings: BookingRow[];
  summary: {
    totalBookings: number;
    inProgress: number;
    revenue: number;
    cancellationRate: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const bookingStatusLabels: Record<string, string> = {
  confirmed: 'Confirmée', pending: 'En attente', checked_in: 'Check-in',
  completed: 'Terminée', cancelled: 'Annulée',
};
const bookingStatusColors: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700',
  checked_in: 'bg-blue-50 text-blue-700', completed: 'bg-gray-50 text-gray-600',
  cancelled: 'bg-red-50 text-red-700',
};

export default function CountryBookingsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [tab, setTab] = useState<'hotels' | 'guesthouses' | 'short-term'>('hotels');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  queryParams.set('tab', tab);
  if (search) queryParams.set('search', search);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<BookingsResponse>({
    queryKey: ['admin-bookings', country, tab, search, page],
    queryFn: () => apiFetch(`/api/admin/bookings?${queryParams.toString()}`),
  });

  const bookings = data?.bookings || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

  const tabLabels: Record<string, string> = {
    hotels: 'Hôtels', guesthouses: 'Guesthouses', 'short-term': 'Locations courte durée',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#003087]" />
            Réservations — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestion des réservations du {COUNTRY_NAMES[country]}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {summary?.totalBookings ?? '—'} réservations
        </Badge>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2 flex-wrap">
        {(['hotels', 'guesthouses', 'short-term'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'outline'}
            onClick={() => { setTab(t); setPage(1); }}
            className={tab === t ? 'bg-[#003087] text-white' : ''}
          >
            {t === 'hotels' && <Hotel className="w-4 h-4 mr-2" />}
            {t === 'guesthouses' && <Home className="w-4 h-4 mr-2" />}
            {t === 'short-term' && <CalendarCheck className="w-4 h-4 mr-2" />}
            {tabLabels[t]}
          </Button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{summary?.totalBookings ?? 0}</p>
              <p className="text-xs text-gray-500">Réservations totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{summary?.inProgress ?? 0}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{formatXOF(summary?.revenue ?? 0)}</p>
              <p className="text-xs text-gray-500">Revenus</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{summary?.cancellationRate ?? 0}%</p>
              <p className="text-xs text-gray-500">Taux d&apos;annulation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher par établissement, client..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Établissement</th>
                  <th className="text-left p-4 font-medium text-gray-600">Client</th>
                  <th className="text-left p-4 font-medium text-gray-600">Check-in</th>
                  <th className="text-left p-4 font-medium text-gray-600">Check-out</th>
                  <th className="text-left p-4 font-medium text-gray-600">Total</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune réservation trouvée</td></tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900 max-w-[200px] truncate">{b.establishment}</td>
                      <td className="p-4 text-gray-600">{b.guest}</td>
                      <td className="p-4 text-gray-600 text-xs">{new Date(b.checkIn).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4 text-gray-600 text-xs">{new Date(b.checkOut).toLocaleDateString('fr-FR')}</td>
                      <td className="p-4 text-gray-900 font-medium">{formatXOF(b.totalPrice)}</td>
                      <td className="p-4">
                        <Badge className={`${bookingStatusColors[b.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                          {bookingStatusLabels[b.status] || b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {(pagination.page - 1) * LIMIT + 1}–{Math.min(pagination.page * LIMIT, pagination.total)} sur {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
