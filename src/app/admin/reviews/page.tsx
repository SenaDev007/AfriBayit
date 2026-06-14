'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  AlertTriangle,
  Award,
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
import { useAdminReviews } from '@/hooks/useAdmin';

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface ReviewRow {
  id: string;
  userName: string;
  propertyTitle: string;
  rating: number;
  comment: string;
  country: string;
  createdAt: string;
  flagged: boolean;
  hidden: boolean;
}

export default function AdminReviewsPage() {
  const [filters, setFilters] = useState<{ country?: string; rating?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null);

  const { data, isLoading } = useAdminReviews(filters);
  const reviews = data?.reviews ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleApprove = (review: ReviewRow) => {
    toast.success(`Avis approuvé`);
  };

  const handleHide = (review: ReviewRow) => {
    toast.success(review.hidden ? 'Avis rendu visible' : 'Avis masqué');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.success('Avis supprimé');
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn('w-3.5 h-3.5', s <= Math.round(rating) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300')}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const truncate = (str: string, maxLen: number) => {
    if (!str) return '—';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des avis</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Modérer et gérer les avis des utilisateurs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total avis</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.total ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-[#B8962E]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Note moyenne</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.avgRating?.toFixed(1) ?? '—'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Star className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">5 étoiles</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.fiveStars ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Signalés</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.flagged ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par utilisateur, propriété..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.rating || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, rating: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
                <SelectItem value="4">4 étoiles</SelectItem>
                <SelectItem value="3">3 étoiles</SelectItem>
                <SelectItem value="2">2 étoiles</SelectItem>
                <SelectItem value="1">1 étoile</SelectItem>
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
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun avis trouvé</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Utilisateur
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Propriété
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Note
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Commentaire
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Signalé
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id} className={cn('hover:bg-gray-50/50', review.flagged && 'bg-red-50/30')}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] text-[11px] font-bold shrink-0">
                          {review.userName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{review.userName || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 truncate max-w-[160px]">{review.propertyTitle || '—'}</TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px]">
                      <span className={cn(review.hidden && 'line-through text-gray-400')}>
                        {truncate(review.comment, 60)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(review.createdAt)}</TableCell>
                    <TableCell>
                      {review.flagged ? (
                        <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                          Signalé
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
                          <DropdownMenuItem onClick={() => handleApprove(review)}>
                            <CheckCircle2 className="w-4 h-4" /> Approuver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleHide(review)}>
                            <EyeOff className="w-4 h-4" /> {review.hidden ? 'Rendre visible' : 'Masquer'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget(review); setDeleteOpen(true); }}
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

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;avis</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.
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
