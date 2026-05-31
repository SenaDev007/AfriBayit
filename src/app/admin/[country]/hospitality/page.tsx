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
    <div className="space-y-6">
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
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Hôtel</th>
                    <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                    <th className="text-left p-4 font-medium text-gray-600">Étoiles</th>
                    <th className="text-left p-4 font-medium text-gray-600">Note</th>
                    <th className="text-left p-4 font-medium text-gray-600">Prix/nuit</th>
                    <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {hotelsLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                  ) : (hotelsData?.data || []).length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun hôtel trouvé</td></tr>
                  ) : (
                    (hotelsData?.data || []).map((hotel) => (
                      <tr key={hotel.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{hotel.name}</td>
                        <td className="p-4 text-gray-600">{hotel.city}</td>
                        <td className="p-4"><div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < hotel.stars ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`} />)}</div></td>
                        <td className="p-4 text-gray-600">{hotel.rating.toFixed(1)}</td>
                        <td className="p-4 text-gray-900 font-medium">{formatPrice(hotel.pricePerNight, hotel.currency)}</td>
                        <td className="p-4">
                          <Badge className={`text-xs border-0 ${hotel.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`} variant="outline">
                            {hotel.status === 'active' ? 'Actif' : hotel.status}
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
      ) : (
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Guesthouse</th>
                    <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                    <th className="text-left p-4 font-medium text-gray-600">Note</th>
                    <th className="text-left p-4 font-medium text-gray-600">Certification</th>
                    <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {guesthousesLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                  ) : (guesthousesData?.data || []).length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune guesthouse trouvée</td></tr>
                  ) : (
                    (guesthousesData?.data || []).map((gh) => (
                      <tr key={gh.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{gh.name}</td>
                        <td className="p-4 text-gray-600">{gh.city}</td>
                        <td className="p-4 text-gray-600">{gh.overallRating.toFixed(1)}</td>
                        <td className="p-4">
                          <Badge className={`${certColors[gh.certificationStatus] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                            {certLabels[gh.certificationStatus] || gh.certificationStatus}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={`text-xs border-0 ${gh.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`} variant="outline">
                            {gh.status === 'active' ? 'Actif' : gh.status}
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
      )}
    </div>
  );
}
