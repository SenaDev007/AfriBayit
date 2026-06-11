'use client';

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Eye,
  User,
  Building2,
  Wrench,
  Hotel,
  CreditCard,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// ─── Types ───────────────────────────────────────────────────────────────────

type BeneficiaryType = 'Vendeur' | 'Artisan' | 'Hôtelier';
type PayoutMethod = 'Mobile Money MTN' | 'Mobile Money Orange' | 'Virement bancaire' | 'Wallet';
type TransactionType = 'Vente' | 'Location' | 'Mission';
type KycStatus = 'Validé' | 'En attente';
type PayoutStatus = 'En attente' | 'Complété' | 'Échoué' | 'Annulé';

interface Payout {
  id: string;
  beneficiary: {
    name: string;
    type: BeneficiaryType;
    initials: string;
  };
  amount: number;
  method: PayoutMethod;
  transaction: {
    id: string;
    type: TransactionType;
  };
  kycStatus: KycStatus;
  daysPending: number;
  status: PayoutStatus;
  reference?: string;
  processedDate?: string;
  createdAt: string;
  phone?: string;
  bankAccount?: string;
  walletAddress?: string;
}

// ─── Format helpers ──────────────────────────────────────────────────────────

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_PENDING_PAYOUTS: Payout[] = [
  {
    id: 'PAY-001',
    beneficiary: { name: 'Amadou Diallo', type: 'Vendeur', initials: 'AD' },
    amount: 245000,
    method: 'Mobile Money MTN',
    transaction: { id: 'TRX-7821', type: 'Vente' },
    kycStatus: 'Validé',
    daysPending: 8,
    status: 'En attente',
    createdAt: '2026-06-03',
    phone: '+229 97 00 11 22',
  },
  {
    id: 'PAY-002',
    beneficiary: { name: 'Fatou Mensah', type: 'Artisan', initials: 'FM' },
    amount: 185000,
    method: 'Mobile Money Orange',
    transaction: { id: 'TRX-7834', type: 'Mission' },
    kycStatus: 'En attente',
    daysPending: 52,
    status: 'En attente',
    createdAt: '2026-05-20',
    phone: '+229 95 33 44 55',
  },
  {
    id: 'PAY-003',
    beneficiary: { name: 'Kofi Asante', type: 'Hôtelier', initials: 'KA' },
    amount: 1250000,
    method: 'Virement bancaire',
    transaction: { id: 'TRX-7840', type: 'Location' },
    kycStatus: 'Validé',
    daysPending: 18,
    status: 'En attente',
    createdAt: '2026-05-24',
    bankAccount: 'BJ061 01001 0123456789012',
  },
  {
    id: 'PAY-004',
    beneficiary: { name: 'Aïcha Bello', type: 'Vendeur', initials: 'AB' },
    amount: 78000,
    method: 'Wallet',
    transaction: { id: 'TRX-7855', type: 'Vente' },
    kycStatus: 'Validé',
    daysPending: 5,
    status: 'En attente',
    createdAt: '2026-06-06',
    walletAddress: 'aïcha.bello@wallet.af',
  },
  {
    id: 'PAY-005',
    beneficiary: { name: 'Yao Koffi', type: 'Artisan', initials: 'YK' },
    amount: 340000,
    method: 'Mobile Money MTN',
    transaction: { id: 'TRX-7861', type: 'Mission' },
    kycStatus: 'Validé',
    daysPending: 22,
    status: 'En attente',
    createdAt: '2026-05-20',
    phone: '+229 96 77 88 99',
  },
  {
    id: 'PAY-006',
    beneficiary: { name: 'Mariama Sow', type: 'Vendeur', initials: 'MS' },
    amount: 520000,
    method: 'Virement bancaire',
    transaction: { id: 'TRX-7875', type: 'Vente' },
    kycStatus: 'En attente',
    daysPending: 36,
    status: 'En attente',
    createdAt: '2026-05-06',
    bankAccount: 'BJ061 01001 0098765432109',
  },
  {
    id: 'PAY-007',
    beneficiary: { name: 'Issa Traoré', type: 'Hôtelier', initials: 'IT' },
    amount: 890000,
    method: 'Mobile Money Orange',
    transaction: { id: 'TRX-7888', type: 'Location' },
    kycStatus: 'Validé',
    daysPending: 3,
    status: 'En attente',
    createdAt: '2026-06-08',
    phone: '+229 97 11 22 33',
  },
  {
    id: 'PAY-008',
    beneficiary: { name: 'Adama Ouédraogo', type: 'Artisan', initials: 'AO' },
    amount: 150000,
    method: 'Wallet',
    transaction: { id: 'TRX-7892', type: 'Mission' },
    kycStatus: 'Validé',
    daysPending: 12,
    status: 'En attente',
    createdAt: '2026-05-30',
    walletAddress: 'adama.o@wallet.af',
  },
  {
    id: 'PAY-009',
    beneficiary: { name: 'Ramatou Bako', type: 'Vendeur', initials: 'RB' },
    amount: 95000,
    method: 'Mobile Money MTN',
    transaction: { id: 'TRX-7905', type: 'Vente' },
    kycStatus: 'En attente',
    daysPending: 48,
    status: 'En attente',
    createdAt: '2026-05-24',
    phone: '+229 96 44 55 66',
  },
  {
    id: 'PAY-010',
    beneficiary: { name: 'Ousmane Camara', type: 'Hôtelier', initials: 'OC' },
    amount: 2100000,
    method: 'Virement bancaire',
    transaction: { id: 'TRX-7910', type: 'Location' },
    kycStatus: 'Validé',
    daysPending: 16,
    status: 'En attente',
    createdAt: '2026-05-26',
    bankAccount: 'BJ061 01001 0111223344556',
  },
  {
    id: 'PAY-011',
    beneficiary: { name: 'Aminata Dossou', type: 'Artisan', initials: 'AD' },
    amount: 275000,
    method: 'Mobile Money Orange',
    transaction: { id: 'TRX-7922', type: 'Mission' },
    kycStatus: 'Validé',
    daysPending: 7,
    status: 'En attente',
    createdAt: '2026-06-04',
    phone: '+229 95 99 88 77',
  },
];

