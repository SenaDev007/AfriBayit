'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Hotel, Search, Eye, CheckCircle2, Ban, Star, StarOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
  { value: 'pending_review', label: 'En attente' },
];

const CONNECTION_OPTIONS = [
  { value: '', label: 'Tous niveaux' },
  { value: '1', label: 'OTA' },
  { value: '2', label: 'Hors-réseau (PMS)' },
  { value: '3', label: 'Guesthouse' },
];

const connectionLabels: Record<number, string> = { 1: 'OTA', 2: 'PMS', 3: 'Guesthouse' };
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  pending_review: 'bg-amber-50 text-amber-700',
};
const statusLabels: Record<string, string> = { active: 'Actif', inactive: 'Inactif', pending_review: 'En attente' };

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

interface HotelRow {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  rating: number;
  status: string;
  connectionLevel: number;
  available: boolean;
  _count: { rooms: number; bookings: number };
}

interface HotelsResponse {
  hotels: HotelRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { byStatus: Array<{ status: string; _count: number }>; byCountry: Array<{ country: string; _count: number }> };
}

export default function AdminHotelsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ country: '', status: '', connectionLevel: '', search: '', page: 1 });

  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.status) params.set('status', filters.status);
  if (filters.connectionLevel) params.set('connectionLevel', filters.connectionLevel);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery<HotelsResponse>({
    queryKey: ['admin-hotels', filters],
    queryFn: () => apiFetch<HotelsResponse>(`/api/admin/hotels?${params.toString()}`),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const updates: Record<string, unknown> = {};
      if (action === 'approve') updates.status = 'active';
      else if (action === 'suspend') updates.status = 'inactive';
      else if (action === 'feature') updates.premium = true;
      return apiPatch(`/api/hotels/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
      toast({ title: 'Action effectuée' });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hôtels</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des hôtels et connexions OTA</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {data?.summary?.byStatus?.map((s) => (
          <div key={s.status} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{statusLabels[s.status] || s.status}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s._count}</p>
          </div>
        )) || [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse" />)}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Rechercher un hôtel..." className="pl-10" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s.value || '__all'} value={s.value || '__all'}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.connectionLevel} onValueChange={(v) => setFilters((f) => ({ ...f, connectionLevel: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Connexion" /></SelectTrigger>
            <SelectContent>
              {CONNECTION_OPTIONS.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : !data?.hotels.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Hotel className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Aucun hôtel trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Nom</TableHead>
                  <TableHead className="text-xs font-semibold">Ville</TableHead>
                  <TableHead className="text-xs font-semibold">Pays</TableHead>
                  <TableHead className="text-xs font-semibold">Étoiles</TableHead>
                  <TableHead className="text-xs font-semibold">Note</TableHead>
                  <TableHead className="text-xs font-semibold">Chambres</TableHead>
                  <TableHead className="text-xs font-semibold">Connexion</TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.hotels.map((h) => (
                  <TableRow key={h.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-medium text-gray-900">{h.name}</TableCell>
                    <TableCell className="text-sm text-gray-700">{h.city}</TableCell>
                    <TableCell className="text-sm">{h.country}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn('w-3 h-3', i < h.stars ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-200')} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{h.rating.toFixed(1)}</TableCell>
                    <TableCell className="text-sm">{h._count.rooms}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{connectionLabels[h.connectionLevel] || `Niveau ${h.connectionLevel}`}</Badge></TableCell>
                    <TableCell><Badge className={cn('text-[10px]', statusColors[h.status] || 'bg-gray-100 text-gray-600')}>{statusLabels[h.status] || h.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Approuver" onClick={() => actionMutation.mutate({ id: h.id, action: 'approve' })}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Suspendre" onClick={() => actionMutation.mutate({ id: h.id, action: 'suspend' })}>
                          <Ban className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Mettre en avant" onClick={() => actionMutation.mutate({ id: h.id, action: 'feature' })}>
                          <StarOff className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data.pagination.total} résultat(s) — Page {data.pagination.page}/{data.pagination.pages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Suivant</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
