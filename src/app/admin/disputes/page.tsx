'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  Shield,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Scale,
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
import { useAdminDisputes, useResolveDispute, useEscalateDispute } from '@/hooks/useAdmin';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  mediation: 'En médiation',
  escalated: 'Escaladé',
  resolved: 'Résolu',
  closed: 'Fermé',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-50 text-red-600 border-red-200',
  mediation: 'bg-amber-50 text-amber-700 border-amber-200',
  escalated: 'bg-purple-50 text-purple-700 border-purple-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STEP_LABELS: Record<string, string> = {
  initial: 'Initial',
  review: 'Examen',
  mediation: 'Médiation',
  escalation: 'Escalade',
  resolution: 'Résolution',
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface DisputeRow {
  id: string;
  transactionId: string;
  buyer: { id: string; name: string };
  seller: { id: string; name: string };
  amount: number;
  currency: string;
  reason: string;
  step: string;
  status: string;
  country: string;
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [filters, setFilters] = useState<{
    status?: string;
    country?: string;
    search?: string;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [resolveOpen, setResolveOpen] = useState<string | null>(null);
  const [buyerPercentage, setBuyerPercentage] = useState(50);
  const [sellerPercentage, setSellerPercentage] = useState(50);
  const [resolutionText, setResolutionText] = useState('');
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);

  const { data, isLoading } = useAdminDisputes(filters);
  const disputes = (data?.disputes as DisputeRow[]) || [];
  const pagination = data?.pagination as { page: number; limit: number; total: number; pages: number } | undefined;
  const summary = data?.summary as {
    total: number;
    open: number;
    mediation: number;
    resolved: number;
  } | undefined;

  const resolveDispute = useResolveDispute();
  const escalateDispute = useEscalateDispute();

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleBuyerPercentageChange = (value: number) => {
    setBuyerPercentage(value);
    setSellerPercentage(100 - value);
  };

  const handleSellerPercentageChange = (value: number) => {
    setSellerPercentage(value);
    setBuyerPercentage(100 - value);
  };

  const handleResolve = () => {
    if (buyerPercentage + sellerPercentage !== 100) {
      toast.error('Les pourcentages doivent totaliser 100%');
      return;
    }
    resolveDispute.mutate(
      {
        id: resolveOpen!,
        buyerPercentage,
        sellerPercentage,
        resolution: resolutionText,
      },
      {
        onSuccess: () => {
          toast.success('Litige résolu avec succès');
          setResolveOpen(null);
          setBuyerPercentage(50);
          setSellerPercentage(50);
          setResolutionText('');
        },
        onError: () => toast.error('Erreur lors de la résolution'),
      }
    );
  };

  const handleEscalate = (id: string) => {
    escalateDispute.mutate(
      { id },
      {
        onSuccess: () => toast.success('Litige escaladé'),
        onError: () => toast.error('Erreur lors de l\'escalade'),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des litiges</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Examiner, escalader et résoudre les litiges entre acheteurs et vendeurs
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total litiges</p>
            <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Ouverts</p>
            <p className="text-xl font-bold text-gray-900">{summary?.open ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">En médiation</p>
            <p className="text-xl font-bold text-gray-900">{summary?.mediation ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Résolus</p>
            <p className="text-xl font-bold text-gray-900">{summary?.resolved ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par transaction, acheteur, vendeur..."
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
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="mediation">En médiation</SelectItem>
                <SelectItem value="escalated">Escaladé</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
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
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun litige trouvé</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Transaction</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Acheteur</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Vendeur</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Montant</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Raison</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Étape</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-mono text-gray-900">
                      {dispute.transactionId?.slice(0, 8) || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#003087]/10 flex items-center justify-center text-[9px] font-bold text-[#003087]">
                          {dispute.buyer?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">{dispute.buyer?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[9px] font-bold text-[#D4AF37]">
                          {dispute.seller?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">{dispute.seller?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-900">{formatXOF(dispute.amount)}</TableCell>
                    <TableCell>
                      <p className="text-xs text-gray-600 truncate max-w-[120px]">{dispute.reason || '—'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {STEP_LABELS[dispute.step] || dispute.step}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[dispute.status] || '')}>
                        {STATUS_LABELS[dispute.status] || dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDate(dispute.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setDetailsOpen(dispute.id)}>
                            <Eye className="w-4 h-4" /> Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEscalate(dispute.id)}
                            disabled={dispute.status === 'escalated' || dispute.status === 'resolved'}
                          >
                            <AlertTriangle className="w-4 h-4" /> Escalader
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setResolveOpen(dispute.id);
                              setBuyerPercentage(50);
                              setSellerPercentage(50);
                              setResolutionText('');
                            }}
                            disabled={dispute.status === 'resolved'}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Résoudre
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
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
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

      {/* Resolve Dialog */}
      <Dialog open={!!resolveOpen} onOpenChange={() => setResolveOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Résoudre le litige</DialogTitle>
            <DialogDescription>Définissez la répartition du montant entre l&apos;acheteur et le vendeur</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Buyer percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Part acheteur</label>
                <span className={cn(
                  'text-lg font-bold',
                  buyerPercentage < 30 ? 'text-red-600' : buyerPercentage > 70 ? 'text-green-600' : 'text-[#003087]'
                )}>
                  {buyerPercentage}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={buyerPercentage}
                onChange={(e) => handleBuyerPercentageChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[#003087]"
              />
            </div>

            {/* Seller percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Part vendeur</label>
                <span className={cn(
                  'text-lg font-bold',
                  sellerPercentage < 30 ? 'text-red-600' : sellerPercentage > 70 ? 'text-green-600' : 'text-[#D4AF37]'
                )}>
                  {sellerPercentage}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={sellerPercentage}
                onChange={(e) => handleSellerPercentageChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 accent-[#D4AF37]"
              />
            </div>

            {/* Total indicator */}
            <div className={cn(
              'text-center py-2 rounded-lg text-sm font-medium',
              buyerPercentage + sellerPercentage === 100
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            )}>
              Total : {buyerPercentage + sellerPercentage}%
              {buyerPercentage + sellerPercentage !== 100 && ' (doit être 100%)'}
            </div>

            {/* Resolution text */}
            <div>
              <label className="text-sm font-medium text-gray-700">Texte de résolution</label>
              <Textarea
                placeholder="Expliquez la décision de résolution..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(null)}>Annuler</Button>
            <Button
              className="bg-[#003087] hover:bg-[#003087]/90"
              onClick={handleResolve}
              disabled={buyerPercentage + sellerPercentage !== 100 || resolveDispute.isPending}
            >
              {resolveDispute.isPending ? 'Résolution...' : 'Résoudre le litige'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={!!detailsOpen} onOpenChange={() => setDetailsOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du litige</DialogTitle>
            <DialogDescription>Informations détaillées sur le litige</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {disputes.find((d) => d.id === detailsOpen) && (
              <>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">ID Transaction</span>
                  <span className="font-mono font-medium">{disputes.find((d) => d.id === detailsOpen)!.transactionId?.slice(0, 12) || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Acheteur</span>
                  <span className="font-medium">{disputes.find((d) => d.id === detailsOpen)!.buyer?.name || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Vendeur</span>
                  <span className="font-medium">{disputes.find((d) => d.id === detailsOpen)!.seller?.name || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Montant</span>
                  <span className="font-mono font-medium">{formatXOF(disputes.find((d) => d.id === detailsOpen)!.amount)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Raison</span>
                  <span className="font-medium">{disputes.find((d) => d.id === detailsOpen)!.reason || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Étape</span>
                  <Badge variant="outline" className="text-[10px]">
                    {STEP_LABELS[disputes.find((d) => d.id === detailsOpen)!.step] || disputes.find((d) => d.id === detailsOpen)!.step}
                  </Badge>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Statut</span>
                  <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[disputes.find((d) => d.id === detailsOpen)!.status] || '')}>
                    {STATUS_LABELS[disputes.find((d) => d.id === detailsOpen)!.status] || disputes.find((d) => d.id === detailsOpen)!.status}
                  </Badge>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
