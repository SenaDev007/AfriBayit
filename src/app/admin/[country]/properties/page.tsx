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
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Propriété</th>
                  <th className="text-left p-4 font-medium text-gray-600">Type</th>
                  <th className="text-left p-4 font-medium text-gray-600">Prix</th>
                  <th className="text-left p-4 font-medium text-gray-600">Localisation</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-600">Vérifié</th>
                  <th className="text-left p-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                ) : properties.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Aucune propriété trouvée</td></tr>
                ) : (
                  properties.map((prop) => (
                    <tr key={prop.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900 max-w-[200px] truncate">{prop.title}</td>
                      <td className="p-4"><Badge variant="outline" className="text-xs">{typeLabels[prop.type] || prop.type}</Badge></td>
                      <td className="p-4 text-gray-700 font-medium">{formatPrice(prop.price, prop.currency)}</td>
                      <td className="p-4 text-gray-600">{prop.city}, {prop.quartier}</td>
                      <td className="p-4">
                        <Badge className={`${statusColors[prop.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                          {statusLabels[prop.status] || prop.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {prop.verified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(prop.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
