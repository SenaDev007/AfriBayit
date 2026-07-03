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
  Map, Search, CheckCircle2, Clock, AlertTriangle, ShieldCheck,
  Loader2, ChevronLeft, ChevronRight, Target,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface GeometerRow {
  id: string;
  name: string;
  licence: string;
  city: string;
  status: string;
  missionsCompleted: number;
}

interface MissionRow {
  id: string;
  title: string;
  geometer: string;
  property: string;
  status: string;
  conflictsDetected: number;
  createdAt: string;
}

interface GeotrustResponse {
  geometers?: GeometerRow[];
  missions?: MissionRow[];
  summary: {
    total: number;
    licensed: number;
    pending: number;
    missionsCompleted: number;
    missionsInProgress: number;
    missionsConflicts: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const geometerStatusLabels: Record<string, string> = {
  licensed: 'Licencié', pending: 'En attente', suspended: 'Suspendu',
};
const geometerStatusColors: Record<string, string> = {
  licensed: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700', suspended: 'bg-red-50 text-red-700',
};
const missionStatusLabels: Record<string, string> = {
  in_progress: 'En cours', completed: 'Complétée', pending: 'En attente', conflict: 'Conflit',
};
const missionStatusColors: Record<string, string> = {
  in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700', conflict: 'bg-red-50 text-red-700',
};

export default function CountryGeotrustPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [tab, setTab] = useState<'geometers' | 'missions'>('geometers');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  queryParams.set('tab', tab);
  if (search) queryParams.set('search', search);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<GeotrustResponse>({
    queryKey: ['admin-geotrust', country, tab, search, page],
    queryFn: () => apiFetch(`/api/admin/geotrust?${queryParams.toString()}`),
  });

  const geometers = data?.geometers || [];
  const missions = data?.missions || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const isGeometersTab = tab === 'geometers';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Map className="w-6 h-6 text-[#003087]" />
            GeoTrust — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Géomètres & Missions du {COUNTRY_NAMES[country]}
          </p>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'geometers' ? 'default' : 'outline'}
          onClick={() => { setTab('geometers'); setPage(1); }}
          className={tab === 'geometers' ? 'bg-[#003087] text-white' : ''}
        >
          <ShieldCheck className="w-4 h-4 mr-2" /> Géomètres ({summary?.total ?? 0})
        </Button>
        <Button
          variant={tab === 'missions' ? 'default' : 'outline'}
          onClick={() => { setTab('missions'); setPage(1); }}
          className={tab === 'missions' ? 'bg-[#D4AF37] text-white' : ''}
        >
          <Target className="w-4 h-4 mr-2" /> Missions
        </Button>
      </div>

      {/* Stats */}
      {isGeometersTab ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
                <Map className="w-5 h-5 text-[#003087]" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{summary?.licensed ?? 0}</p>
                <p className="text-xs text-gray-500">Licenciés</p>
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
                <Target className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#D4AF37]">{summary?.missionsCompleted ?? 0}</p>
                <p className="text-xs text-gray-500">Missions complétées</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#003087]" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{pagination?.total ?? 0}</p>
                <p className="text-xs text-gray-500">Total missions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-600">{summary?.missionsInProgress ?? 0}</p>
                <p className="text-xs text-gray-500">En cours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{summary?.missionsCompleted ?? 0}</p>
                <p className="text-xs text-gray-500">Complétées</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{summary?.missionsConflicts ?? 0}</p>
                <p className="text-xs text-gray-500">Conflits détectés</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={isGeometersTab ? 'Rechercher un géomètre...' : 'Rechercher une mission...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isGeometersTab ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Géomètre</th>
                    <th className="text-left p-4 font-medium text-gray-600">Licence</th>
                    <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                    <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                    <th className="text-left p-4 font-medium text-gray-600">Missions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : geometers.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucun géomètre trouvé</td></tr>
                  ) : (
                    geometers.map((g) => (
                      <tr key={g.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{g.name}</td>
                        <td className="p-4 text-gray-600 font-mono text-xs">{g.licence}</td>
                        <td className="p-4 text-gray-600">{g.city}</td>
                        <td className="p-4">
                          <Badge className={`${geometerStatusColors[g.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                            {geometerStatusLabels[g.status] || g.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-900 font-medium">{g.missionsCompleted}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Mission</th>
                    <th className="text-left p-4 font-medium text-gray-600">Géomètre</th>
                    <th className="text-left p-4 font-medium text-gray-600">Propriété</th>
                    <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                    <th className="text-left p-4 font-medium text-gray-600">Conflits</th>
                    <th className="text-left p-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : missions.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune mission trouvée</td></tr>
                  ) : (
                    missions.map((m) => (
                      <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{m.title}</td>
                        <td className="p-4 text-gray-600">{m.geometer}</td>
                        <td className="p-4 text-gray-600">{m.property}</td>
                        <td className="p-4">
                          <Badge className={`${missionStatusColors[m.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                            {missionStatusLabels[m.status] || m.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {m.conflictsDetected > 0 ? (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <AlertTriangle className="w-3 h-3" /> {m.conflictsDetected}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</td>
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