const MOCK_HISTORY_PAYOUTS: Payout[] = [
  {
    id: 'PAY-H01',
    beneficiary: { name: 'Bintou Keita', type: 'Vendeur', initials: 'BK' },
    amount: 430000,
    method: 'Mobile Money MTN',
    transaction: { id: 'TRX-7601', type: 'Vente' },
    kycStatus: 'Validé',
    daysPending: 0,
    status: 'Complété',
    reference: 'MMT-20260601-4321',
    processedDate: '2026-06-01',
    createdAt: '2026-05-28',
    phone: '+229 97 55 66 77',
  },
  {
    id: 'PAY-H02',
    beneficiary: { name: 'Moussa Sanogo', type: 'Hôtelier', initials: 'MS' },
    amount: 1800000,
    method: 'Virement bancaire',
    transaction: { id: 'TRX-7615', type: 'Location' },
    kycStatus: 'Validé',
    daysPending: 0,
    status: 'Complété',
    reference: 'VIR-20260530-8765',
    processedDate: '2026-05-30',
    createdAt: '2026-05-25',
    bankAccount: 'BJ061 01001 0155667788990',
  },
  {
    id: 'PAY-H03',
    beneficiary: { name: 'Djenaba Touré', type: 'Artisan', initials: 'DT' },
    amount: 210000,
    method: 'Mobile Money Orange',
    transaction: { id: 'TRX-7622', type: 'Mission' },
    kycStatus: 'Validé',
    daysPending: 0,
    status: 'Échoué',
    reference: 'MMO-20260529-1122',
    processedDate: '2026-05-29',
    createdAt: '2026-05-27',
    phone: '+229 95 22 33 44',
  },
  {
    id: 'PAY-H04',
    beneficiary: { name: 'Ibrahim Sidibé', type: 'Vendeur', initials: 'IS' },
    amount: 155000,
    method: 'Wallet',
    transaction: { id: 'TRX-7630', type: 'Vente' },
    kycStatus: 'Validé',
    daysPending: 0,
    status: 'Complété',
    reference: 'WAL-20260528-3344',
    processedDate: '2026-05-28',
    createdAt: '2026-05-24',
    walletAddress: 'ibrahim.s@wallet.af',
  },
  {
    id: 'PAY-H05',
    beneficiary: { name: 'Salamata Bah', type: 'Hôtelier', initials: 'SB' },
    amount: 670000,
    method: 'Virement bancaire',
    transaction: { id: 'TRX-7645', type: 'Location' },
    kycStatus: 'Validé',
    daysPending: 0,
    status: 'Annulé',
    reference: 'VIR-20260527-CANCEL',
    processedDate: '2026-05-27',
    createdAt: '2026-05-22',
    bankAccount: 'BJ061 01001 0199887766554',
  },
  {
    id: 'PAY-H06',
    beneficiary: { name: 'Abdou Karim', type: 'Artisan', initials: 'AK' },
    amount: 320000,
    method: 'Mobile Money MTN',
    transaction: { id: 'TRX-7658', type: 'Mission' },
    kycStatus: 'Validé',
    daysPending: 0,
    status: 'Complété',
    reference: 'MMT-20260526-5566',
    processedDate: '2026-05-26',
    createdAt: '2026-05-23',
    phone: '+229 96 11 22 33',
  },
];

