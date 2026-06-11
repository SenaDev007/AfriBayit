'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Hotel, Home, Search, Star, MapPin, ChevronLeft, ChevronRight,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface HotelRow {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  currency: string;
  status: string;
  available: boolean;
}

interface GuesthouseRow {
  id: string;
  name: string;
  city: string;
  country: string;
  overallRating: number;
  status: string;
  certificationStatus: string;
}

export default function CountryHospitalityPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [tab, setTab] = useState<'hotels' | 'guesthouses'>('hotels');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery<{ data: HotelRow[]; total: number }>({
    queryKey: ['admin-hotels', country, search, page],
    queryFn: () => apiFetch(`/api/admin/hotels?country=${country}&search=${encodeURIComponent(search)}&skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`),
    enabled: tab === 'hotels',
  });

  const { data: guesthousesData, isLoading: guesthousesLoading } = useQuery<{ data: GuesthouseRow[]; total: number }>({
    queryKey: ['admin-guesthouses', country, search, page],
    queryFn: () => apiFetch(`/api/admin/guesthouses?country=${country}&search=${encodeURIComponent(search)}&skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`),
    enabled: tab === 'guesthouses',
  });

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(price) + ' ' + currency;

  const certLabels: Record<string, string> = { pending: 'En attente', certified: 'Certifié', rejected: 'Rejeté', expired: 'Expiré' };
  const certColors: Record<string, string> = { pending: 'bg-amber-50 text-amber-700', certified: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700', expired: 'bg-gray-50 text-gray-600' };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Hotel className="w-6 h-6 text-[#003087]" />
            Hôtellerie — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Hôtels & Guesthouses du {COUNTRY_NAMES[country]}</p>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'hotels' ? 'default' : 'outline'}
          onClick={() => { setTab('hotels'); setPage(0); }}
          className={tab === 'hotels' ? 'bg-[#003087] text-white' : ''}
        >
          <Hotel className="w-4 h-4 mr-2" /> Hôtels ({hotelsData?.total || 0})
        </Button>
        <Button
          variant={tab === 'guesthouses' ? 'default' : 'outline'}
          onClick={() => { setTab('guesthouses'); setPage(0); }}
          className={tab === 'guesthouses' ? 'bg-[#D4AF37] text-white' : ''}
        >
          <Home className="w-4 h-4 mr-2" /> Guesthouses ({guesthousesData?.total || 0})
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Rechercher par nom, ville..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
      </div>

      {tab === 'hotels' ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {hotelsLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : (hotelsData?.data || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Hotel className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">Aucun hôtel trouvé</p>
              <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres de recherche</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hôtel</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ville</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Étoiles</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Note</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prix/nuit</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(hotelsData?.data || []).map((hotel) => (
                  <TableRow key={hotel.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">{hotel.name}</TableCell>
                    <TableCell className="text-gray-600">{hotel.city}</TableCell>
                    <TableCell><div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < hotel.stars ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`} />)}</div></TableCell>
                    <TableCell className="text-gray-600">{hotel.rating.toFixed(1)}</TableCell>
                    <TableCell className="text-gray-900 font-medium">{formatPrice(hotel.pricePerNight, hotel.currency)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-0 ${hotel.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`} variant="outline">
                        {hotel.status === 'active' ? 'Actif' : hotel.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {guesthousesLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : (guesthousesData?.data || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Home className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">Aucune guesthouse trouvée</p>
              <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres de recherche</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Guesthouse</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ville</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Note</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Certification</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(guesthousesData?.data || []).map((gh) => (
                  <TableRow key={gh.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">{gh.name}</TableCell>
                    <TableCell className="text-gray-600">{gh.city}</TableCell>
                    <TableCell className="text-gray-600">{gh.overallRating.toFixed(1)}</TableCell>
                    <TableCell>
                      <Badge className={`${certColors[gh.certificationStatus] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                        {certLabels[gh.certificationStatus] || gh.certificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs border-0 ${gh.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`} variant="outline">
                        {gh.status === 'active' ? 'Actif' : gh.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Pagination */}
      {(() => {
        const currentTotal = tab === 'hotels' ? (hotelsData?.total || 0) : (guesthousesData?.total || 0);
        const totalPages = Math.ceil(currentTotal / PAGE_SIZE);
        return totalPages > 1 ? (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, currentTotal)} sur {currentTotal}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button key={pageNum} variant={pageNum === page + 1 ? 'default' : 'outline'} size="sm"
                    className={cn('h-8 w-8 p-0 text-xs', pageNum === page + 1 && 'bg-[#003087] hover:bg-[#002a70]')}
                    onClick={() => setPage(pageNum - 1)}>
                    {pageNum}
                  </Button>
                );
              })}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
