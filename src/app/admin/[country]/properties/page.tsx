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
  Building2, Search, Eye, MapPin, CheckCircle2, Clock, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface PropertyRow {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  city: string;
  quartier: string;
  status: string;
  verified: boolean;
  createdAt: string;
}

const statusLabels: Record<string, string> = { draft: 'Brouillon', pending: 'En attente', ai_review: 'Revue IA', human_review: 'Revue humaine', published: 'Publiée', sold: 'Vendue', rented: 'Louée', rejected: 'Rejetée' };
const statusColors: Record<string, string> = { draft: 'bg-gray-50 text-gray-600', pending: 'bg-amber-50 text-amber-700', ai_review: 'bg-blue-50 text-blue-700', human_review: 'bg-purple-50 text-purple-700', published: 'bg-green-50 text-green-700', sold: 'bg-[#D4AF37]/10 text-[#D4AF37]', rented: 'bg-[#009CDE]/10 text-[#009CDE]', rejected: 'bg-red-50 text-red-700' };
const typeLabels: Record<string, string> = { villa: 'Villa', appartement: 'Appartement', terrain: 'Terrain', bureau: 'Bureau', commerce: 'Commerce', chambre: 'Chambre', guesthouse: 'Guesthouse' };

export default function CountryPropertiesPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery<{ data: PropertyRow[]; total: number }>({
    queryKey: ['admin-properties', country, search, statusFilter, page],
    queryFn: () => apiFetch(`/api/admin/properties?country=${country}&search=${encodeURIComponent(search)}&status=${statusFilter}&skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`),
  });

  const properties = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(price) + ' ' + currency;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#003087]" />
            Propriétés — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des propriétés du {COUNTRY_NAMES[country]}</p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {total} propriété{total !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher par titre, ville..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'published', 'sold'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
              className={statusFilter === s ? 'bg-[#003087] text-white' : ''}
              onClick={() => { setStatusFilter(s); setPage(0); }}>
              {s === '' ? 'Tous' : statusLabels[s] || s}
            </Button>
          ))}
        </div>
      </div>

      {/* Properties table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune propriété trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres de recherche</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Propriété</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prix</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Localisation</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vérifié</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((prop) => (
                <TableRow key={prop.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900 max-w-[200px] truncate">{prop.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{typeLabels[prop.type] || prop.type}</Badge></TableCell>
                  <TableCell className="text-gray-700 font-medium">{formatPrice(prop.price, prop.currency)}</TableCell>
                  <TableCell className="text-gray-600">{prop.city}, {prop.quartier}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[prop.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                      {statusLabels[prop.status] || prop.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {prop.verified ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">{new Date(prop.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}><ChevronLeft className="w-4 h-4" /></Button>
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
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
