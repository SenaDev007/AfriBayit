'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  useAdminKyc,
  useValidateKyc,
  type AdminKycFilters,
  type AdminKycDocument,
} from '@/hooks/useAdmin';

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
  selfie: 'Selfie de vérification',
  proof_address: 'Justificatif de domicile',
  agent_license: 'Licence agent',
  notary_license: 'Licence notaire',
  geometer_license: 'Licence géomètre',
  business_reg: 'Registre de commerce',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  ai_validated: 'Validé IA',
  human_validated: 'Validé',
  rejected: 'Rejeté',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  ai_validated: 'bg-blue-50 text-blue-700 border-blue-200',
  human_validated: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  ai_validated: ShieldCheck,
  human_validated: CheckCircle2,
  rejected: XCircle,
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminKycPage() {
  const [filters, setFilters] = useState<AdminKycFilters>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const { data, isLoading } = useAdminKyc(filters);
  const documents = data?.documents || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#003087]" />
            Vérifications KYC
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Examiner et valider les documents d&apos;identité
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            className={cn('h-8 w-8 p-0', viewMode === 'cards' && 'bg-[#003087] hover:bg-[#002a70]')}
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className={cn('h-8 w-8 p-0', viewMode === 'list' && 'bg-[#003087] hover:bg-[#002a70]')}
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">En attente</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{summary?.pending ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Score IA moyen</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{summary?.avgAiScore ?? 0}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Validés aujourd&apos;hui</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{summary?.validatedToday ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom d'utilisateur..."
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
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="ai_validated">Validé IA</SelectItem>
                <SelectItem value="human_validated">Validé</SelectItem>
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
            <Select
              value={filters.docType || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, docType: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Type de doc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="id_card">Carte d&apos;identité</SelectItem>
                <SelectItem value="passport">Passeport</SelectItem>
                <SelectItem value="selfie">Selfie</SelectItem>
                <SelectItem value="proof_address">Justificatif</SelectItem>
                <SelectItem value="agent_license">Licence agent</SelectItem>
                <SelectItem value="notary_license">Licence notaire</SelectItem>
                <SelectItem value="geometer_license">Licence géomètre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileCheck className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Aucun document trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <KycCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Utilisateur</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Pays</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Score IA</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Statut</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <KycListRow key={doc.id} doc={doc} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white rounded-xl">
          <p className="text-xs text-gray-500">
            {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
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
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showDots = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showDots && <span className="px-1 text-xs text-gray-400">...</span>}
                    <Button
                      variant={p === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className={cn('h-8 w-8 p-0 text-xs', p === pagination.page && 'bg-[#003087] hover:bg-[#002a70]')}
                      onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                );
              })}
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
    </div>
  );
}

function KycCard({ doc }: { doc: AdminKycDocument }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const validateKyc = useValidateKyc(doc.id);

  const handleApprove = () => {
    validateKyc.mutate(
      { status: 'human_validated' },
      {
        onSuccess: () => toast.success('Document validé'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleReject = () => {
    validateKyc.mutate(
      { status: 'rejected', rejectionReason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Document rejeté');
          setRejectOpen(false);
          setRejectReason('');
        },
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const StatusIcon = STATUS_ICONS[doc.status] || Clock;
  const initials = doc.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          {/* Header: user + status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-9 h-9">
                <AvatarImage src={doc.user?.avatar || undefined} />
                <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.user?.name || 'Inconnu'}</p>
                <p className="text-[11px] text-gray-400 truncate">{doc.user?.email}</p>
              </div>
            </div>
            <Badge variant="outline" className={cn('text-[10px] shrink-0', STATUS_COLORS[doc.status])}>
              <StatusIcon className="w-3 h-3 mr-0.5" />
              {STATUS_LABELS[doc.status]}
            </Badge>
          </div>

          {/* Document info */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Type</span>
              <span className="font-medium text-gray-900">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Pays</span>
              <span className="text-gray-900">
                {doc.country ? `${COUNTRY_FLAGS[doc.country] || ''} ${doc.country}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Score IA</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      (doc.aiScore ?? 0) >= 80 ? 'bg-green-500' : (doc.aiScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${Math.min(doc.aiScore ?? 0, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-600">{doc.aiScore != null ? `${Math.round(doc.aiScore)}%` : '—'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Soumis</span>
              <span className="text-xs text-gray-500">{formatDate(doc.createdAt)}</span>
            </div>
          </div>

          {/* Rejection reason */}
          {doc.rejectionReason && (
            <div className="p-2 bg-red-50 rounded-lg">
              <p className="text-xs text-red-600">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {doc.rejectionReason}
              </p>
            </div>
          )}

          {/* Actions */}
          {doc.status !== 'human_validated' && doc.status !== 'rejected' && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1 text-xs bg-green-600 hover:bg-green-700 h-8"
                onClick={handleApprove}
                disabled={validateKyc.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Valider
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-red-600 border-red-200 hover:bg-red-50 h-8"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Rejeter
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le document</DialogTitle>
            <DialogDescription>
              Document de {doc.user?.name} — {DOC_TYPE_LABELS[doc.docType]}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={validateKyc.isPending}>
              {validateKyc.isPending ? 'Rejet...' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KycListRow({ doc }: { doc: AdminKycDocument }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const validateKyc = useValidateKyc(doc.id);

  const handleApprove = () => {
    validateKyc.mutate(
      { status: 'human_validated' },
      {
        onSuccess: () => toast.success('Document validé'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleReject = () => {
    validateKyc.mutate(
      { status: 'rejected', rejectionReason: rejectReason },
      {
        onSuccess: () => {
          toast.success('Document rejeté');
          setRejectOpen(false);
          setRejectReason('');
        },
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const initials = doc.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={doc.user?.avatar || undefined} />
              <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-[10px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{doc.user?.name || 'Inconnu'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm">{DOC_TYPE_LABELS[doc.docType] || doc.docType}</TableCell>
        <TableCell className="text-sm">
          {doc.country ? `${COUNTRY_FLAGS[doc.country] || ''} ${doc.country}` : '—'}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  (doc.aiScore ?? 0) >= 80 ? 'bg-green-500' : (doc.aiScore ?? 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(doc.aiScore ?? 0, 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono">{doc.aiScore != null ? `${Math.round(doc.aiScore)}%` : '—'}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[doc.status])}>
            {STATUS_LABELS[doc.status]}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-gray-500">{formatDate(doc.createdAt)}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center gap-1 justify-end">
            {doc.status !== 'human_validated' && doc.status !== 'rejected' && (
              <>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:bg-green-50" onClick={handleApprove}>
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" onClick={() => setRejectOpen(true)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter le document</DialogTitle>
            <DialogDescription>Document de {doc.user?.name}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Raison du rejet..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={validateKyc.isPending}>
              {validateKyc.isPending ? 'Rejet...' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
