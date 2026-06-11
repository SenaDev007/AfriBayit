'use client';

import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, CreditCard, DollarSign, Download, Globe2, GraduationCap, Hotel, Star, TrendingUp, Users } from 'lucide-react';
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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

const revenueByCountry = [
  { country: 'BJ', name: 'Bénin', amount: 45_230_000, growth: 12.5, subscriptions: 15_800_000, commissions: 22_430_000, academy: 4_200_000, hospitality: 2_800_000 },
  { country: 'CI', name: "Côte d'Ivoire", amount: 38_750_000, growth: 18.2, subscriptions: 12_500_000, commissions: 19_200_000, academy: 3_850_000, hospitality: 3_200_000 },
  { country: 'BF', name: 'Burkina Faso', amount: 22_150_000, growth: 8.7, subscriptions: 8_200_000, commissions: 11_350_000, academy: 1_600_000, hospitality: 1_000_000 },
  { country: 'TG', name: 'Togo', amount: 18_900_000, growth: 15.3, subscriptions: 7_100_000, commissions: 9_200_000, academy: 1_600_000, hospitality: 1_000_000 },
];

const monthlyTrend = [
  { month: 'Jan', revenue: 8_500_000 },
  { month: 'Fév', revenue: 9_200_000 },
  { month: 'Mar', revenue: 10_100_000 },
  { month: 'Avr', revenue: 9_800_000 },
  { month: 'Mai', revenue: 11_500_000 },
  { month: 'Jun', revenue: 12_300_000 },
  { month: 'Jul', revenue: 10_800_000 },
  { month: 'Aoû', revenue: 9_500_000 },
  { month: 'Sep', revenue: 11_200_000 },
  { month: 'Oct', revenue: 12_800_000 },
  { month: 'Nov', revenue: 13_500_000 },
  { month: 'Déc', revenue: 14_200_000 },
];

const topAgents = [
  { name: 'Adama Diallo', country: 'BJ', revenue: 8_500_000, transactions: 32, rating: 4.9 },
  { name: 'Fatou Koné', country: 'CI', revenue: 7_200_000, transactions: 28, rating: 4.8 },
  { name: 'Moussa Traoré', country: 'BF', revenue: 5_800_000, transactions: 22, rating: 4.7 },
  { name: 'Kofi Mensah', country: 'TG', revenue: 4_900_000, transactions: 19, rating: 4.6 },
  { name: 'Aïcha Bello', country: 'BJ', revenue: 4_200_000, transactions: 16, rating: 4.8 },
];

const subscriptionTiers = [
  { tier: 'Gratuit', users: 12500, percentage: 55, revenue: 0, color: '#9CA3AF' },
  { tier: 'Starter', users: 6200, percentage: 27, revenue: 18_600_000, color: '#003087' },
  { tier: 'Pro', users: 3100, percentage: 14, revenue: 27_900_000, color: '#D4AF37' },
  { tier: 'Enterprise', users: 950, percentage: 4, revenue: 19_000_000, color: '#00A651' },
];

