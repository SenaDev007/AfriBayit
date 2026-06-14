'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck,
  ClipboardCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAdminGeotrust } from '@/hooks/useAdmin';

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

const MISSION_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const MISSION_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

interface GeometerRow {
  id: string;
  name: string;
  license: string;
  country: string;
  specializations: string[];
  verified: boolean;
  missionsCount: number;
}

interface MissionRow {
  id: string;
  propertyTitle: string;
  geometerName: string;
  status: string;
  scheduledDate: string;
  completedDate: string | null;
}

export default function AdminGeotrustPage() {
  const [activeTab, setActiveTab] = useState<'geometers' | 'missions'>('geometers');
  const [filters, setFilters] = useState<{ status?: string; country?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useAdminGeotrust({ ...filters, tab: activeTab });
  const summary = data?.summary;
  const pagination = data?.pagination;

  const geometers = data?.geometers ?? [];
  const missions = data?.missions ?? [];

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.success('Supprimé avec succès');
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-[#003087]">Geo</span>
            <span className="text-[#D4AF37]">Trust</span> — Géomètres &amp; Missions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérer les géomètres et les missions de vérification terrain
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total géomètres</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalGeometers ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Missions en cours</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.missionsInProgress ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Missions terminées</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.missionsCompleted ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#B8962E]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Taux de complétion</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.completionRate != null ? `${summary.completionRate}%` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'geometers'
              ? 'bg-white text-[#003087] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
          onClick={() => { setActiveTab('geometers'); setFilters((prev) => ({ ...prev, page: 1 })); }}
        >
          Géomètres
        </button>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'missions'
              ? 'bg-white text-[#003087] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
          onClick={() => { setActiveTab('missions'); setFilters((prev) => ({ ...prev, page: 1 })); }}
        >
          Missions
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={activeTab === 'geometers' ? 'Rechercher par nom, licence...' : 'Rechercher par propriété, géomètre...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'missions' && (
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))
                }
              >
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="scheduled">Planifiée</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Select
              value={filters.country || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, country: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                <SelectItem value="TG">🇹🇬 Togo</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleSearch}>
              <Filter className="w-3.5 h-3.5 mr-1" /> Filtrer
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : activeTab === 'geometers' ? (
          geometers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">Aucun géomètre trouvé</p>
              <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Géomètre</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Licence</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pays</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Spécialisations</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vérifié</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Missions</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geometers.map((geo) => (
                    <TableRow key={geo.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] text-xs font-bold shrink-0">
                            {geo.name?.charAt(0) || '?'}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{geo.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">{geo.license || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {geo.country ? `${COUNTRY_FLAGS[geo.country] || ''} ${geo.country}` : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(geo.specializations || []).slice(0, 2).map((spec) => (
                            <Badge key={spec} variant="outline" className="text-[10px]">{spec}</Badge>
                          ))}
                          {(geo.specializations || []).length > 2 && (
                            <Badge variant="outline" className="text-[10px]">+{geo.specializations.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {geo.verified ? (
                          <ShieldCheck className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{geo.missionsCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem><Eye className="w-4 h-4" /> Voir</DropdownMenuItem>
                            <DropdownMenuItem disabled={geo.verified}>
                              <CheckCircle2 className="w-4 h-4" /> Vérifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setDeleteTarget({ id: geo.id, name: geo.name }); setDeleteOpen(true); }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page + 1 }))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        ) : missions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune mission trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Propriété</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Géomètre</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date planifiée</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date complétée</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missions.map((mission) => (
                  <TableRow key={mission.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {mission.propertyTitle || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{mission.geometerName || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', MISSION_STATUS_COLORS[mission.status] || '')}>
                        {MISSION_STATUS_LABELS[mission.status] || mission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {mission.scheduledDate ? formatDate(mission.scheduledDate) : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {mission.completedDate ? formatDate(mission.completedDate) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem><Eye className="w-4 h-4" /> Voir</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget({ id: mission.id, name: mission.propertyTitle }); setDeleteOpen(true); }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page + 1 }))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer {deleteTarget?.name} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
