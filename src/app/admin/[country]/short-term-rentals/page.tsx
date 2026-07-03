'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Home, CalendarDays, Search, DollarSign, TrendingUp, Clock,
  Loader2, ChevronLeft, ChevronRight, CheckCircle2, MapPin,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface ListingRow {
  id: string;
  title: string;
  host: string;
  city: string;
  pricePerNight: number;
  currency: string;
  status: string;
  rating: number;
}

interface BookingRow {
  id: string;
  listing: string;
  guest: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  currency: string;
  status: string;
}

interface ShortTermRentalsResponse {
  listings?: ListingRow[];
  bookings?: BookingRow[];
  summary: {
    totalListings: number;
    activeBookings: number;
    revenue: number;
    occupancyRate: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const listingStatusLabels: Record<string, string> = {
  active: 'Active', pending: 'En attente', inactive: 'Inactive',
};
const listingStatusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700', inactive: 'bg-gray-50 text-gray-600',
};
const bookingStatusLabels: Record<string, string> = {
  confirmed: 'Confirmée', pending: 'En attente', checked_in: 'Check-in', completed: 'Terminée', cancelled: 'Annulée',
};
const bookingStatusColors: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700',
  checked_in: 'bg-blue-50 text-blue-700', completed: 'bg-gray-50 text-gray-600', cancelled: 'bg-red-50 text-red-700',
};

export default function CountryShortTermRentalsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [tab, setTab] = useState<'listings' | 'bookings'>('listings');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  queryParams.set('tab', tab);
  if (search) queryParams.set('search', search);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<ShortTermRentalsResponse>({
    queryKey: ['admin-short-term-rentals', country, tab, search, page],
    queryFn: () => apiFetch(`/api/admin/short-term-rentals?${queryParams.toString()}`),
  });

  const listings = data?.listings || [];
  const bookings = data?.bookings || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-[#003087]" />
            Locations courte durée — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Annonces & Réservations du {COUNTRY_NAMES[country]}
          </p>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'listings' ? 'default' : 'outline'}
          onClick={() => { setTab('listings'); setPage(1); }}
          className={tab === 'listings' ? 'bg-[#003087] text-white' : ''}
        >
          <Home className="w-4 h-4 mr-2" /> Annonces ({summary?.totalListings ?? 0})
        </Button>
        <Button
          variant={tab === 'bookings' ? 'default' : 'outline'}
          onClick={() => { setTab('bookings'); setPage(1); }}
          className={tab === 'bookings' ? 'bg-[#D4AF37] text-white' : ''}
        >
          <CalendarDays className="w-4 h-4 mr-2" /> Réservations
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{summary?.totalListings ?? 0}</p>
              <p className="text-xs text-gray-500">Total annonces</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{summary?.activeBookings ?? 0}</p>
              <p className="text-xs text-gray-500">Réservations actives</p>
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
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{summary?.occupancyRate ?? 0}%</p>
              <p className="text-xs text-gray-500">Taux d&apos;occupation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={tab === 'listings' ? 'Rechercher une annonce...' : 'Rechercher une réservation...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {tab === 'listings' ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Annonce</th>
                    <th className="text-left p-4 font-medium text-gray-600">Hôte</th>
                    <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                    <th className="text-left p-4 font-medium text-gray-600">Prix/nuit</th>
                    <th className="text-left p-4 font-medium text-gray-600">Note</th>
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
                  ) : listings.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune annonce trouvée</td></tr>
                  ) : (
                    listings.map((l) => (
                      <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900 max-w-[200px] truncate">{l.title}</td>
                        <td className="p-4 text-gray-600">{l.host}</td>
                        <td className="p-4 text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {l.city}
                          </span>
                        </td>
                        <td className="p-4 text-gray-900 font-medium">{formatXOF(l.pricePerNight)}</td>
                        <td className="p-4 text-gray-600">{l.rating.toFixed(1)}</td>
                        <td className="p-4">
                          <Badge className={`${listingStatusColors[l.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                            {listingStatusLabels[l.status] || l.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Annonce</th>
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
                        <td className="p-4 font-medium text-gray-900 max-w-[180px] truncate">{b.listing}</td>
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
            )}
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
