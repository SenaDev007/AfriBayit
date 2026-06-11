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

const TARGET_TYPE_LABELS: Record<string, string> = {
  user: 'Utilisateur',
  property: 'Propriété',
  kyc_document: 'Doc KYC',
  transaction: 'Transaction',
  escrow: 'Escrow',
  subscription: 'Abonnement',
  course: 'Formation',
  hotel: 'Hôtel',
  guesthouse: 'Guesthouse',
  review: 'Avis',
  community: 'Communauté',
  notification: 'Notification',
  artisan: 'Artisan',
  notary: 'Notaire',
  geometer: 'Géomètre',
};

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

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return formatDate(dateStr);
}

export default function AdminAuditLogsPage() {
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
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#003087]" />
            Journaux d&apos;audit
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination ? `${pagination.total} entrées au total` : 'Chargement...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exporter CSV
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
              placeholder="Rechercher par action (ex: user.update_role)..."
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
                <SelectValue placeholder="Type de cible" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="user">Utilisateur</SelectItem>
                <SelectItem value="property">Propriété</SelectItem>
                <SelectItem value="kyc_document">Doc KYC</SelectItem>
                <SelectItem value="transaction">Transaction</SelectItem>
                <SelectItem value="escrow">Escrow</SelectItem>
                <SelectItem value="subscription">Abonnement</SelectItem>
                <SelectItem value="course">Formation</SelectItem>
                <SelectItem value="hotel">Hôtel</SelectItem>
                <SelectItem value="guesthouse">Guesthouse</SelectItem>
                <SelectItem value="review">Avis</SelectItem>
                <SelectItem value="notary">Notaire</SelectItem>
                <SelectItem value="geometer">Géomètre</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.country || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, country: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                <SelectItem value="TG">🇹🇬 Togo</SelectItem>
                <SelectItem value="SN">🇸🇳 Sénégal</SelectItem>
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
              placeholder="Date début"
            />

            {/* Date to */}
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, dateTo: e.target.value || undefined, page: 1 }))
              }
              className="w-[140px] h-9 text-xs"
              placeholder="Date fin"
            />

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleSearch}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filtrer
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-red-600 hover:text-red-700"
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Active filter pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
            {filters.targetType && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                Type: {TARGET_TYPE_LABELS[filters.targetType] || filters.targetType}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, targetType: undefined, page: 1 }))}
                />
              </Badge>
            )}
            {filters.country && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                Pays: {COUNTRY_FLAGS[filters.country] || ''} {filters.country}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, country: undefined, page: 1 }))}
                />
              </Badge>
            )}
            {filters.action && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                Action: {filters.action}
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
                Du: {filters.dateFrom}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => setFilters((prev) => ({ ...prev, dateFrom: undefined, page: 1 }))}
                />
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="outline" className="text-[11px] gap-1 pr-1">
                Au: {filters.dateTo}
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
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun journal d&apos;audit trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[120px]">
                      Acteur
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[160px]">
                      Action
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[140px]">
                      Cible
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[80px]">
                      Pays
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[100px]">
                      Détails
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 min-w-[110px]">
                      IP
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
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                  {pagination.total}
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
              Détail du journal d&apos;audit
            </DialogTitle>
          </DialogHeader>
          {detailLog && (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">ID</span>
                  <p className="font-mono text-xs mt-0.5">{detailLog.id}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Date</span>
                  <p className="text-xs mt-0.5">{formatDate(detailLog.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Acteur</span>
                  <p className="text-xs mt-0.5">
                    {detailLog.actorId || 'Système'}
                    {detailLog.actorRole && (
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {detailLog.actorRole}
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Action</span>
                  <p className="mt-0.5">
                    <Badge className={cn('text-[11px]', getActionCategory(detailLog.action).color)}>
                      {detailLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Cible</span>
                  <p className="text-xs mt-0.5">
                    {detailLog.targetType
                      ? `${TARGET_TYPE_LABELS[detailLog.targetType] || detailLog.targetType}`
                      : '—'}
                    {detailLog.targetId && (
                      <span className="text-gray-400 font-mono ml-1">
                        ({detailLog.targetId.slice(0, 12)}...)
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Pays</span>
                  <p className="text-xs mt-0.5">
                    {detailLog.country
                      ? `${COUNTRY_FLAGS[detailLog.country] || ''} ${detailLog.country}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Adresse IP</span>
                  <p className="font-mono text-xs mt-0.5">{detailLog.ipAddress || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">User Agent</span>
                  <p className="text-xs mt-0.5 truncate max-w-[250px]" title={detailLog.userAgent || ''}>
                    {detailLog.userAgent || '—'}
                  </p>
                </div>
              </div>

              {/* JSON details */}
              {detailLog.details && (
                <div>
                  <span className="text-gray-500 text-xs">Détails (JSON)</span>
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

function AuditLogRow({
  log,
  isExpanded,
  onToggleExpand,
  onViewDetail,
}: {
  log: AdminAuditLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetail: () => void;
}) {
  const category = getActionCategory(log.action);

  return (
    <>
      <TableRow className="hover:bg-gray-50/50 cursor-pointer" onClick={onToggleExpand}>
        <TableCell>
          <div className="text-xs text-gray-900 font-medium">
            {formatRelativeTime(log.createdAt)}
          </div>
          <div className="text-[10px] text-gray-400">{formatDate(log.createdAt)}</div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#003087]">
                {log.actorId ? log.actorId.slice(0, 2).toUpperCase() : 'SY'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono text-gray-700 truncate">
                {log.actorId ? log.actorId.slice(0, 12) + '...' : 'Système'}
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
              <span className="text-gray-700">
                {TARGET_TYPE_LABELS[log.targetType] || log.targetType}
              </span>
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
            {log.country ? `${COUNTRY_FLAGS[log.country] || ''} ${log.country}` : '—'}
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
              Voir
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
                  <span className="text-gray-500">ID:</span>{' '}
                  <span className="font-mono">{log.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Acteur ID:</span>{' '}
                  <span className="font-mono">{log.actorId || 'Système'}</span>
                </div>
                <div>
                  <span className="text-gray-500">User Agent:</span>{' '}
                  <span className="truncate block max-w-[200px]" title={log.userAgent || ''}>
                    {log.userAgent || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Cible ID:</span>{' '}
                  <span className="font-mono">{log.targetId || '—'}</span>
                </div>
              </div>
              {log.details && (
                <div className="mt-2">
                  <span className="text-gray-500 text-xs">Détails:</span>
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
                  Voir le détail complet
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
