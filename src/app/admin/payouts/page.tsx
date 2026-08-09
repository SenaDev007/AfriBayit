'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Clock,
  CreditCard,
  AlertCircle,
  Banknote,
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
import { useAdminPayouts, useProcessPayout } from '@/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n/use-translate';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Complété',
  failed: 'Échoué',
  cancelled: 'Annulé',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
};

const METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement bancaire',
  wallet: 'Portefeuille',
  cash: 'Espèces',
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface PayoutRow {
  id: string;
  beneficiary: { id: string; name: string; email: string };
  amount: number;
  currency: string;
  method: string;
  status: string;
  scheduledDate: string;
  country: string;
  createdAt: string;
}

export default function AdminPayoutsPage() {
  const { t } = useTranslation();
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
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useAdminPayouts(filters);
  const payouts = (data?.payouts as PayoutRow[]) || [];
  const pagination = data?.pagination as { page: number; limit: number; total: number; pages: number } | undefined;
  const summary = data?.summary as {
    total: number;
    pending: number;
    completed: number;
    pendingAmount: number;
    totalAmount: number;
  } | undefined;

  const processPayout = useProcessPayout();

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleProcess = (id: string) => {
    processPayout.mutate(
      { id, action: 'process' },
      {
        onSuccess: () => toast.success(t('adminPayouts.toastProcessing', 'Paiement en cours de traitement')),
        onError: () => toast.error(t('adminPayouts.toastProcessError', 'Erreur lors du traitement')),
      }
    );
  };

  const handleCancel = () => {
    processPayout.mutate(
      { id: cancelOpen!, action: 'cancel', reason: cancelReason },
      {
        onSuccess: () => {
          toast.success(t('adminPayouts.toastCancelled', 'Paiement annulé'));
          setCancelOpen(null);
          setCancelReason('');
        },
        onError: () => toast.error(t('adminPayouts.toastCancelError', "Erreur lors de l'annulation")),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('adminPayouts.pageTitle', 'Gestion des paiements')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('adminPayouts.pageSubtitle', 'Traiter et gérer les paiements aux bénéficiaires')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">{t('adminPayouts.statTotal', 'Total')}</p>
            <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">{t('adminPayouts.statPending', 'En attente')}</p>
            <p className="text-xl font-bold text-gray-900">{summary?.pending ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">{t('adminPayouts.statCompleted', 'Complétés')}</p>
            <p className="text-xl font-bold text-gray-900">{summary?.completed ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Banknote className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">{t('adminPayouts.statPendingAmount', 'Montant en attente')}</p>
            <p className="text-sm font-bold text-gray-900">{formatXOF(summary?.pendingAmount ?? 0)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">{t('adminPayouts.statTotalAmount', 'Montant total')}</p>
            <p className="text-sm font-bold text-gray-900">{formatXOF(summary?.totalAmount ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('adminPayouts.searchPlaceholder', 'Rechercher par bénéficiaire, montant...')}
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
                <SelectValue placeholder={t('adminPayouts.placeholderStatus', 'Statut')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminPayouts.selectAllStatuses', 'Tous les statuts')}</SelectItem>
                <SelectItem value="pending">{t('adminPayouts.statusPending', 'En attente')}</SelectItem>
                <SelectItem value="processing">{t('adminPayouts.statusProcessing', 'En cours')}</SelectItem>
                <SelectItem value="completed">{t('adminPayouts.statusCompleted', 'Complété')}</SelectItem>
                <SelectItem value="failed">{t('adminPayouts.statusFailed', 'Échoué')}</SelectItem>
                <SelectItem value="cancelled">{t('adminPayouts.statusCancelled', 'Annulé')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.country || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, country: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder={t('adminPayouts.placeholderCountry', 'Pays')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminPayouts.selectAllCountries', 'Tous les pays')}</SelectItem>
                <SelectItem value="BJ">🇧🇯 {t('adminCommon.benin', 'Bénin')}</SelectItem>
                <SelectItem value="CI">🇨🇮 {t('adminCommon.coteIvoire', "Côte d'Ivoire")}</SelectItem>
                <SelectItem value="BF">🇧🇫 {t('adminCommon.burkinaFaso', 'Burkina Faso')}</SelectItem>
                <SelectItem value="TG">🇹🇬 {t('adminCommon.togo', 'Togo')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleSearch}>
              <Filter className="w-3.5 h-3.5 mr-1" /> {t('adminCommon.filter', 'Filtrer')}
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
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">{t('adminPayouts.empty', 'Aucun paiement trouvé')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('adminPayouts.modifyFilters', 'Modifiez vos filtres')}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminPayouts.colBeneficiary', 'Bénéficiaire')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminPayouts.colAmount', 'Montant')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminPayouts.colCurrency', 'Devise')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminPayouts.colMethod', 'Méthode')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminPayouts.colStatus', 'Statut')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminPayouts.colScheduledDate', 'Date prévue')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">{t('adminPayouts.colActions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#003087]/10 flex items-center justify-center text-[9px] font-bold text-[#003087]">
                          {payout.beneficiary?.name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{payout.beneficiary?.name || '—'}</p>
                          <p className="text-[11px] text-gray-400 truncate">{payout.beneficiary?.email || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono font-medium text-gray-900">{formatXOF(payout.amount)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{payout.currency || 'XOF'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {METHOD_LABELS[payout.method] || payout.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[payout.status] || '')}>
                        {STATUS_LABELS[payout.status] || payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(payout.scheduledDate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setDetailsOpen(payout.id)}>
                            <Eye className="w-4 h-4" /> {t('adminPayouts.actionViewDetails', 'Voir détails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleProcess(payout.id)}
                            disabled={payout.status !== 'pending'}
                          >
                            <CheckCircle2 className="w-4 h-4" /> {t('adminPayouts.actionProcess', 'Traiter')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCancelOpen(payout.id)}
                            disabled={payout.status === 'completed' || payout.status === 'cancelled'}
                          >
                            <XCircle className="w-4 h-4" /> {t('adminPayouts.actionCancel', 'Annuler')}
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

      {/* Details Dialog */}
      <Dialog open={!!detailsOpen} onOpenChange={() => setDetailsOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPayouts.dialogDetails', 'Détails du paiement')}</DialogTitle>
            <DialogDescription>{t('adminPayouts.dialogDetailsDesc', 'Informations détaillées sur le paiement')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {payouts.find((p) => p.id === detailsOpen) && (() => {
              const payout = payouts.find((p) => p.id === detailsOpen)!;
              return (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{t('adminPayouts.detailBeneficiary', 'Bénéficiaire')}</span>
                    <span className="font-medium">{payout.beneficiary?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{t('adminPayouts.detailAmount', 'Montant')}</span>
                    <span className="font-mono font-medium">{formatXOF(payout.amount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{t('adminPayouts.detailCurrency', 'Devise')}</span>
                    <span className="font-medium">{payout.currency || 'XOF'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{t('adminPayouts.detailMethod', 'Méthode')}</span>
                    <span className="font-medium">{METHOD_LABELS[payout.method] || payout.method}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{t('adminPayouts.detailStatus', 'Statut')}</span>
                    <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[payout.status] || '')}>
                      {STATUS_LABELS[payout.status] || payout.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{t('adminPayouts.detailScheduledDate', 'Date prévue')}</span>
                    <span className="font-medium">{formatDate(payout.scheduledDate)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">{t('adminPayouts.detailCountry', 'Pays')}</span>
                    <span>{payout.country ? `${COUNTRY_FLAGS[payout.country] || ''} ${payout.country}` : '—'}</span>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(null)}>{t('adminPayouts.btnClose', 'Fermer')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelOpen} onOpenChange={() => setCancelOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminPayouts.dialogCancel', 'Annuler le paiement')}</DialogTitle>
            <DialogDescription>{t('adminPayouts.dialogCancelDesc', "Indiquez la raison de l'annulation")}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('adminPayouts.placeholderCancelReason', "Raison de l'annulation...")}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(null)}>{t('adminPayouts.btnCancel', 'Annuler')}</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={processPayout.isPending}>
              {processPayout.isPending ? t('adminPayouts.btnCancelling', 'Annulation...') : t('adminPayouts.btnConfirmCancel', "Confirmer l'annulation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
