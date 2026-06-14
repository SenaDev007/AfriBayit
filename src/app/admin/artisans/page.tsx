'use client';

import React, { useState, useCallback } from 'react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  Clock,
  Globe2,
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdminArtisans, useAdminAction } from '@/hooks/useAdmin';

const STATUS_LABELS: Record<string, string> = {
  verified: 'Vérifié',
  pending: 'En attente',
  rejected: 'Rejeté',
};

const STATUS_COLORS: Record<string, string> = {
  verified: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface ArtisanRow {
  id: string;
  name: string;
  avatar: string | null;
  specialty: string;
  country: string;
  city: string;
  rating: number;
  verified: boolean;
  status: string;
}

export default function AdminArtisansPage() {
  const [filters, setFilters] = useState<{ status?: string; country?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ArtisanRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArtisanRow | null>(null);

  const { data, isLoading } = useAdminArtisans(filters);
  const adminAction = useAdminAction();
  const artisans = data?.artisans ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleVerify = (artisan: ArtisanRow) => {
    adminAction.mutate(
      { path: `/api/artisans/${artisan.id}`, method: 'patch', data: { verified: true, status: 'verified' } },
      {
        onSuccess: () => toast.success('Artisan vérifié avec succès'),
        onError: () => toast.error('Erreur lors de la vérification'),
      }
    );
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    adminAction.mutate(
      { path: `/api/artisans/${rejectTarget.id}`, method: 'patch', data: { verified: false, status: 'rejected' } },
      {
        onSuccess: () => {
          toast.success('Artisan rejeté');
          setRejectOpen(false);
          setRejectTarget(null);
          setRejectReason('');
        },
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.success('Artisan supprimé');
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn('w-3 h-3', s <= Math.round(rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300')}
          />
        ))}
        <span className="text-[11px] text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des artisans</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Vérifier, approuver et gérer les artisans de la plateforme
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
            <p className="text-xs text-gray-500 uppercase">Total artisans</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.total ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Vérifiés</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.verified ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">En attente</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.pending ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Globe2 className="w-5 h-5 text-[#B8962E]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Par pays</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.byCountry ? Object.keys(summary.byCountry).length : 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, spécialité, ville..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
                <SelectItem value="verified">Vérifié</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
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
        ) : artisans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun artisan trouvé</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Artisan
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Spécialité
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pays
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Ville
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Note
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Vérifié
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artisans.map((artisan) => (
                  <TableRow key={artisan.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
                          {artisan.avatar ? (
                            <ImageWithFallback src={artisan.avatar} alt="" className="w-full h-full" fallbackType="avatar" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#003087]/10 text-[#003087] text-xs font-bold">
                              {artisan.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{artisan.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{artisan.specialty}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {artisan.specialty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {artisan.country ? `${COUNTRY_FLAGS[artisan.country] || ''} ${artisan.country}` : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{artisan.city || '—'}</TableCell>
                    <TableCell>{renderStars(artisan.rating)}</TableCell>
                    <TableCell>
                      {artisan.verified ? (
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-300" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[artisan.status] || '')}>
                        {STATUS_LABELS[artisan.status] || artisan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVerify(artisan)}
                            disabled={artisan.verified || artisan.status === 'verified'}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approuver / Vérifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setRejectTarget(artisan); setRejectOpen(true); }}
                            disabled={artisan.status === 'rejected'}
                          >
                            <XCircle className="w-4 h-4" /> Rejeter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget(artisan); setDeleteOpen(true); }}
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

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                  {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l&apos;artisan</DialogTitle>
            <DialogDescription>Indiquez la raison du rejet pour {rejectTarget?.name}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject}>
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;artisan</DialogTitle>
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
