'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Home, Search, CheckCircle2, XCircle, Ban, Shield,
  ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch } from '@/lib/api';
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

const CERT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'certified', label: 'Certifié' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'expired', label: 'Expiré' },
];

const certColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  certified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
};

const certLabels: Record<string, string> = {
  pending: 'En attente', certified: 'Certifié', rejected: 'Rejeté', expired: 'Expiré',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-50 text-red-700',
};

interface GuesthouseRow {
  id: string;
  name: string;
  city: string;
  country: string;
  overallRating: number;
  certificationStatus: string;
  status: string;
  _count: { rooms: number; bookings: number };
}

interface GuesthousesResponse {
  guesthouses: GuesthouseRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { byCert: Array<{ certificationStatus: string; _count: number }>; byCountry: Array<{ country: string; _count: number }> };
}

export default function AdminGuesthousesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ country: '', certificationStatus: '', search: '', page: 1 });

  const params = new URLSearchParams();
  if (filters.country) params.set('country', filters.country);
  if (filters.certificationStatus) params.set('certificationStatus', filters.certificationStatus);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery<GuesthousesResponse>({
    queryKey: ['admin-guesthouses', filters],
    queryFn: () => apiFetch<GuesthousesResponse>(`/api/admin/guesthouses?${params.toString()}`),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const updates: Record<string, unknown> = {};
      if (action === 'certify') { updates.certificationStatus = 'certified'; updates.certifiedAt = new Date().toISOString(); }
      else if (action === 'reject') updates.certificationStatus = 'rejected';
      else if (action === 'suspend') updates.status = 'inactive';
      return apiPatch(`/api/guesthouses/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-guesthouses'] });
      toast({ title: 'Action effectuée' });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="w-6 h-6 text-[#003087]" />
          Guesthouses
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des guesthouses et certifications</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {data?.summary?.byCert?.map((c) => (
          <div key={c.certificationStatus} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
              c.certificationStatus === 'certified' ? 'bg-green-50' :
              c.certificationStatus === 'rejected' ? 'bg-red-50' :
              c.certificationStatus === 'expired' ? 'bg-gray-100' :
              'bg-amber-50'
            )}>
              {c.certificationStatus === 'certified' ? <Shield className="w-5 h-5 text-green-600" /> :
               c.certificationStatus === 'rejected' ? <XCircle className="w-5 h-5 text-red-500" /> :
               c.certificationStatus === 'expired' ? <Ban className="w-5 h-5 text-gray-500" /> :
               <Clock className="w-5 h-5 text-amber-600" />}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">{certLabels[c.certificationStatus] || c.certificationStatus}</p>
              <p className="text-2xl font-bold text-gray-900 font-display">{c._count}</p>
            </div>
          </div>
        )) || [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse" />)}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Rechercher une guesthouse..." className="pl-10 h-9 text-sm" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} />
          </div>
          <Select value={filters.certificationStatus} onValueChange={(v) => setFilters((f) => ({ ...f, certificationStatus: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Certification" /></SelectTrigger>
            <SelectContent>
              {CERT_OPTIONS.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : !data?.guesthouses.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune guesthouse trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Nom</TableHead>
                  <TableHead className="text-xs font-semibold">Ville</TableHead>
                  <TableHead className="text-xs font-semibold">Pays</TableHead>
                  <TableHead className="text-xs font-semibold">Note</TableHead>
                  <TableHead className="text-xs font-semibold">Chambres</TableHead>
                  <TableHead className="text-xs font-semibold">Certification</TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.guesthouses.map((g) => (
                  <TableRow key={g.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-medium text-gray-900">{g.name}</TableCell>
                    <TableCell className="text-sm text-gray-700">{g.city}</TableCell>
                    <TableCell className="text-sm">{g.country}</TableCell>
                    <TableCell className="text-sm font-semibold">{g.overallRating.toFixed(1)}</TableCell>
                    <TableCell className="text-sm">{g._count.rooms}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', certColors[g.certificationStatus] || 'bg-gray-100 text-gray-600')}>
                        {certLabels[g.certificationStatus] || g.certificationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px]', statusColors[g.status] || 'bg-gray-100 text-gray-600')}>{g.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Certifier" onClick={() => actionMutation.mutate({ id: g.id, action: 'certify' })}>
                          <Shield className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Rejeter" onClick={() => actionMutation.mutate({ id: g.id, action: 'reject' })}>
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Suspendre" onClick={() => actionMutation.mutate({ id: g.id, action: 'suspend' })}>
                          <Ban className="w-3.5 h-3.5 text-amber-500" />
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
            <p className="text-xs text-gray-500">
              {(data.pagination.page - 1) * data.pagination.limit + 1}–
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} sur {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pagination.pages || Math.abs(p - filters.page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showDots = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showDots && <span className="px-1 text-xs text-gray-400">...</span>}
                      <Button
                        variant={p === filters.page ? 'default' : 'outline'}
                        size="sm"
                        className={cn('h-8 w-8 p-0 text-xs', p === filters.page && 'bg-[#003087] hover:bg-[#002a70]')}
                        onClick={() => setFilters((f) => ({ ...f, page: p }))}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  );
                })}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
