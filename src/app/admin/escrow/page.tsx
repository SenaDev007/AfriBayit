'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Wallet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Lock,
  ArrowLeftRight,
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
import {
  useAdminEscrow,
  useEscrowTransition,
  type AdminEscrowAccount,
} from '@/hooks/useAdmin';

const ESCROW_STATUS_LABELS: Record<string, string> = {
  EMPTY: 'Vide',
  FUNDED: 'Financé',
  PARTIAL_RELEASE: 'Libération partielle',
  FULL_RELEASE: 'Libéré',
  REFUNDED: 'Remboursé',
  DISPUTED: 'Litige',
};

const TX_STATUS_LABELS: Record<string, string> = {
  CREATED: 'Créé',
  FUNDED: 'Financé',
  DOCS_VALIDATED: 'Docs validés',
  GEOTRUST_VALIDATED: 'GeoTrust validé',
  NOTARY_ASSIGNED: 'Notaire assigné',
  NOTARY_IN_PROGRESS: 'Notaire en cours',
  DEED_SIGNED: 'Acte signé',
  ANDF_REGISTERED: 'ANDF enregistré',
  RELEASED: 'Libéré',
  DISPUTED: 'Litige',
  REFUNDED: 'Remboursé',
  EXPIRED: 'Expiré',
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Valid transition options for admin force
const ADMIN_TRANSITIONS = [
  { value: 'FUNDED', label: 'Financé' },
  { value: 'DOCS_VALIDATED', label: 'Docs validés' },
  { value: 'GEOTRUST_VALIDATED', label: 'GeoTrust validé' },
  { value: 'NOTARY_ASSIGNED', label: 'Notaire assigné' },
  { value: 'NOTARY_IN_PROGRESS', label: 'Notaire en cours' },
  { value: 'DEED_SIGNED', label: 'Acte signé' },
  { value: 'ANDF_REGISTERED', label: 'ANDF enregistré' },
  { value: 'RELEASED', label: 'Libéré' },
  { value: 'DISPUTED', label: 'Litige' },
  { value: 'REFUNDED', label: 'Remboursé' },
];

export default function AdminEscrowPage() {
  const [filters, setFilters] = useState<{ status?: string; country?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useAdminEscrow(filters);
  const accounts = data?.accounts || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Escrow</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Suivi des comptes escrow et résolution des litiges
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total détenu</p>
            <p className="text-lg font-bold text-gray-900">{formatXOF(summary?.totalHeld ?? 0)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Litiges actifs</p>
            <p className="text-lg font-bold text-gray-900">{summary?.activeDisputes ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Libérés aujourd&apos;hui</p>
            <p className="text-lg font-bold text-gray-900">{summary?.releasedToday ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Temps moyen détenu</p>
            <p className="text-lg font-bold text-gray-900">{summary?.avgHoldTimeHours ?? 0}h</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par réf. transaction..."
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
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EMPTY">Vide</SelectItem>
                <SelectItem value="FUNDED">Financé</SelectItem>
                <SelectItem value="PARTIAL_RELEASE">Libération partielle</SelectItem>
                <SelectItem value="FULL_RELEASE">Libéré</SelectItem>
                <SelectItem value="REFUNDED">Remboursé</SelectItem>
                <SelectItem value="DISPUTED">Litige</SelectItem>
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
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun compte escrow</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Réf. Transaction
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Propriété
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Montant
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut Escrow
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Acheteur
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Vendeur
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <EscrowRow key={account.id} account={account} />
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
                  <span className="text-xs text-gray-500 px-2">
                    {pagination.page} / {pagination.pages}
                  </span>
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
    </div>
  );
}

function EscrowRow({ account }: { account: AdminEscrowAccount }) {
  const [forceTransitionOpen, setForceTransitionOpen] = useState(false);
  const [resolveDisputeOpen, setResolveDisputeOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [reason, setReason] = useState('');

  const tx = account.transaction;
  const escrowTransition = useEscrowTransition(tx?.id || '');

  const isDisputed = account.status === 'DISPUTED' || tx?.status === 'DISPUTED';

  const handleForceTransition = () => {
    if (!targetStatus) return;
    escrowTransition.mutate(
      { targetStatus, actorType: 'admin', reason: reason || undefined },
      {
        onSuccess: () => {
          toast.success(`Transition vers ${TX_STATUS_LABELS[targetStatus] || targetStatus} effectuée`);
          setForceTransitionOpen(false);
          setTargetStatus('');
          setReason('');
        },
        onError: (err: Error) => toast.error(err.message || 'Erreur de transition'),
      }
    );
  };

  const handleResolveDispute = () => {
    if (!targetStatus) return;
    escrowTransition.mutate(
      { targetStatus, actorType: 'admin', reason: reason || 'Résolution admin du litige' },
      {
        onSuccess: () => {
          toast.success('Litige résolu');
          setResolveDisputeOpen(false);
          setTargetStatus('');
          setReason('');
        },
        onError: (err: Error) => toast.error(err.message || 'Erreur'),
      }
    );
  };

  return (
    <>
      <TableRow className={cn('hover:bg-gray-50/50', isDisputed && 'bg-red-50/30')}>
        <TableCell>
          <div className="flex items-center gap-2">
            {isDisputed && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
            <span className="text-sm font-mono text-gray-900">
              {tx?.escrowReference || (tx?.id as string)?.slice(0, 10) || '—'}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
              {tx?.property?.title || '—'}
            </p>
            {tx?.property && (
              <p className="text-[11px] text-gray-400">
                {tx.property.city}{tx.property.country ? ` · ${COUNTRY_FLAGS[tx.property.country] || ''} ${tx.property.country}` : ''}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div>
            <p className="text-sm font-bold text-gray-900">{formatXOF(account.heldAmount)}</p>
            <p className="text-[11px] text-gray-400">
              Bloqué: {formatXOF(account.heldAmount)} | Libéré: {formatXOF(account.releasedAmount)}
            </p>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px]',
                isDisputed ? 'bg-red-50 text-red-600 border-red-200' :
                account.status === 'FULL_RELEASE' ? 'bg-green-50 text-green-700 border-green-200' :
                account.status === 'FUNDED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
              )}
            >
              {ESCROW_STATUS_LABELS[account.status] || account.status}
            </Badge>
            <p className="text-[10px] text-gray-400">
              TX: {TX_STATUS_LABELS[tx?.status || ''] || tx?.status || '—'}
            </p>
          </div>
        </TableCell>
        <TableCell className="text-sm text-gray-600">{tx?.buyer?.name || '—'}</TableCell>
        <TableCell className="text-sm text-gray-600">
          {(tx as Record<string, unknown>)?.seller as Record<string, unknown> | null
            ? ((tx as Record<string, unknown>).seller as Record<string, unknown>)?.name as string
            : '—'}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem>
                <Eye className="w-4 h-4" /> Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setForceTransitionOpen(true)}>
                <ArrowRight className="w-4 h-4" /> Forcer transition
              </DropdownMenuItem>
              {isDisputed && (
                <DropdownMenuItem onClick={() => { setTargetStatus('FUNDED'); setResolveDisputeOpen(true); }} className="text-green-600">
                  <ShieldAlert className="w-4 h-4" /> Résoudre litige
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Force Transition Dialog */}
      <Dialog open={forceTransitionOpen} onOpenChange={setForceTransitionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forcer une transition</DialogTitle>
            <DialogDescription>
              Transition admin pour la transaction {(tx?.id as string)?.slice(0, 8)}...
              <br />
              État actuel : <strong>{TX_STATUS_LABELS[tx?.status || ''] || tx?.status}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={targetStatus} onValueChange={setTargetStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'état cible" />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_TRANSITIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Raison (optionnel)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceTransitionOpen(false)}>Annuler</Button>
            <Button
              className="bg-[#003087] hover:bg-[#002a70]"
              onClick={handleForceTransition}
              disabled={!targetStatus || escrowTransition.isPending}
            >
              {escrowTransition.isPending ? 'Transition...' : 'Forcer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={resolveDisputeOpen} onOpenChange={setResolveDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre le litige</DialogTitle>
            <DialogDescription>
              Décider de l&apos;issue du litige pour cette transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={targetStatus === 'FUNDED' ? 'default' : 'outline'}
                className={cn(targetStatus === 'FUNDED' && 'bg-green-600 hover:bg-green-700')}
                onClick={() => setTargetStatus('FUNDED')}
              >
                <ArrowLeftRight className="w-4 h-4 mr-1.5" />
                Retour à Financé
              </Button>
              <Button
                variant={targetStatus === 'REFUNDED' ? 'default' : 'outline'}
                className={cn(targetStatus === 'REFUNDED' && 'bg-red-600 hover:bg-red-700')}
                onClick={() => setTargetStatus('REFUNDED')}
              >
                Rembourser
              </Button>
            </div>
            <Textarea
              placeholder="Raison de la résolution..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDisputeOpen(false)}>Annuler</Button>
            <Button
              className={cn(
                targetStatus === 'REFUNDED' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              )}
              onClick={handleResolveDispute}
              disabled={!targetStatus || escrowTransition.isPending}
            >
              {escrowTransition.isPending ? 'Résolution...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
