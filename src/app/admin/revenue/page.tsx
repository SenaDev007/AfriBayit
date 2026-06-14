'use client';

import React, { useState, useCallback } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, CreditCard, DollarSign, Download, GraduationCap, Hotel, Star, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdminRevenue, type AdminRevenueResponse } from '@/hooks/useAdmin';

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };
const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };

const SOURCE_ICONS: Record<string, React.ElementType> = {
  commission: CreditCard,
  subscription: Users,
  academy: GraduationCap,
  hospitality: Hotel,
  fedapay: CreditCard,
  stripe: CreditCard,
  unknown: CreditCard,
};

const SOURCE_COLORS: Record<string, string> = {
  commission: '#003087',
  subscriptions: '#D4AF37',
  academy: '#00A651',
  hospitality: '#8B5CF6',
  fedapay: '#003087',
  stripe: '#D4AF37',
  unknown: '#6B7280',
};

const SOURCE_LABELS: Record<string, string> = {
  commission: 'Commissions',
  subscription: 'Abonnements',
  academy: 'Académie',
  hospitality: 'Hôtellerie',
  fedapay: 'FedaPay',
  stripe: 'Stripe',
  unknown: 'Autre',
};

const TIER_COLORS: Record<string, string> = {
  free: '#9CA3AF',
  starter: '#003087',
  pro: '#D4AF37',
  enterprise: '#00A651',
};

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuit',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatMonthLabel(m: string) {
  // API returns "YYYY-MM", display as "Jan", "Fév", etc.
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const parts = m.split('-');
  if (parts.length === 2) {
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) return months[monthIdx];
  }
  return m;
}

// ============ Skeleton Components ============

function KpiSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${30 + Math.random() * 60}%` }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: cols }).map((_, i) => (
                <TableHead key={i}><Skeleton className="h-3 w-16" /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: cols }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function SourceCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
        <Skeleton className="h-4 w-12" />
      </CardContent>
    </Card>
  );
}

// ============ CSV Export ============

function exportRevenueCSV(data: AdminRevenueResponse) {
  const rows: string[][] = [];

  // Header
  rows.push(['Analyse des Revenus AfriBayit']);
  rows.push([]);

  // KPI
  rows.push(['Revenu total', String(data.totalRevenue)]);
  rows.push(['Commission totale', String(data.totalCommission)]);
  rows.push(['Nombre de transactions', String(data.transactionCount)]);
  rows.push([]);

  // By country
  rows.push(['Revenus par pays']);
  rows.push(['Pays', 'Revenu', 'Transactions']);
  for (const c of data.byCountry) {
    rows.push([c.country || 'N/A', String(c.revenue), String(c.count)]);
  }
  rows.push([]);

  // Monthly trend
  rows.push(['Tendance mensuelle']);
  rows.push(['Mois', 'Revenu', 'Commission']);
  for (const m of data.monthlyTrend) {
    rows.push([m.month, String(m.revenue), String(m.commission)]);
  }
  rows.push([]);

  // By source
  rows.push(['Revenus par source']);
  rows.push(['Source', 'Revenu']);
  for (const s of data.bySource) {
    rows.push([s.source, String(s.revenue)]);
  }
  rows.push([]);

  // Top agents
  rows.push(['Top Agents']);
  rows.push(['Agent', 'Revenu', 'Commission']);
  for (const a of data.topAgents) {
    rows.push([a.agentName, String(a.revenue), String(a.commission)]);
  }
  rows.push([]);

  // Subscription tiers
  rows.push(['Abonnements']);
  rows.push(['Tier', 'Utilisateurs', 'Revenu']);
  for (const t of data.subscriptionTiers) {
    rows.push([t.tier || 'N/A', String(t.count), String(t.revenue)]);
  }

  const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `afribayit-revenus-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============ Main Page ============

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState('month');
  const { data, isLoading, error } = useAdminRevenue({ period });

  const handleExportCSV = useCallback(() => {
    if (data) exportRevenueCSV(data);
  }, [data]);

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Analyse des Revenus</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-red-600">Erreur lors du chargement des données</p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = data?.totalRevenue ?? 0;
  const totalCommission = data?.totalCommission ?? 0;
  const transactionCount = data?.transactionCount ?? 0;
  const avgCommissionRate = totalRevenue > 0 ? ((totalCommission / totalRevenue) * 100) : 0;
  const monthsCount = data?.monthlyTrend.length || 12;
  const avgMonthly = totalRevenue / Math.max(monthsCount, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analyse des Revenus</h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des revenus par source et par pays</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Année</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs"
            onClick={handleExportCSV}
            disabled={!data}
          >
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#003087]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Revenu total</p>
                <p className="text-lg font-bold text-gray-900">{formatXOF(totalRevenue)}</p>
                <p className="text-[11px] text-gray-400">{transactionCount} transactions</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Commission totale</p>
                <p className="text-lg font-bold text-gray-900">{formatXOF(totalCommission)}</p>
                <p className="text-[11px] text-gray-400">{avgCommissionRate.toFixed(1)}% du revenu</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#00A651]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#00A651]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Revenu mensuel moyen</p>
                <p className="text-lg font-bold text-gray-900">{formatXOF(avgMonthly)}</p>
                <p className="text-[11px] text-gray-400">Sur {monthsCount} mois</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Taux de commission</p>
                <p className="text-lg font-bold text-gray-900">{avgCommissionRate.toFixed(1)}%</p>
                <p className="text-[11px] text-gray-400">Moyenne plateforme</p>
              </div>
            </div>
          </>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="byCountry">Par pays</TabsTrigger>
          <TabsTrigger value="bySource">Par source</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {isLoading ? (
            <ChartSkeleton />
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#003087]" /> Tendance mensuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.monthlyTrend.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-900">Aucune donnée disponible</p>
                    <p className="text-xs text-gray-500 mt-1">Les données de tendance apparaîtront ici</p>
                  </div>
                ) : (
                  <div className="flex items-end gap-1.5 h-40">
                    {data!.monthlyTrend.map((item, i) => {
                      const maxRevenue = Math.max(...data!.monthlyTrend.map(m => m.revenue));
                      const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-gray-400 font-mono">{(item.revenue / 1_000_000).toFixed(1)}M</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className={cn('w-full rounded-t-sm min-h-[4px]', i === data!.monthlyTrend.length - 1 ? 'bg-[#D4AF37]' : 'bg-[#003087]/70')}
                          />
                          <span className="text-[9px] text-gray-500">{formatMonthLabel(item.month)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="byCountry" className="space-y-4 mt-4">
          {isLoading ? (
            <TableSkeleton cols={4} />
          ) : (data?.byCountry.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-gray-900">Aucune donnée par pays</p>
                <p className="text-xs text-gray-500 mt-1">Les données apparaîtront avec les transactions</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Pays</TableHead>
                      <TableHead className="text-xs text-right">Revenu</TableHead>
                      <TableHead className="text-xs text-right">Transactions</TableHead>
                      <TableHead className="text-xs text-right">Part</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.byCountry.map((row) => {
                      const pct = totalRevenue > 0 ? ((row.revenue / totalRevenue) * 100) : 0;
                      return (
                        <TableRow key={row.country || 'unknown'}>
                          <TableCell className="text-sm font-medium">
                            {COUNTRY_FLAGS[row.country || ''] || '🌍'} {COUNTRY_NAMES[row.country || ''] || row.country || 'Inconnu'}
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold">{formatXOF(row.revenue)}</TableCell>
                          <TableCell className="text-sm text-right">{row.count}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-[10px] bg-[#003087]/5 text-[#003087] border-[#003087]/20">
                              {pct.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bySource" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SourceCardSkeleton />
              <SourceCardSkeleton />
              <SourceCardSkeleton />
              <SourceCardSkeleton />
            </div>
          ) : (data?.bySource.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-gray-900">Aucune donnée par source</p>
                <p className="text-xs text-gray-500 mt-1">Les données apparaîtront avec les transactions</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data!.bySource.map((source) => {
                const key = source.source.toLowerCase();
                const Icon = SOURCE_ICONS[key] || CreditCard;
                const color = SOURCE_COLORS[key] || '#6B7280';
                const label = SOURCE_LABELS[key] || source.source;
                const pct = totalRevenue > 0 ? (source.revenue / totalRevenue) * 100 : 0;
                return (
                  <Card key={source.source}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-xl font-bold text-gray-900">{formatXOF(source.revenue)}</p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold" style={{ color }}>
                        {pct.toFixed(1)}%
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agents" className="space-y-4 mt-4">
          {isLoading ? (
            <TableSkeleton cols={4} />
          ) : (data?.topAgents.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucun agent</p>
                <p className="text-xs text-gray-500 mt-1">Les top agents apparaîtront avec les transactions</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Agents par Revenu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Agent</TableHead>
                      <TableHead className="text-xs text-right">Revenu généré</TableHead>
                      <TableHead className="text-xs text-right">Commission</TableHead>
                      <TableHead className="text-xs text-right">Part</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.topAgents.map((agent, i) => {
                      const pct = totalRevenue > 0 ? ((agent.revenue / totalRevenue) * 100) : 0;
                      return (
                        <TableRow key={agent.agentId}>
                          <TableCell className="text-sm font-medium">
                            <span className="inline-flex items-center gap-2">
                              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', i === 0 ? 'bg-[#D4AF37]' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300')}>
                                {i + 1}
                              </span>
                              {agent.agentName}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-right font-mono font-bold">{formatXOF(agent.revenue)}</TableCell>
                          <TableCell className="text-sm text-right font-mono">{formatXOF(agent.commission)}</TableCell>
                          <TableCell className="text-sm text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
                              <span className="font-mono">{pct.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4 mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-24 h-4" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4 rounded-full" />
                    </div>
                    <Skeleton className="w-32 h-4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (data?.subscriptionTiers.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-900">Aucun abonnement</p>
                <p className="text-xs text-gray-500 mt-1">Les données d&apos;abonnement apparaîtront ici</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Distribution des Abonnements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data!.subscriptionTiers.map((tier) => {
                    const totalUsers = data!.subscriptionTiers.reduce((s, t) => s + t.count, 0);
                    const pct = totalUsers > 0 ? (tier.count / totalUsers) * 100 : 0;
                    const tierKey = (tier.tier || '').toLowerCase();
                    const color = TIER_COLORS[tierKey] || '#6B7280';
                    const label = TIER_LABELS[tierKey] || tier.tier || 'Inconnu';
                    return (
                      <div key={tier.tier || 'unknown'} className="flex items-center gap-4">
                        <div className="w-24 text-sm font-medium">{label}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{tier.count.toLocaleString()} utilisateurs</span>
                            <span className="font-mono">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: color }} />
                          </div>
                        </div>
                        <div className="w-32 text-right text-sm font-mono font-medium">{tier.revenue > 0 ? formatXOF(tier.revenue) : '—'}</div>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total abonnements</span>
                  <span className="font-mono font-bold">{data!.subscriptionTiers.reduce((s, t) => s + t.count, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="font-medium">Revenu abonnements payants</span>
                  <span className="font-mono font-bold">{formatXOF(data!.subscriptionTiers.reduce((s, t) => s + t.revenue, 0))}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
