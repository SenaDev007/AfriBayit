'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  DollarSign,
  Award,
  Megaphone,
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
import { useAdminAmbassadors } from '@/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n/use-translate';

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

const TIER_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine',
};

const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-orange-50 text-orange-700 border-orange-200',
  silver: 'bg-gray-100 text-gray-700 border-gray-300',
  gold: 'bg-[#D4AF37]/10 text-[#B8962E] border-[#D4AF37]/30',
  platinum: 'bg-purple-50 text-purple-700 border-purple-200',
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
};

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  cancelled: 'Annulée',
};

const COMMISSION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const AMBASSADOR_STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu',
};

const AMBASSADOR_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
};

interface AmbassadorRow {
  id: string;
  name: string;
  email: string;
  country: string;
  tier: string;
  referrals: number;
  earnings: number;
  status: string;
}

interface CommissionRow {
  id: string;
  ambassadorName: string;
  referralName: string;
  amount: number;
  status: string;
  date: string;
}

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

export default function AdminAmbassadorsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ambassadors' | 'commissions'>('ambassadors');
  const [filters, setFilters] = useState<{ tier?: string; status?: string; country?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useAdminAmbassadors({ ...filters, tab: activeTab });
  const summary = data?.summary;
  const pagination = data?.pagination;

  const ambassadors = data?.ambassadors ?? [];
  const commissions = data?.commissions ?? [];

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.success(t('adminCommon.deletedSuccess', 'Supprimé avec succès'));
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
          <h1 className="text-2xl font-bold text-gray-900">{t('adminAmbassadors.pageTitle', 'Programme Ambassadeurs')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('adminAmbassadors.pageSubtitle', 'Gérer les ambassadeurs et les commissions de parrainage')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">{t('adminAmbassadors.statTotal', 'Total ambassadeurs')}</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalAmbassadors ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#B8962E]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">{t('adminAmbassadors.statCommissions', 'Commissions totales')}</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalCommissions ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">{t('adminAmbassadors.statEarnings', 'Revenus totaux')}</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.totalEarnings != null ? formatXOF(summary.totalEarnings) : '—'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">{t('adminAmbassadors.statByTier', 'Par tier')}</p>
            <div className="flex items-center gap-1">
              {summary?.byTier && Object.entries(summary.byTier).map(([tier, count]) => (
                <span key={tier} className="text-xs" title={TIER_LABELS[tier] || tier}>
                  {TIER_ICONS[tier]}{count}
                </span>
              ))}
              {!summary?.byTier && <span className="text-2xl font-bold text-gray-900">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'ambassadors'
              ? 'bg-white text-[#003087] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
          onClick={() => { setActiveTab('ambassadors'); setFilters((prev) => ({ ...prev, page: 1 })); }}
        >
          {t('adminAmbassadors.tabAmbassadors', 'Ambassadeurs')}
        </button>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'commissions'
              ? 'bg-white text-[#003087] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
          onClick={() => { setActiveTab('commissions'); setFilters((prev) => ({ ...prev, page: 1 })); }}
        >
          {t('adminAmbassadors.tabCommissions', 'Commissions')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={activeTab === 'ambassadors' ? t('adminAmbassadors.searchAmbassadors', 'Rechercher par nom, email...') : t('adminAmbassadors.searchCommissions', 'Rechercher par ambassadeur, filleul...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'ambassadors' && (
              <>
                <Select
                  value={filters.tier || 'all'}
                  onValueChange={(v) =>
                    setFilters((prev) => ({ ...prev, tier: v === 'all' ? undefined : v, page: 1 }))
                  }
                >
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder={t('adminAmbassadors.placeholderTier', 'Tier')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('adminAmbassadors.selectAllTiers', 'Tous les tiers')}</SelectItem>
                    <SelectItem value="bronze">🥉 {t('adminAmbassadors.tierBronze', 'Bronze')}</SelectItem>
                    <SelectItem value="silver">🥈 {t('adminAmbassadors.tierSilver', 'Argent')}</SelectItem>
                    <SelectItem value="gold">🥇 {t('adminAmbassadors.tierGold', 'Or')}</SelectItem>
                    <SelectItem value="platinum">💎 {t('adminAmbassadors.tierPlatinum', 'Platine')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(v) =>
                    setFilters((prev) => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))
                  }
                >
                  <SelectTrigger className="w-[130px] h-9 text-xs">
                    <SelectValue placeholder={t('adminAmbassadors.placeholderStatus', 'Statut')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('adminAmbassadors.selectAllStatuses', 'Tous les statuts')}</SelectItem>
                    <SelectItem value="active">{t('adminAmbassadors.statusActive', 'Actif')}</SelectItem>
                    <SelectItem value="inactive">{t('adminAmbassadors.statusInactive', 'Inactif')}</SelectItem>
                    <SelectItem value="suspended">{t('adminAmbassadors.statusSuspended', 'Suspendu')}</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {activeTab === 'commissions' && (
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) =>
                  setFilters((prev) => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))
                }
              >
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder={t('adminAmbassadors.placeholderStatus', 'Statut')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminAmbassadors.selectAllStatuses', 'Tous les statuts')}</SelectItem>
                  <SelectItem value="pending">{t('adminAmbassadors.commissionPending', 'En attente')}</SelectItem>
                  <SelectItem value="paid">{t('adminAmbassadors.commissionPaid', 'Payée')}</SelectItem>
                  <SelectItem value="cancelled">{t('adminAmbassadors.commissionCancelled', 'Annulée')}</SelectItem>
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
                <SelectValue placeholder={t('adminAmbassadors.placeholderCountry', 'Pays')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminAmbassadors.selectAllCountries', 'Tous les pays')}</SelectItem>
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
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : activeTab === 'ambassadors' ? (
          ambassadors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Megaphone className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">{t('adminAmbassadors.emptyAmbassadors', 'Aucun ambassadeur trouvé')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('adminCommon.modifyFilters', 'Modifiez vos filtres')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colAmbassador', 'Ambassadeur')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colEmail', 'Email')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colCountry', 'Pays')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colTier', 'Tier')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colReferrals', 'Parrainages')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colEarnings', 'Revenus')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colStatus', 'Statut')}</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">{t('adminAmbassadors.colActions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ambassadors.map((amb) => (
                    <TableRow key={amb.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center text-[#003087] text-xs font-bold shrink-0">
                            {amb.name?.charAt(0) || '?'}
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{amb.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 truncate max-w-[160px]">{amb.email || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {amb.country ? `${COUNTRY_FLAGS[amb.country] || ''} ${amb.country}` : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', TIER_COLORS[amb.tier] || '')}>
                          {TIER_ICONS[amb.tier]} {TIER_LABELS[amb.tier] || amb.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{amb.referrals ?? 0}</TableCell>
                      <TableCell className="text-sm font-mono text-gray-900">{formatXOF(amb.earnings ?? 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', AMBASSADOR_STATUS_COLORS[amb.status] || '')}>
                          {AMBASSADOR_STATUS_LABELS[amb.status] || amb.status}
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
                            <DropdownMenuItem><Eye className="w-4 h-4" /> {t('adminAmbassadors.actionView', 'Voir')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setDeleteTarget({ id: amb.id, name: amb.name }); setDeleteOpen(true); }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" /> {t('adminAmbassadors.actionDelete', 'Supprimer')}
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
        ) : commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">{t('adminAmbassadors.emptyCommissions', 'Aucune commission trouvée')}</p>
            <p className="text-sm text-gray-500 mt-1">{t('adminCommon.modifyFilters', 'Modifiez vos filtres')}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colAmbassador', 'Ambassadeur')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colReferral', 'Filleul')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colAmount', 'Montant')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colStatus', 'Statut')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('adminAmbassadors.colDate', 'Date')}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">{t('adminAmbassadors.colActions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((comm) => (
                  <TableRow key={comm.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-medium text-gray-900">{comm.ambassadorName || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{comm.referralName || '—'}</TableCell>
                    <TableCell className="text-sm font-mono font-medium text-gray-900">{formatXOF(comm.amount ?? 0)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', COMMISSION_STATUS_COLORS[comm.status] || '')}>
                        {COMMISSION_STATUS_LABELS[comm.status] || comm.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{comm.date ? formatDate(comm.date) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem><Eye className="w-4 h-4" /> {t('adminAmbassadors.actionView', 'Voir')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget({ id: comm.id, name: `Commission ${comm.id.slice(0, 8)}` }); setDeleteOpen(true); }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> {t('adminAmbassadors.actionDelete', 'Supprimer')}
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
            <DialogTitle>{t('adminAmbassadors.dialogConfirmDelete', 'Confirmer la suppression')}</DialogTitle>
            <DialogDescription>
              {t('adminAmbassadors.dialogDeleteWarning', 'Cette action est irréversible.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t('adminAmbassadors.btnCancel', 'Annuler')}</Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('adminAmbassadors.btnDelete', 'Supprimer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