// ─── Helper Components ───────────────────────────────────────────────────────

function BeneficiaryTypeIcon({ type }: { type: BeneficiaryType }) {
  switch (type) {
    case 'Vendeur':
      return <User className="w-3.5 h-3.5" />;
    case 'Artisan':
      return <Wrench className="w-3.5 h-3.5" />;
    case 'Hôtelier':
      return <Hotel className="w-3.5 h-3.5" />;
  }
}

function MethodIcon({ method }: { method: PayoutMethod }) {
  if (method.startsWith('Mobile Money')) return <Smartphone className="w-4 h-4 text-[#003087]" />;
  if (method === 'Virement bancaire') return <Building2 className="w-4 h-4 text-[#003087]" />;
  return <CreditCard className="w-4 h-4 text-[#003087]" />;
}

function DaysBadge({ days }: { days: number }) {
  if (days < 24) {
    return (
      <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 hover:bg-[#00A651]/20 text-xs font-medium">
        {days}h
      </Badge>
    );
  }
  if (days <= 48) {
    return (
      <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 text-xs font-medium">
        {days}h
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20 hover:bg-[#D93025]/20 text-xs font-medium">
      {days}h
    </Badge>
  );
}

function KycBadge({ status }: { status: KycStatus }) {
  if (status === 'Validé') {
    return (
      <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 hover:bg-[#00A651]/20 text-xs font-medium gap-1">
        <CheckCircle className="w-3 h-3" />
        Validé
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20 hover:bg-[#D93025]/20 text-xs font-medium gap-1">
      <AlertTriangle className="w-3 h-3" />
      En attente
    </Badge>
  );
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  switch (status) {
    case 'Complété':
      return (
        <Badge className="bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20 hover:bg-[#00A651]/20 text-xs font-medium gap-1">
          <CheckCircle className="w-3 h-3" />
          Complété
        </Badge>
      );
    case 'Échoué':
      return (
        <Badge className="bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20 hover:bg-[#D93025]/20 text-xs font-medium gap-1">
          <XCircle className="w-3 h-3" />
          Échoué
        </Badge>
      );
    case 'Annulé':
      return (
        <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20 text-xs font-medium gap-1">
          <X className="w-3 h-3" />
          Annulé
        </Badge>
      );
    default:
      return (
        <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs font-medium gap-1">
          <Clock className="w-3 h-3" />
          En attente
        </Badge>
      );
  }
}

function TransactionTypeBadge({ type }: { type: TransactionType }) {
  switch (type) {
    case 'Vente':
      return (
        <Badge variant="outline" className="text-xs font-medium text-[#003087] border-[#003087]/20">
          Vente
        </Badge>
      );
    case 'Location':
      return (
        <Badge variant="outline" className="text-xs font-medium text-[#009CDE] border-[#009CDE]/20">
          Location
        </Badge>
      );
    case 'Mission':
      return (
        <Badge variant="outline" className="text-xs font-medium text-[#00A651] border-[#00A651]/20">
          Mission
        </Badge>
      );
  }
}

function BeneficiaryTypeBadge({ type }: { type: BeneficiaryType }) {
  const config = {
    Vendeur: 'bg-[#003087]/10 text-[#003087] border-[#003087]/20',
    Artisan: 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20',
    Hôtelier: 'bg-[#009CDE]/10 text-[#009CDE] border-[#009CDE]/20',
  }[type];

  return (
    <Badge className={cn('text-xs font-medium gap-1', config)}>
      <BeneficiaryTypeIcon type={type} />
      {type}
    </Badge>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PayoutManagementPage() {
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>(MOCK_PENDING_PAYOUTS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailPayout, setDetailPayout] = useState<Payout | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Stats computation
  const stats = useMemo(() => {
    const total = pendingPayouts.reduce((s, p) => s + p.amount, 0);
    const enAttente = pendingPayouts.length;
    const traites = MOCK_HISTORY_PAYOUTS.filter((p) => p.status === 'Complété').length;
    const montantMoyen = enAttente > 0 ? Math.round(total / enAttente) : 0;
    return { total, enAttente, traites, montantMoyen };
  }, [pendingPayouts]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingPayouts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingPayouts.map((p) => p.id)));
    }
  };

  // Action handlers
  const handleApprove = (id: string) => {
    const payout = pendingPayouts.find((p) => p.id === id);
    if (payout?.kycStatus !== 'Validé') return;
    setPendingPayouts((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleReject = (id: string) => {
    setPendingPayouts((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkApprove = () => {
    const validIds = pendingPayouts
      .filter((p) => selectedIds.has(p.id) && p.kycStatus === 'Validé')
      .map((p) => p.id);
    setPendingPayouts((prev) => prev.filter((p) => !validIds.includes(p.id)));
    setSelectedIds(new Set());
  };

  const selectedWithKycIssues = pendingPayouts.filter(
    (p) => selectedIds.has(p.id) && p.kycStatus !== 'Validé'
  ).length;

  return (
    <div className="space-y-5">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#003087]" />
            Gestion des Payouts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Suivi et traitement des décaissements vers vendeurs et artisans
          </p>
        </div>
        <Button
          className="bg-[#D4AF37] hover:bg-[#c4a030] text-white shadow-sm shrink-0"
          onClick={handleBulkApprove}
          disabled={selectedIds.size === 0}
        >
          <ArrowRight className="w-4 h-4" />
          Traiter les payouts en attente
          {selectedIds.size > 0 && (
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 ml-1 text-xs">
              {selectedIds.size}
            </Badge>
          )}
        </Button>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#003087]/10 text-[#003087]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total payouts ce mois</p>
              <p className="text-2xl font-bold text-gray-900">{formatXOF(stats.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#D4AF37]/10 text-[#D4AF37]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enAttente}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#00A651]/10 text-[#00A651]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Traités</p>
              <p className="text-2xl font-bold text-gray-900">{stats.traites}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#009CDE]/10 text-[#009CDE]">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Montant moyen</p>
              <p className="text-2xl font-bold text-gray-900">{formatXOF(stats.montantMoyen)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200 shadow-sm">
          <TabsTrigger
            value="pending"
            className={cn(
              'data-[state=active]:bg-[#003087] data-[state=active]:text-white data-[state=active]:shadow-sm',
              'px-4 gap-2'
            )}
          >
            <Clock className="w-4 h-4" />
            En attente
            <Badge className="bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/20 text-xs hover:bg-[#D4AF37]/25">
              {pendingPayouts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className={cn(
              'data-[state=active]:bg-[#003087] data-[state=active]:text-white data-[state=active]:shadow-sm',
              'px-4 gap-2'
            )}
          >
            <CheckCircle className="w-4 h-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ─── En attente Tab ──────────────────────────────────────────── */}
        <TabsContent value="pending">
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="bg-[#003087] text-white rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {selectedIds.size} payout{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                  </p>
                  {selectedWithKycIssues > 0 && (
                    <p className="text-xs text-[#D4AF37] flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      {selectedWithKycIssues} payout{selectedWithKycIssues > 1 ? 's' : ''} bloqué{selectedWithKycIssues > 1 ? 's' : ''} par KYC
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-[#D4AF37] hover:bg-[#c4a030] text-white"
                  onClick={handleBulkApprove}
                  disabled={selectedIds.size - selectedWithKycIssues === 0}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approuver la sélection
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="w-3.5 h-3.5" />
                  Annuler
                </Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={pendingPayouts.length > 0 && selectedIds.size === pendingPayouts.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Bénéficiaire</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Montant</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Méthode</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Transaction source</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">KYC</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">En attente</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((payout) => {
                    const isKycBlocked = payout.kycStatus !== 'Validé';
                    return (
                      <TableRow
                        key={payout.id}
                        className={cn(
                          'hover:bg-gray-50/50 transition-colors',
                          selectedIds.has(payout.id) && 'bg-[#003087]/5',
                          isKycBlocked && 'bg-[#D93025]/[0.03]'
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(payout.id)}
                            onCheckedChange={() => toggleSelect(payout.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-xs font-semibold">
                                {payout.beneficiary.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{payout.beneficiary.name}</p>
                              <BeneficiaryTypeBadge type={payout.beneficiary.type} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-semibold text-gray-900">{formatXOF(payout.amount)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MethodIcon method={payout.method} />
                            <span className="text-sm text-gray-700">{payout.method}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">{payout.transaction.id}</span>
                            <TransactionTypeBadge type={payout.transaction.type} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <KycBadge status={payout.kycStatus} />
                        </TableCell>
                        <TableCell>
                          <DaysBadge days={payout.daysPending} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[#00A651] hover:text-[#00A651] hover:bg-[#00A651]/10"
                              disabled={isKycBlocked}
                              onClick={() => handleApprove(payout.id)}
                              title={isKycBlocked ? 'KYC non validé — payout bloqué' : 'Approuver'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[#D93025] hover:text-[#D93025] hover:bg-[#D93025]/10"
                              onClick={() => handleReject(payout.id)}
                              title="Rejeter"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[#003087] hover:text-[#003087] hover:bg-[#003087]/10"
                              onClick={() => setDetailPayout(payout)}
                              title="Voir détails"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {pendingPayouts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00A651]/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[#00A651]" />
                </div>
                <p className="text-lg font-medium text-gray-900">Tous les payouts ont été traités</p>
                <p className="text-sm text-gray-500 mt-1">Aucun payout en attente pour le moment</p>
              </div>
            )}

            {/* Footer pagination placeholder */}
            {pendingPayouts.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  1–{pendingPayouts.length} sur {pendingPayouts.length} résultats
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-[#003087] hover:bg-[#002a70] text-xs">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Historique Tab ──────────────────────────────────────────── */}
        <TabsContent value="history">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-600">Bénéficiaire</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Montant</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Méthode</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Référence</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Date traitement</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_HISTORY_PAYOUTS.map((payout) => (
                    <TableRow key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-semibold">
                              {payout.beneficiary.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{payout.beneficiary.name}</p>
                            <BeneficiaryTypeBadge type={payout.beneficiary.type} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-gray-900">{formatXOF(payout.amount)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MethodIcon method={payout.method} />
                          <span className="text-sm text-gray-700">{payout.method}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {payout.reference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">
                          {payout.processedDate
                            ? new Date(payout.processedDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[#003087] hover:text-[#003087] hover:bg-[#003087]/10"
                          onClick={() => setDetailPayout(payout)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                1–{MOCK_HISTORY_PAYOUTS.length} sur {MOCK_HISTORY_PAYOUTS.length} résultats
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-[#003087] hover:bg-[#002a70] text-xs">
                  1
                </Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Detail Modal ───────────────────────────────────────────────── */}
      <Dialog open={!!detailPayout} onOpenChange={() => setDetailPayout(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#003087]">
              <DollarSign className="w-5 h-5" />
              Détails du payout
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le décaissement {detailPayout?.id}
            </DialogDescription>
          </DialogHeader>

          {detailPayout && (
            <div className="space-y-5">
              {/* Beneficiary Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Bénéficiaire</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-sm font-semibold">
                      {detailPayout.beneficiary.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{detailPayout.beneficiary.name}</p>
                    <BeneficiaryTypeBadge type={detailPayout.beneficiary.type} />
                  </div>
                </div>
              </div>

              {/* Payout Amount */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Montant</p>
                <p className="text-xl font-bold text-gray-900">{formatXOF(detailPayout.amount)}</p>
              </div>

              <Separator />

              {/* Payout Method & Details */}
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Mode de paiement</p>
                <div className="flex items-center gap-2">
                  <MethodIcon method={detailPayout.method} />
                  <span className="text-sm font-medium text-gray-900">{detailPayout.method}</span>
                </div>
                {detailPayout.phone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="font-mono text-gray-900">{detailPayout.phone}</span>
                  </div>
                )}
                {detailPayout.bankAccount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Compte bancaire</span>
                    <span className="font-mono text-gray-900 text-xs">{detailPayout.bankAccount}</span>
                  </div>
                )}
                {detailPayout.walletAddress && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Adresse Wallet</span>
                    <span className="font-mono text-gray-900 text-xs">{detailPayout.walletAddress}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* KYC Verification */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Vérification KYC</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Statut</span>
                  <KycBadge status={detailPayout.kycStatus} />
                </div>
                {detailPayout.kycStatus !== 'Validé' && (
                  <div className="bg-[#D93025]/5 border border-[#D93025]/15 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D93025] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#D93025]">
                      Ce payout est bloqué tant que la vérification KYC du bénéficiaire n&apos;est pas validée.
                      L&apos;approbation est désactivée.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Transaction Source */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Transaction source</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Référence</span>
                  <span className="text-sm font-mono text-gray-900">{detailPayout.transaction.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <TransactionTypeBadge type={detailPayout.transaction.type} />
                </div>
              </div>

              <Separator />

              {/* Payout Status & Dates */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Suivi</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Statut</span>
                  <StatusBadge status={detailPayout.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Date de création</span>
                  <span className="text-sm text-gray-900">
                    {new Date(detailPayout.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {detailPayout.processedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Date de traitement</span>
                    <span className="text-sm text-gray-900">
                      {new Date(detailPayout.processedDate).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {detailPayout.reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Référence</span>
                    <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {detailPayout.reference}
                    </span>
                  </div>
                )}
                {detailPayout.status === 'En attente' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Jours en attente</span>
                    <DaysBadge days={detailPayout.daysPending} />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {detailPayout?.status === 'En attente' && (
              <>
                <Button
                  variant="outline"
                  className="text-[#D93025] border-[#D93025]/30 hover:bg-[#D93025]/10 hover:text-[#D93025]"
                  onClick={() => {
                    handleReject(detailPayout.id);
                    setDetailPayout(null);
                  }}
                >
                  <X className="w-4 h-4" />
                  Rejeter
                </Button>
                <Button
                  className="bg-[#00A651] hover:bg-[#009448] text-white"
                  disabled={detailPayout.kycStatus !== 'Validé'}
                  onClick={() => {
                    handleApprove(detailPayout.id);
                    setDetailPayout(null);
                  }}
                >
                  <Check className="w-4 h-4" />
                  Approuver
                </Button>
              </>
            )}
            {detailPayout?.status !== 'En attente' && (
              <Button variant="outline" onClick={() => setDetailPayout(null)}>
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
