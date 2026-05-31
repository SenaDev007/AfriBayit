'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hotel, Home, Star, MapPin, CalendarCheck } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };

export default function CountryHospitalityPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ['admin-hotels', country],
    queryFn: () => apiFetch<{
      hotels: Array<{
        id: string;
        name: string;
        city: string;
        stars: number;
        rating: number;
        pricePerNight: number;
        status: string;
        connectionLevel: number;
      }>;
      pagination: { total: number };
    }>(`/api/admin/hotels?country=${country}&limit=50`),
  });

  const { data: guesthousesData, isLoading: ghLoading } = useQuery({
    queryKey: ['admin-guesthouses', country],
    queryFn: () => apiFetch<{
      guesthouses: Array<{
        id: string;
        name: string;
        city: string;
        overallRating: number;
        reviewCount: number;
        status: string;
        certificationStatus: string;
        quartier: string | null;
      }>;
      pagination: { total: number };
    }>(`/api/admin/guesthouses?country=${country}&limit=50`),
  });

  const hotels = hotelsData?.hotels || [];
  const guesthouses = guesthousesData?.guesthouses || [];
  const totalHotels = hotelsData?.pagination?.total || hotels.length;
  const totalGuesthouses = guesthousesData?.pagination?.total || guesthouses.length;

  const connectionLabels: Record<number, string> = {
    1: 'OTA',
    2: 'PMS Hors-réseau',
    3: 'Guesthouse',
  };

  const certLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    certified: { label: 'Certifiée', color: 'bg-green-50 text-green-700 border-green-200' },
    rejected: { label: 'Rejetée', color: 'bg-red-50 text-red-700 border-red-200' },
    expired: { label: 'Expirée', color: 'bg-gray-50 text-gray-600 border-gray-200' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hôtellerie & Séjours — {COUNTRY_NAMES[country]}</h1>
        <p className="text-gray-500 text-sm mt-1">{totalHotels} hôtels, {totalGuesthouses} guesthouses</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <Hotel className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#003087]">{totalHotels}</p>
              <p className="text-xs text-gray-500">Hôtels</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{totalGuesthouses}</p>
              <p className="text-xs text-gray-500">Guesthouses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">
                {hotels.filter((h) => h.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">Hôtels actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">
                {guesthouses.filter((g) => g.certificationStatus === 'certified').length}
              </p>
              <p className="text-xs text-gray-500">GH certifiées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hotels">
        <TabsList>
          <TabsTrigger value="hotels" className="gap-1.5">
            <Hotel className="w-4 h-4" /> Hôtels ({totalHotels})
          </TabsTrigger>
          <TabsTrigger value="guesthouses" className="gap-1.5">
            <Home className="w-4 h-4" /> Guesthouses ({totalGuesthouses})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotels" className="mt-4">
          {hotelsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse rounded-2xl"><CardContent className="p-4"><div className="h-20 bg-gray-100 rounded" /></CardContent></Card>
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="p-8 text-center text-gray-400">Aucun hôtel dans ce pays</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotels.map((hotel) => (
                <Card key={hotel.id} className="hover:shadow-md transition-shadow rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Hotel className="w-4 h-4 text-[#003087]" />
                          {hotel.name}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {hotel.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {hotel.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-[#003087]">
                          {connectionLabels[hotel.connectionLevel] || `Niveau ${hotel.connectionLevel}`}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className="flex items-center gap-1 text-[#D4AF37] font-medium">
                        {'★'.repeat(hotel.stars)} {hotel.stars} étoiles
                      </span>
                      <span className="text-gray-500">{hotel.rating.toFixed(1)}/5</span>
                      <span className="font-bold text-[#003087] ml-auto">{hotel.pricePerNight.toLocaleString('fr-FR')} FCFA/nuit</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="guesthouses" className="mt-4">
          {ghLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse rounded-2xl"><CardContent className="p-4"><div className="h-20 bg-gray-100 rounded" /></CardContent></Card>
              ))}
            </div>
          ) : guesthouses.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="p-8 text-center text-gray-400">Aucune guesthouse dans ce pays</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guesthouses.map((gh) => {
                const cert = certLabels[gh.certificationStatus] || { label: gh.certificationStatus, color: 'bg-gray-50 text-gray-600 border-gray-200' };
                return (
                  <Card key={gh.id} className="hover:shadow-md transition-shadow rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Home className="w-4 h-4 text-[#003087]" />
                            {gh.name}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {gh.quartier ? `${gh.quartier}, ` : ''}{gh.city}
                          </p>
                        </div>
                        <Badge className={`${cert.color} border text-xs`} variant="outline">
                          {cert.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#D4AF37]" /> {gh.overallRating.toFixed(1)}/5
                        </span>
                        <span className="text-gray-500">{gh.reviewCount} avis</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">{gh.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
