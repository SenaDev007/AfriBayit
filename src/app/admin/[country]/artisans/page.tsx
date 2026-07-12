'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPatch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Hammer, Search, CheckCircle2, Clock, Star, MapPin, Loader2,
  ChevronLeft, ChevronRight, Ban, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface ArtisanRow {
  id: string;
  name: string;
  speciality: string;
  city: string;
  status: string;
  rating: number;
  verified: boolean;
  activeServices: number;
}

interface ArtisansResponse {
  artisans: ArtisanRow[];
  summary: {
    total: number;
    verified: number;
    pending: number;
    activeServices: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const statusLabels: Record<string, string> = {
  active: 'Actif', pending: 'En attente', suspended: 'Suspendu', verified: 'Vérifié',
};
const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700', verified: 'bg-blue-50 text-blue-700',
};

export default function CountryArtisansPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<ArtisansResponse>({
    queryKey: ['admin-artisans', country, search, statusFilter, specialityFilter, page],
    queryFn: () => apiFetch(`/api/admin/artisans?${queryParams.toString()}`),
  });

  const artisans = data?.artisans || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return apiPatch(`/api/artisans/${id}`, { action });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-artisans', country] });
      toast.success(
        variables.action === 'verify' ? 'Artisan vérifié avec succès' :
        variables.action === 'suspend' ? 'Artisan suspendu' : 'Action effectuée'
      );
    },
    onError: () => {
      toast.error("Erreur lors de l'action");
    },
  });

  const specialities = ['Menuiserie', 'Maçonnerie', 'Plomberie', 'Électricité', 'Peinture', 'Carrelage', 'Couture', 'Forge'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-[#003087]" />
            Artisans — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestion des artisans du {COUNTRY_NAMES[country]}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {summary?.total ?? '—'} artisans
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total artisans</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{summary?.verified ?? 0}</p>
              <p className="text-xs text-gray-500">Vérifiés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{summary?.pending ?? 0}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{summary?.activeServices ?? 0}</p>
              <p className="text-xs text-gray-500">Services actifs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, spécialité..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={specialityFilter} onValueChange={(v) => { setSpecialityFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Spécialité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {specialities.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'verified', 'suspended'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
              className={statusFilter === s ? 'bg-[#003087] text-white' : ''}
              onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s === '' ? 'Tous' : statusLabels[s] || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Artisan</th>
                  <th className="text-left p-4 font-medium text-gray-600">Spécialité</th>
                  <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-600">Note</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                      <p className="text-gray-400 mt-2">Chargement...</p>
                    </td>
                  </tr>
                ) : artisans.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun artisan trouvé</td></tr>
                ) : (
                  artisans.map((artisan) => (
                    <tr key={artisan.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#003087]/10 flex items-center justify-center shrink-0">
                            <Hammer className="w-4 h-4 text-[#003087]" />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">{artisan.name}</span>
                            <span className="text-xs text-gray-500">{artisan.activeServices} services</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">{artisan.speciality}</Badge>
                      </td>
                      <td className="p-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {artisan.city}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className={`${statusColors[artisan.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                          {statusLabels[artisan.status] || artisan.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                          {artisan.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {artisan.status === 'pending' && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8"
                              onClick={() => actionMutation.mutate({ id: artisan.id, action: 'verify' })}
                              disabled={actionMutation.isPending}
                            >
                              <ShieldCheck className="w-4 h-4 mr-1" /> Vérifier
                            </Button>
                          )}
                          {artisan.status !== 'suspended' && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                              onClick={() => actionMutation.mutate({ id: artisan.id, action: 'suspend' })}
                              disabled={actionMutation.isPending}
                            >
                              <Ban className="w-4 h-4 mr-1" /> Suspendre
                            </Button>
                          )}
                        </div>
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
