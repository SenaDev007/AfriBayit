'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  Shield,
  X,
} from 'lucide-react';
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
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useAdminAuditLogs,
  type AdminAuditLog,
  type AdminAuditLogFilters,
} from '@/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n/use-translate';

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
  SN: '🇸🇳',
};

const ACTION_CATEGORIES: Record<string, { label: string; color: string }> = {
  // Destructive actions (red)
  delete: { label: 'Suppression', color: 'bg-red-50 text-red-700 border-red-200' },
  remove: { label: 'Retrait', color: 'bg-red-50 text-red-700 border-red-200' },
  ban: { label: 'Bannissement', color: 'bg-red-50 text-red-700 border-red-200' },
  reject: { label: 'Rejet', color: 'bg-red-50 text-red-700 border-red-200' },
  cancel: { label: 'Annulation', color: 'bg-red-50 text-red-700 border-red-200' },
  dispute: { label: 'Litige', color: 'bg-red-50 text-red-700 border-red-200' },
  refund: { label: 'Remboursement', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  // Create actions (green)
  create: { label: 'Création', color: 'bg-green-50 text-green-700 border-green-200' },
  publish: { label: 'Publication', color: 'bg-green-50 text-green-700 border-green-200' },
  register: { label: 'Inscription', color: 'bg-green-50 text-green-700 border-green-200' },
  enroll: { label: 'Inscription', color: 'bg-green-50 text-green-700 border-green-200' },
  fund: { label: 'Financement', color: 'bg-green-50 text-green-700 border-green-200' },
  validate: { label: 'Validation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  verify: { label: 'Vérification', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  approve: { label: 'Approbation', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  certify: { label: 'Certification', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  // Update actions (blue/teal)
  update: { label: 'Mise à jour', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  change: { label: 'Modification', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  assign: { label: 'Assignation', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  release: { label: 'Libération', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  // System actions (gray)
  system: { label: 'Système', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  login: { label: 'Connexion', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  logout: { label: 'Déconnexion', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const TARGET_TYPE_KEYS: string[] = [
  'user',
  'property',
  'kyc_document',
  'transaction',
  'escrow',
  'subscription',
  'course',
  'hotel',
  'guesthouse',
  'review',
  'community',
  'notification',
  'artisan',
  'notary',
  'geometer',
];

function getActionCategory(action: string) {
  const actionLower = action.toLowerCase();
  for (const [key, value] of Object.entries(ACTION_CATEGORIES)) {
    if (actionLower.includes(key)) return value;
  }
  return { label: action, color: 'bg-gray-50 text-gray-600 border-gray-200' };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatRelativeTime(
  dateStr: string,
  t: (path: string, fallback?: string) => string
) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return t('adminAuditLogs.relativeNow', "À l'instant");
  if (diffMin < 60)
    return `${t('adminAuditLogs.relativeMinutesPrefix', 'Il y a')} ${diffMin} ${t(
      'adminAuditLogs.relativeMinutesSuffix',
      'min'
    )}`;
  if (diffH < 24)
    return `${t('adminAuditLogs.relativeHoursPrefix', 'Il y a')} ${diffH}h`;
  if (diffD < 7)
    return `${t('adminAuditLogs.relativeDaysPrefix', 'Il y a')} ${diffD}j`;
  return formatDate(dateStr);
}

function targetLabel(
  targetType: string,
  t: (path: string, fallback?: string) => string
): string {
  return t(`adminAuditLogs.targetTypes.${targetType}`, targetType);
}

function countryLabel(
  countryCode: string,
  t: (path: string, fallback?: string) => string
): string {
  return t(`adminAuditLogs.countries.${countryCode}`, countryCode);
}

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AdminAuditLogFilters>({ page: 1, limit: 25 });
  const [searchAction, setSearchAction] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [detailLog, setDetailLog] = useState<AdminAuditLog | null>(null);

  const { data, isLoading } = useAdminAuditLogs(filters);
  const logs = data?.data || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, action: searchAction || undefined, page: 1 }));
  }, [searchAction]);

  const clearFilters = useCallback(() => {
    setFilters({ page: 1, limit: 25 });
    setSearchAction('');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(filters.action || filters.targetType || filters.country || filters.dateFrom || filters.dateTo || filters.actorId);
  }, [filters]);

  // Compute action stats for quick filters
  const actionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    logs.forEach((log) => {
      const cat = getActionCategory(log.action);
      stats[cat.label] = (stats[cat.label] || 0) + 1;
    });
    return stats;
  }, [logs]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#003087]" />
            {t('adminAuditLogs.pageTitle', "Journaux d'audit")}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination
              ? `${pagination.total} ${t('adminAuditLogs.totalEntries', 'entrées au total')}`
              : t('adminAuditLogs.loading', 'Chargement...')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {t('adminAuditLogs.exportCsv', 'Exporter CSV')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search by action */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t(
                'adminAuditLogs.searchPlaceholder',
                'Rechercher par action (ex: user.update_role)...'
              )}
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.targetType || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, targetType: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder={t('adminAuditLogs.targetTypeLabel', 'Type de cible')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminAuditLogs.allTypes', 'Tous les types')}</SelectItem>
                {TARGET_TYPE_KEYS.map((tt) => (
                  <SelectItem key={tt} value={tt}>
                    {targetLabel(tt, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.country || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, country: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder={t('adminAuditLogs.countryLabel', 'Pays')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('adminAuditLogs.allCountries', 'Tous les pays')}</SelectItem>
                <SelectItem value="BJ">🇧🇯 {countryLabel('BJ', t)}</SelectItem>
                <SelectItem value="CI">🇨🇮 {countryLabel('CI', t)}</SelectItem>
                <SelectItem value="BF">🇧🇫 {countryLabel('BF', t)}</SelectItem>
                <SelectItem value="TG">🇹🇬 {countryLabel('TG', t)}</SelectItem>
                <SelectItem value="SN">🇸🇳 {countryLabel('SN', t)}</SelectItem>
              </SelectContent>
            </Select>

            {/* Date from */}
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateFrom: e.target.value || undefined, page: 1 }))
              }
              className="w-[140px] h-9 text-xs"
              placeholder={t('adminAuditLogs.dateFromPlaceholder', 'Date début')}
            />

            {/* Date to */}
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined, page: 1 }))
              }
              className="w-[140px] h-9 text-xs"
              placeholder={t('adminAuditLogs.dateToPlaceholder', 'Date fin')}
            />

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleSearch}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              {t('adminAuditLogs.filterButton', 'Filtrer')}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-red-600 hover:text-red-700"
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                {t('adminAuditLogs.resetButton', 'Réinitialiser')}
              </Button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {filters.targetType && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {t('adminAuditLogs.typePill', 'Type:')} {targetLabel(filters.targetType, t)}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, targetType: undefined, page: 1 }))}
                />
              </Badge>
            )}
            {filters.country && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {t('adminAuditLogs.countryPill', 'Pays:')} {COUNTRY_FLAGS[filters.country] || ''} {countryLabel(filters.country, t)}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, country: undefined, page: 1 }))}
                />
              </Badge>
            )}
            {filters.action && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {t('adminAuditLogs.actionPill', 'Action:')} {filters.action}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, action: undefined, page: 1 }));
                    setSearchAction('');
                  }}
                />
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {t('adminAuditLogs.dateFromPill', 'Du:')} {filters.dateFrom}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, dateFrom: undefined, page: 1 }))}
                />
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                {t('adminAuditLogs.dateToPill', 'Au:')} {filters.dateTo}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, dateTo: undefined, page: 1 }))}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">
              {t('adminAuditLogs.emptyTitle', "Aucun journal d'audit trouvé")}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {t('adminAuditLogs.emptyDesc', 'Essayez de modifier vos filtres de recherche')}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">
                      {t('adminAuditLogs.colDate', 'Date')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[120px]">
                      {t('adminAuditLogs.colActor', 'Acteur')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">
                      {t('adminAuditLogs.colAction', 'Action')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[140px]">
                      {t('adminAuditLogs.colTarget', 'Cible')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[80px]">
                      {t('adminAuditLogs.colCountry', 'Pays')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[100px]">
                      {t('adminAuditLogs.colDetails', 'Détails')}
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[110px]">
                      {t('adminAuditLogs.colIp', 'IP')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      isExpanded={expandedLogId === log.id}
                      onToggleExpand={() =>
                        setExpandedLogId((prev) => (prev === log.id ? null : log.id))
                      }
                      onViewDetail={() => setDetailLog(log)}
                      t={t}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                  {t('adminAuditLogs.paginationOf', 'sur')} {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page <= 1}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))
                    }
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {generatePageNumbers(pagination.page, pagination.pages).map((pageNum, idx) =>
                    pageNum === '...' ? (
                      <span key={`dots-${idx}`} className="px-1 text-xs text-gray-400">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0 text-xs',
                          pageNum === pagination.page && 'bg-[#003087] hover:bg-[#002a70]'
                        )}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, page: pageNum as number }))
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: pagination.page + 1 }))
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailLog} onOpenChange={(open) => !open && setDetailLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#003087]" />
              {t('adminAuditLogs.detailDialogTitle', "Détail du journal d'audit")}
            </DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailId', 'ID')}</span>
                  <p className="font-mono text-xs mt-0.5">{detailLog.id}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailDate', 'Date')}</span>
                  <p className="text-xs mt-0.5">{formatDate(detailLog.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailActor', 'Acteur')}</span>
                  <p className="text-xs mt-0.5">
                    {detailLog.actorId || t('adminAuditLogs.systemActor', 'Système')}
                    {detailLog.actorRole && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {detailLog.actorRole}
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailAction', 'Action')}</span>
                  <p className="mt-0.5">
                    <Badge className={cn('text-[11px]', getActionCategory(detailLog.action).color)}>
                      {detailLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailTarget', 'Cible')}</span>
                  <p className="text-xs mt-0.5">
                    {detailLog.targetType
                      ? targetLabel(detailLog.targetType, t)
                      : '—'}
                    {detailLog.targetId && (
                      <span className="text-gray-400 font-mono ml-1">
                        ({detailLog.targetId.slice(0, 12)}...)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailCountry', 'Pays')}</span>
                  <p className="text-xs mt-0.5">
                    {detailLog.country
                      ? `${COUNTRY_FLAGS[detailLog.country] || ''} ${countryLabel(detailLog.country, t)}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailIpAddress', 'Adresse IP')}</span>
                  <p className="font-mono text-xs mt-0.5">{detailLog.ipAddress || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailUserAgent', 'User Agent')}</span>
                  <p className="text-xs mt-0.5 truncate max-w-[250px]" title={detailLog.userAgent || ''}>
                    {detailLog.userAgent || '—'}
                  </p>
                </div>
              </div>

              {/* JSON details */}
              {detailLog.details && (
                <div>
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailJsonDetails', 'Détails (JSON)')}</span>
                  <div className="mt-1 bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-80 overflow-y-auto custom-scrollbar-thin">
                    <JsonViewer data={detailLog.details} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TranslateFn = (path: string, fallback?: string) => string;

function AuditLogRow({
  log,
  isExpanded,
  onToggleExpand,
  onViewDetail,
  t,
}: {
  log: AdminAuditLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetail: () => void;
  t: TranslateFn;
}) {
  const category = getActionCategory(log.action);

  return (
    <>
      <TableRow className="hover:bg-gray-50/50 cursor-pointer" onClick={onToggleExpand}>
        <TableCell>
          <div className="text-xs text-gray-900 font-medium">
            {formatRelativeTime(log.createdAt, t)}
          </div>
          <div className="text-[10px] text-gray-400">{formatDate(log.createdAt)}</div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-[#003087]/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#003087]">
                {log.actorId ? log.actorId.slice(0, 2).toUpperCase() : 'SY'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono text-gray-700 truncate">
                {log.actorId ? log.actorId.slice(0, 12) + '...' : t('adminAuditLogs.systemActor', 'Système')}
              </p>
              {log.actorRole && (
                <p className="text-[10px] text-gray-400">{log.actorRole}</p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn('text-[11px] font-medium', category.color)}>
            {log.action}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="text-xs">
            {log.targetType ? (
              <span className="text-gray-700">{targetLabel(log.targetType, t)}</span>
            ) : (
              <span className="text-gray-400">—</span>
            )}
            {log.targetId && (
              <p className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                {log.targetId.slice(0, 16)}...
              </p>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-xs">
            {log.country
              ? `${COUNTRY_FLAGS[log.country] || ''} ${countryLabel(log.country, t)}`
              : '—'}
          </span>
        </TableCell>
        <TableCell>
          {log.details ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[#003087] hover:text-[#002a70] px-2"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetail();
              }}
            >
              <FileText className="w-3 h-3 mr-1" />
              {t('adminAuditLogs.viewButton', 'Voir')}
            </Button>
          ) : (
            <span className="text-[11px] text-gray-400">—</span>
          )}
        </TableCell>
        <TableCell>
          <span className="text-[11px] font-mono text-gray-500">
            {log.ipAddress || '—'}
          </span>
        </TableCell>
      </TableRow>

      {/* Expanded row - inline details */}
      {isExpanded && (
        <TableRow className="bg-gray-50/30">
          <TableCell colSpan={7} className="p-0">
            <div className="px-6 py-3 border-l-4 border-[#D4AF37]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                <div>
                  <span className="text-gray-500">{t('adminAuditLogs.detailId', 'ID')}:</span>{' '}
                  <span className="font-mono">{log.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('adminAuditLogs.detailActorId', 'Acteur ID')}:</span>{' '}
                  <span className="font-mono">{log.actorId || t('adminAuditLogs.systemActor', 'Système')}</span>
                </div>
                <div>
                  <span className="text-gray-500">{t('adminAuditLogs.detailUserAgent', 'User Agent')}:</span>{' '}
                  <span className="truncate block max-w-[200px]" title={log.userAgent || ''}>
                    {log.userAgent || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">{t('adminAuditLogs.detailTargetId', 'Cible ID')}:</span>{' '}
                  <span className="font-mono">{log.targetId || '—'}</span>
                </div>
              </div>
              {log.details && (
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">{t('adminAuditLogs.detailDetails', 'Détails:')}</span>
                  <div className="mt-1 bg-white rounded border border-gray-200 p-2 max-h-40 overflow-y-auto custom-scrollbar-thin">
                    <JsonViewer data={log.details} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={onViewDetail}
                >
                  {t('adminAuditLogs.viewFullDetail', 'Voir le détail complet')}
                </Button>
                {isExpanded ? (
                  <ChevronUp className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function JsonViewer({ data }: { data: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return <pre className="text-xs text-gray-700 whitespace-pre-wrap">{data}</pre>;
  }

  return (
    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [];
  pages.push(1);

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}
