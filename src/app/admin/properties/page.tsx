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
  Clock,
  Building2,
  CheckCircle,
  XCircle as XCircleIcon,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useAdminProperties, useUpdateProperty } from '@/hooks/useAdmin';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  ai_review: 'Revue IA',
  human_review: 'Revue humaine',
  published: 'Publiée',
  sold: 'Vendue',
  rented: 'Louée',
  rejected: 'Rejetée',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  ai_review: 'bg-blue-50 text-blue-700 border-blue-200',
  human_review: 'bg-purple-50 text-purple-700 border-purple-200',
  published: 'bg-green-50 text-green-700 border-green-200',
  sold: 'bg-[#D4AF37]/10 text-[#B8962E] border-[#D4AF37]/30',
  rented: 'bg-[#009CDE]/10 text-[#009CDE] border-[#009CDE]/30',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
  appartement: 'Appartement',
  terrain: 'Terrain',
  bureau: 'Bureau',
  commerce: 'Commerce',
  chambre: 'Chambre',
  guesthouse: 'Guesthouse',
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

interface PropertyRow {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  country: string;
  city: string;
  status: string;
  verified: boolean;
  premium: boolean;
  images: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    verified: boolean;
  };
  legalDocs: Array<{ id: string; docType: string; status: string; aiScore: number | null }>;
  _count: { propertyImages: number; geoInspections: number };
}

export default function AdminPropertiesPage() {
  const [filters, setFilters] = useState<{ status?: string; country?: string; search?: string; page: number; limit: number; type?: string; transaction?: string }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | null>(null);

  const { data, isLoading } = useAdminProperties(filters);
  const properties = (data?.properties as PropertyRow[]) || [];
  const pagination = data?.pagination as { page: number; limit: number; total: number; pages: number } | undefined;
  const summary = data?.summary as { pending: number; flagged: number; published: number } | undefined;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === properties.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(properties.map((p) => p.id)));
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération des propriétés</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Valider, rejeter et gérer les annonces immobilières
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publiées aujourd&apos;hui</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.published ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <XCircleIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Rejetées</p>
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
              placeholder="Rechercher par titre, ville, quartier..."
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
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="ai_review">Revue IA</SelectItem>
                <SelectItem value="human_review">Revue humaine</SelectItem>
                <SelectItem value="published">Publiée</SelectItem>
                <SelectItem value="rejected">Rejetée</SelectItem>
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

        {/* Batch Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{selected.size} sélectionnée(s)</span>
            <Button
              size="sm"
              className="text-xs bg-green-600 hover:bg-green-700 h-8"
              onClick={() => setBatchAction('approve')}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Approuver
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 h-8"
              onClick={() => setBatchAction('reject')}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Rejeter
            </Button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
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
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selected.size === properties.length && properties.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Propriété
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Prix
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pays
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Agent
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((prop) => (
                  <PropertyRow
                    key={prop.id}
                    property={prop}
                    selected={selected.has(prop.id)}
                    onToggle={() => toggleSelect(prop.id)}
                  />
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

      {/* Batch Action Dialog */}
      <Dialog open={!!batchAction} onOpenChange={() => setBatchAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {batchAction === 'approve' ? 'Approuver' : 'Rejeter'} les propriétés sélectionnées
            </DialogTitle>
            <DialogDescription>
              {selected.size} propriété(s) seront {batchAction === 'approve' ? 'approuvées' : 'rejetées'}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchAction(null)}>
              Annuler
            </Button>
            <Button
              className={batchAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              onClick={() => {
                toast.success(`${selected.size} propriété(s) ${batchAction === 'approve' ? 'approuvée(s)' : 'rejetée(s)'}`);
                setSelected(new Set());
                setBatchAction(null);
              }}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PropertyRow({
  property,
  selected,
  onToggle,
}: {
  property: PropertyRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const updateProperty = useUpdateProperty(property.id);

  const handleApprove = () => {
    updateProperty.mutate(
      { status: 'published', publishedAt: new Date().toISOString() },
      {
        onSuccess: () => toast.success('Propriété approuvée'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleReject = () => {
    updateProperty.mutate(
      { status: 'rejected', rejectionReason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Propriété rejetée');
          setRejectOpen(false);
          setRejectReason('');
        },
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleFeature = () => {
    updateProperty.mutate(
      { premium: !property.premium },
      {
        onSuccess: () => toast.success(property.premium ? 'Mis en avant retiré' : 'Mis en avant'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleDelete = () => {
    updateProperty.mutate(
      { status: 'rejected' },
      {
        onSuccess: () => toast.success('Propriété supprimée'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  // Parse images for thumbnail
  let imageUrls: string[] = [];
  try {
    imageUrls = property.images ? JSON.parse(property.images) : [];
  } catch { /* empty */ }

  return (
    <>
      <TableRow className={cn('hover:bg-gray-50/50', selected && 'bg-[#003087]/5')}>
        <TableCell>
          <Checkbox checked={selected} onCheckedChange={onToggle} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
              {imageUrls.length > 0 ? (
                <ImageWithFallback src={imageUrls[0]} alt="" className="w-full h-full" fallbackType="property" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{property.title}</p>
              <p className="text-[11px] text-gray-400 truncate">
                {property.city}{property.country ? ` · ${COUNTRY_FLAGS[property.country] || ''} ${property.country}` : ''}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-[11px]">
            {TYPE_LABELS[property.type] || property.type}
          </Badge>
        </TableCell>
        <TableCell className="text-sm font-mono text-gray-900">{formatXOF(property.price)}</TableCell>
        <TableCell className="text-sm">
          {property.country ? `${COUNTRY_FLAGS[property.country] || ''} ${property.country}` : '—'}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[property.status] || '')}>
            {STATUS_LABELS[property.status] || property.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#003087]/10 flex items-center justify-center text-[9px] font-bold text-[#003087]">
              {property.owner?.name?.charAt(0) || '?'}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[80px]">{property.owner?.name || '—'}</span>
          </div>
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
              <DropdownMenuItem onClick={handleApprove} disabled={property.status === 'published'}>
                <CheckCircle2 className="w-4 h-4" /> Approuver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRejectOpen(true)} disabled={property.status === 'rejected'}>
                <XCircle className="w-4 h-4" /> Rejeter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFeature}>
                <Star className="w-4 h-4" /> {property.premium ? 'Retirer mise en avant' : 'Mettre en avant'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la propriété</DialogTitle>
            <DialogDescription>Indiquez la raison du rejet</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={updateProperty.isPending}>
              {updateProperty.isPending ? 'Rejet...' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
