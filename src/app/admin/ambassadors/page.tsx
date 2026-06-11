'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, UserPlus, Search, Filter, MoreHorizontal, Eye, Pencil,
  Ban, CheckCircle2, DollarSign, TrendingUp, Award, ArrowUpDown,
  ChevronLeft, ChevronRight, Copy, Shield, ShieldCheck, ShieldAlert,
  Clock, XCircle, Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============ Design Tokens ============
const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';
const GREEN = '#00A651';
const RED = '#D93025';

// ============ Tier Config ============
const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  bronze: { label: 'Bronze', bg: '#CD7F32', text: '#ffffff', icon: Shield },
  silver: { label: 'Silver', bg: '#C0C0C0', text: '#1a1a1a', icon: ShieldCheck },
  gold: { label: 'Gold', bg: '#D4AF37', text: '#ffffff', icon: ShieldAlert },
};

// ============ Status Config ============
const AMBASSADOR_STATUS: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  suspended: { label: 'Suspendu', className: 'bg-red-50 text-red-700 border-red-200' },
};

const COMMISSION_STATUS: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  paid: { label: 'Payée', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Annulée', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

// ============ Format helpers ============
const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// ============ Mock Data ============
interface Ambassador {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  tier: 'bronze' | 'silver' | 'gold';
  referrals: number;
  totalCommissions: number;
  status: 'active' | 'suspended';
  referralCode: string;
  joinDate: string;
}

interface Commission {
  id: string;
  ambassadorId: string;
  ambassadorName: string;
  filleulName: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  date: string;
  tier: 'bronze' | 'silver' | 'gold';
}

const MOCK_AMBASSADORS: Ambassador[] = [
  {
    id: 'AMB-001', name: 'Amadou Diallo', email: 'amadou.diallo@email.com', avatar: null,
    tier: 'gold', referrals: 28, totalCommissions: 1_250_000, status: 'active',
    referralCode: 'AMADOU-X7K2', joinDate: '2024-01-15',
  },
  {
    id: 'AMB-002', name: 'Fatou Coulibaly', email: 'fatou.c@email.com', avatar: null,
    tier: 'gold', referrals: 22, totalCommissions: 980_000, status: 'active',
    referralCode: 'FATOU-P3M9', joinDate: '2024-02-03',
  },
  {
    id: 'AMB-003', name: 'Kofi Mensah', email: 'kofi.m@email.com', avatar: null,
    tier: 'silver', referrals: 12, totalCommissions: 450_000, status: 'active',
    referralCode: 'KOFI-R5N1', joinDate: '2024-03-20',
  },
  {
    id: 'AMB-004', name: 'Aissatou Ba', email: 'aissatou.ba@email.com', avatar: null,
    tier: 'silver', referrals: 8, totalCommissions: 320_000, status: 'active',
    referralCode: 'AISSA-T8V4', joinDate: '2024-04-10',
  },
  {
    id: 'AMB-005', name: 'Ibrahim Traore', email: 'ibrahim.t@email.com', avatar: null,
    tier: 'bronze', referrals: 4, totalCommissions: 95_000, status: 'active',
    referralCode: 'IBRAH-W2J6', joinDate: '2024-05-05',
  },
  {
    id: 'AMB-006', name: 'Mariama Sow', email: 'mariama.sow@email.com', avatar: null,
    tier: 'bronze', referrals: 2, totalCommissions: 45_000, status: 'suspended',
    referralCode: 'MARIA-Y4L8', joinDate: '2024-06-12',
  },
  {
    id: 'AMB-007', name: 'Ousmane Ndiaye', email: 'ousmane.n@email.com', avatar: null,
    tier: 'silver', referrals: 9, totalCommissions: 275_000, status: 'active',
    referralCode: 'OUSMA-Q6H3', joinDate: '2024-07-01',
  },
  {
    id: 'AMB-008', name: 'Aminata Diop', email: 'aminata.d@email.com', avatar: null,
    tier: 'bronze', referrals: 3, totalCommissions: 60_000, status: 'active',
    referralCode: 'AMINA-U9F7', joinDate: '2024-08-18',
  },
];

const MOCK_COMMISSIONS: Commission[] = [
  {
    id: 'COM-001', ambassadorId: 'AMB-001', ambassadorName: 'Amadou Diallo',
    filleulName: 'Moussa Keita', amount: 75_000, status: 'paid', date: '2025-02-10', tier: 'gold',
  },
  {
    id: 'COM-002', ambassadorId: 'AMB-001', ambassadorName: 'Amadou Diallo',
    filleulName: 'Kadia Toure', amount: 45_000, status: 'pending', date: '2025-03-01', tier: 'gold',
  },
  {
    id: 'COM-003', ambassadorId: 'AMB-002', ambassadorName: 'Fatou Coulibaly',
    filleulName: 'Boubacar Sy', amount: 62_000, status: 'paid', date: '2025-01-22', tier: 'gold',
  },
  {
    id: 'COM-004', ambassadorId: 'AMB-003', ambassadorName: 'Kofi Mensah',
    filleulName: 'Adama Ouattara', amount: 35_000, status: 'pending', date: '2025-03-05', tier: 'silver',
  },
  {
    id: 'COM-005', ambassadorId: 'AMB-004', ambassadorName: 'Aissatou Ba',
    filleulName: 'Seydou Cisse', amount: 28_000, status: 'paid', date: '2025-02-14', tier: 'silver',
  },
  {
    id: 'COM-006', ambassadorId: 'AMB-005', ambassadorName: 'Ibrahim Traore',
    filleulName: 'Fatoumata Kamissoko', amount: 15_000, status: 'cancelled', date: '2025-02-28', tier: 'bronze',
  },
  {
    id: 'COM-007', ambassadorId: 'AMB-007', ambassadorName: 'Ousmane Ndiaye',
    filleulName: 'Alassane Diarra', amount: 40_000, status: 'pending', date: '2025-03-08', tier: 'silver',
  },
  {
    id: 'COM-008', ambassadorId: 'AMB-002', ambassadorName: 'Fatou Coulibaly',
    filleulName: 'Djenaba Conte', amount: 52_000, status: 'pending', date: '2025-03-10', tier: 'gold',
  },
  {
    id: 'COM-009', ambassadorId: 'AMB-008', ambassadorName: 'Aminata Diop',
    filleulName: 'Mamadou Bah', amount: 12_000, status: 'paid', date: '2025-01-30', tier: 'bronze',
  },
  {
    id: 'COM-010', ambassadorId: 'AMB-003', ambassadorName: 'Kofi Mensah',
    filleulName: 'Issa Sanogo', amount: 30_000, status: 'pending', date: '2025-03-12', tier: 'silver',
  },
  {
    id: 'COM-011', ambassadorId: 'AMB-006', ambassadorName: 'Mariama Sow',
    filleulName: 'Oumar Baldé', amount: 18_000, status: 'cancelled', date: '2025-02-20', tier: 'bronze',
  },
  {
    id: 'COM-012', ambassadorId: 'AMB-001', ambassadorName: 'Amadou Diallo',
    filleulName: 'Aicha Dembele', amount: 55_000, status: 'pending', date: '2025-03-14', tier: 'gold',
  },
];

// ============ Component ============
export default function AmbassadorsPage() {
  const [activeTab, setActiveTab] = useState('ambassadeurs');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ambPage, setAmbPage] = useState(1);
  const [comPage, setComPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // ============ Computed Stats ============
  const stats = useMemo(() => {
    const totalAmbassadors = MOCK_AMBASSADORS.length;
    const filleulsCeMois = MOCK_AMBASSADORS.reduce((s, a) => s + a.referrals, 0);
    const commissionsEnAttente = MOCK_COMMISSIONS
      .filter(c => c.status === 'pending')
      .reduce((s, c) => s + c.amount, 0);
    const commissionsPayees = MOCK_COMMISSIONS
      .filter(c => c.status === 'paid')
      .reduce((s, c) => s + c.amount, 0);
    return { totalAmbassadors, filleulsCeMois, commissionsEnAttente, commissionsPayees };
  }, []);

  // ============ Filtered Data ============
  const filteredAmbassadors = useMemo(() => {
    return MOCK_AMBASSADORS.filter(a => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'all' || a.tier === levelFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [searchQuery, levelFilter, statusFilter]);

  const filteredCommissions = useMemo(() => {
    return MOCK_COMMISSIONS.filter(c => {
      const matchesSearch =
        c.ambassadorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.filleulName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'all' || c.tier === levelFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [searchQuery, levelFilter, statusFilter]);

  // Pagination
  const ambTotalPages = Math.ceil(filteredAmbassadors.length / ITEMS_PER_PAGE);
  const paginatedAmbassadors = filteredAmbassadors.slice(
    (ambPage - 1) * ITEMS_PER_PAGE,
    ambPage * ITEMS_PER_PAGE
  );

  const comTotalPages = Math.ceil(filteredCommissions.length / ITEMS_PER_PAGE);
  const paginatedCommissions = filteredCommissions.slice(
    (comPage - 1) * ITEMS_PER_PAGE,
    comPage * ITEMS_PER_PAGE
  );

  // ============ Helper: Get initials ============
  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

  // ============ Render ============
  return (
    <div className="min-h-screen space-y-6">
      {/* ---- Page Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: NAVY }}>
            Programme Ambassadeurs
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez le programme de parrainage et les commissions
          </p>
        </div>
        <Button
          className="gap-2 text-white font-semibold shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: GOLD }}
        >
          <UserPlus className="size-4" />
          Ajouter un ambassadeur
        </Button>
      </div>

      {/* ---- Stats Row ---- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total ambassadeurs',
            value: stats.totalAmbassadors,
            icon: Users,
            iconBg: `${NAVY}15`,
            iconColor: NAVY,
          },
          {
            label: 'Filleuls ce mois',
            value: stats.filleulsCeMois,
            icon: TrendingUp,
            iconBg: `${BLUE}15`,
            iconColor: BLUE,
          },
          {
            label: 'Commissions en attente',
            value: formatXOF(stats.commissionsEnAttente),
            icon: Clock,
            iconBg: `${GOLD}20`,
            iconColor: GOLD,
          },
          {
            label: 'Commissions payées',
            value: formatXOF(stats.commissionsPayees),
            icon: Wallet,
            iconBg: `${GREEN}15`,
            iconColor: GREEN,
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <stat.icon className="size-5" style={{ color: stat.iconColor }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold text-gray-900 truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---- Main Content Tabs ---- */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAmbPage(1); setComPage(1); }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-gray-100 p-1 h-auto">
            <TabsTrigger
              value="ambassadeurs"
              className="px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:rounded-md font-medium"
            >
              <Users className="size-4 mr-1.5" />
              Ambassadeurs
            </TabsTrigger>
            <TabsTrigger
              value="commissions"
              className="px-5 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:rounded-md font-medium"
            >
              <DollarSign className="size-4 mr-1.5" />
              Commissions
            </TabsTrigger>
          </TabsList>

          {/* ---- Filters ---- */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setAmbPage(1); setComPage(1); }}
                className="pl-9 w-48 h-9 text-sm bg-white border-gray-200 focus:border-[#003087]/40 focus:ring-[#003087]/20"
              />
            </div>
            <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setAmbPage(1); setComPage(1); }}>
              <SelectTrigger className="w-36 h-9 text-sm bg-white border-gray-200">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setAmbPage(1); setComPage(1); }}>
              <SelectTrigger className="w-36 h-9 text-sm bg-white border-gray-200">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="paid">Payée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ============ Ambassadeurs Tab ============ */}
        <TabsContent value="ambassadeurs" className="mt-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                        Ambassadeur <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Niveau</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                        Filleuls <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                        Commissions totales <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAmbassadors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Users className="size-8 opacity-50" />
                          <p className="text-sm">Aucun ambassadeur trouvé</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAmbassadors.map((amb) => {
                      const tierCfg = TIER_CONFIG[amb.tier];
                      const TierIcon = tierCfg.icon;
                      const statusCfg = AMBASSADOR_STATUS[amb.status];

                      return (
                        <TableRow key={amb.id} className="group hover:bg-gray-50/60 transition-colors">
                          {/* Ambassadeur */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10 border-2 border-white shadow-sm">
                                <AvatarImage src={amb.avatar || undefined} alt={amb.name} />
                                <AvatarFallback
                                  className="text-xs font-semibold text-white"
                                  style={{ backgroundColor: NAVY }}
                                >
                                  {getInitials(amb.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{amb.name}</p>
                                <p className="text-xs text-gray-400 truncate">{amb.email}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Niveau */}
                          <TableCell>
                            <Badge
                              className="gap-1.5 border-0 font-semibold px-2.5 py-1 text-xs shadow-sm"
                              style={{ backgroundColor: tierCfg.bg, color: tierCfg.text }}
                            >
                              <TierIcon className="size-3" />
                              {tierCfg.label}
                            </Badge>
                          </TableCell>

                          {/* Filleuls */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="size-3.5 text-gray-400" />
                              <span className="text-sm font-medium text-gray-700">{amb.referrals}</span>
                            </div>
                          </TableCell>

                          {/* Commissions totales */}
                          <TableCell>
                            <span className="text-sm font-semibold" style={{ color: GREEN }}>
                              {formatXOF(amb.totalCommissions)}
                            </span>
                          </TableCell>

                          {/* Statut */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-medium px-2.5 py-1', statusCfg.className)}
                            >
                              <span className={cn(
                                'size-1.5 rounded-full mr-1.5',
                                amb.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                              )} />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                >
                                  <MoreHorizontal className="size-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                                  <Eye className="size-4 text-gray-400" /> Voir le profil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                                  <Pencil className="size-4 text-gray-400" /> Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                                  <Copy className="size-4 text-gray-400" />
                                  Code : {amb.referralCode}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-2 text-sm cursor-pointer"
                                  style={{ color: RED }}
                                >
                                  <Ban className="size-4" />
                                  {amb.status === 'active' ? 'Suspendre' : 'Réactiver'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {ambTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-400">
                  {filteredAmbassadors.length} ambassadeur{filteredAmbassadors.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="icon" className="size-8"
                    disabled={ambPage <= 1}
                    onClick={() => setAmbPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: ambTotalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === ambPage ? 'default' : 'outline'}
                      size="icon"
                      className={cn('size-8 text-xs', page === ambPage && 'text-white')}
                      style={page === ambPage ? { backgroundColor: NAVY } : {}}
                      onClick={() => setAmbPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline" size="icon" className="size-8"
                    disabled={ambPage >= ambTotalPages}
                    onClick={() => setAmbPage(p => Math.min(ambTotalPages, p + 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============ Commissions Tab ============ */}
        <TabsContent value="commissions" className="mt-4">
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ambassadeur</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filleul</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                        Montant <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                        Date <ArrowUpDown className="size-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCommissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <DollarSign className="size-8 opacity-50" />
                          <p className="text-sm">Aucune commission trouvée</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCommissions.map((com) => {
                      const statusCfg = COMMISSION_STATUS[com.status];
                      const StatusIcon = statusCfg.icon;
                      const tierCfg = TIER_CONFIG[com.tier];

                      return (
                        <TableRow key={com.id} className="group hover:bg-gray-50/60 transition-colors">
                          {/* ID */}
                          <TableCell>
                            <span className="text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {com.id}
                            </span>
                          </TableCell>

                          {/* Ambassadeur */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7 border border-white shadow-sm">
                                <AvatarFallback
                                  className="text-[10px] font-semibold text-white"
                                  style={{ backgroundColor: tierCfg.bg }}
                                >
                                  {getInitials(com.ambassadorName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-800">{com.ambassadorName}</span>
                            </div>
                          </TableCell>

                          {/* Filleul */}
                          <TableCell>
                            <span className="text-sm text-gray-600">{com.filleulName}</span>
                          </TableCell>

                          {/* Montant */}
                          <TableCell>
                            <span className="text-sm font-semibold" style={{ color: GREEN }}>
                              {formatXOF(com.amount)}
                            </span>
                          </TableCell>

                          {/* Statut */}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('gap-1.5 text-xs font-medium px-2.5 py-1', statusCfg.className)}
                            >
                              <StatusIcon className="size-3" />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>

                          {/* Date */}
                          <TableCell>
                            <span className="text-sm text-gray-500">{formatDate(com.date)}</span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                                >
                                  <MoreHorizontal className="size-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2 text-sm cursor-pointer">
                                  <Eye className="size-4 text-gray-400" /> Voir les détails
                                </DropdownMenuItem>
                                {com.status === 'pending' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" style={{ color: GREEN }}>
                                      <CheckCircle2 className="size-4" /> Marquer payée
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2 text-sm cursor-pointer" style={{ color: RED }}>
                                      <XCircle className="size-4" /> Annuler
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {comTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-400">
                  {filteredCommissions.length} commission{filteredCommissions.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="icon" className="size-8"
                    disabled={comPage <= 1}
                    onClick={() => setComPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  {Array.from({ length: comTotalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={page === comPage ? 'default' : 'outline'}
                      size="icon"
                      className={cn('size-8 text-xs', page === comPage && 'text-white')}
                      style={page === comPage ? { backgroundColor: NAVY } : {}}
                      onClick={() => setComPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline" size="icon" className="size-8"
                    disabled={comPage >= comTotalPages}
                    onClick={() => setComPage(p => Math.min(comTotalPages, p + 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