const revenueBySource = [
  { source: 'Commissions', amount: 62_180_000, icon: CreditCard, color: '#003087' },
  { source: 'Abonnements', amount: 43_600_000, icon: Users, color: '#D4AF37' },
  { source: 'Académie', amount: 11_250_000, icon: GraduationCap, color: '#00A651' },
  { source: 'Hôtellerie', amount: 8_000_000, icon: Hotel, color: '#8B5CF6' },
];

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState('12m');

  const totalRevenue = revenueByCountry.reduce((sum, r) => sum + r.amount, 0);
  const avgGrowth = revenueByCountry.reduce((sum, r) => sum + r.growth, 0) / revenueByCountry.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#003087]" />
            Analyse des Revenus
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi des revenus par source et par pays</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 mois</SelectItem>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="6m">6 mois</SelectItem>
              <SelectItem value="12m">12 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Revenu total</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{formatXOF(totalRevenue)}</p>
            <p className="text-[11px] text-green-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +{avgGrowth.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Abonnements actifs</p>
            <p className="text-2xl font-bold text-gray-900 font-display">22,750</p>
            <p className="text-[11px] text-green-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +8.3%
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#00A651]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#00A651]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Revenu mensuel moyen</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{formatXOF(totalRevenue / 12)}</p>
            <p className="text-[11px] text-green-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +5.7%
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Commission moyenne</p>
            <p className="text-2xl font-bold text-gray-900 font-display">2.8%</p>
            <p className="text-[11px] text-red-500 flex items-center gap-0.5">
              <ArrowDownRight className="w-3 h-3" /> -0.3%
            </p>
          </div>
        </div>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#003087]" /> Tendance mensuelle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1.5 h-40">
                {monthlyTrend.map((item, i) => {
                  const maxRevenue = Math.max(...monthlyTrend.map(m => m.revenue));
                  const heightPercent = (item.revenue / maxRevenue) * 100;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-gray-400 font-mono">{(item.revenue / 1_000_000).toFixed(1)}M</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className={cn('w-full rounded-t-sm min-h-[4px]', i === monthlyTrend.length - 1 ? 'bg-[#D4AF37]' : 'bg-[#003087]/70')}
                      />
                      <span className="text-[9px] text-gray-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="byCountry" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Pays</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right">Abonnements</TableHead>
                    <TableHead className="text-xs text-right">Commissions</TableHead>
                    <TableHead className="text-xs text-right">Académie</TableHead>
                    <TableHead className="text-xs text-right">Hôtellerie</TableHead>
                    <TableHead className="text-xs text-right">Croissance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByCountry.map((row) => (
                    <TableRow key={row.country}>
                      <TableCell className="text-sm font-medium">{COUNTRY_FLAGS[row.country]} {row.name}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-bold">{formatXOF(row.amount)}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{formatXOF(row.subscriptions)}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{formatXOF(row.commissions)}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{formatXOF(row.academy)}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{formatXOF(row.hospitality)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn('text-[10px]', row.growth > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
                          +{row.growth}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bySource" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {revenueBySource.map((source) => {
              const Icon = source.icon;
              return (
                <Card key={source.source}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${source.color}15` }}>
                      <Icon className="w-6 h-6" style={{ color: source.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{source.source}</p>
                      <p className="text-xl font-bold text-gray-900">{formatXOF(source.amount)}</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2">
                        <div className="h-full rounded-full" style={{ width: `${(source.amount / totalRevenue) * 100}%`, backgroundColor: source.color }} />
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold" style={{ color: source.color }}>
                      {((source.amount / totalRevenue) * 100).toFixed(1)}%
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Agents par Revenu</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Agent</TableHead>
                    <TableHead className="text-xs">Pays</TableHead>
                    <TableHead className="text-xs text-right">Revenu généré</TableHead>
                    <TableHead className="text-xs text-right">Transactions</TableHead>
                    <TableHead className="text-xs text-right">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topAgents.map((agent, i) => (
                    <TableRow key={agent.name}>
                      <TableCell className="text-sm font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', i === 0 ? 'bg-[#D4AF37]' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300')}>
                            {i + 1}
                          </span>
                          {agent.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{COUNTRY_FLAGS[agent.country]} {agent.country}</TableCell>
                      <TableCell className="text-sm text-right font-mono font-bold">{formatXOF(agent.revenue)}</TableCell>
                      <TableCell className="text-sm text-right">{agent.transactions}</TableCell>
                      <TableCell className="text-sm text-right"><span className="text-[#D4AF37]"><Star className="w-4 h-4" /></span> {agent.rating}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Distribution des Abonnements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptionTiers.map((tier) => (
                  <div key={tier.tier} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{tier.tier}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">{tier.users.toLocaleString()} utilisateurs</span>
                        <span className="font-mono">{tier.percentage}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${tier.percentage}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: tier.color }} />
                      </div>
                    </div>
                    <div className="w-32 text-right text-sm font-mono font-medium">{tier.revenue > 0 ? formatXOF(tier.revenue) : '—'}</div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total abonnements payants</span>
                <span className="font-mono font-bold">{formatXOF(subscriptionTiers.reduce((s, t) => s + t.revenue, 0))}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
