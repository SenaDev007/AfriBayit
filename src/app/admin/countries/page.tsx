'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building2,
  ArrowLeftRight,
  Wallet,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Globe,
  TrendingUp,
} from 'lucide-react';

const PILOT_COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯', capital: 'Cotonou', currency: 'FCFA' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', capital: 'Abidjan', currency: 'FCFA' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', capital: 'Ouagadougou', currency: 'FCFA' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', capital: 'Lomé', currency: 'FCFA' },
];

interface AdminStats {
  users: { total: number; byCountry: Record<string, number>; byRole: Record<string, number> };
  properties: { total: number; byCountry: Record<string, number>; byStatus: Record<string, number>; pending: number };
  transactions: { total: number; totalVolume: number; totalCommission: number; byStatus: Record<string, number> };
  escrow: { active: number; totalHeld: number };
  kyc: { pending: number };
  revenue: { monthly: Array<{ month: string; amount: number }> };
  platform: { activeUsers24h: number; uptime: number };
}

export default function CountriesPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch<AdminStats>('/api/admin/stats'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: accreditationsData } = useQuery({
    queryKey: ['all-accreditations'],
    queryFn: () => apiFetch<{ data: Array<{ country: string; active: boolean }> }>('/api/admin/accreditations'),
    staleTime: 5 * 60 * 1000,
  });

  // Count active accreditations per country
  const accreditationCounts: Record<string, number> = {};
  if (accreditationsData?.data) {
    for (const acc of accreditationsData.data) {
      if (acc.active) {
        accreditationCounts[acc.country] = (accreditationCounts[acc.country] || 0) + 1;
      }
    }
  }

  // Compute per-country transaction volume
  const getCountryRevenue = (code: string) => {
    // Approximation: total commission * (users in country / total users)
    if (!stats) return 0;
    const countryUsers = stats.users.byCountry[code] || 0;
    const totalUsers = stats.users.total || 1;
    return Math.round(stats.transactions.totalVolume * (countryUsers / totalUsers));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#003087]" />
            Pays & Backoffices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion des backoffices par pays — Accréditations et statistiques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
            <TrendingUp className="w-3 h-3 mr-1" />
            4 pays pilotes
          </Badge>
        </div>
      </div>

      {/* Global overview banner */}
      <div className="bg-gradient-to-r from-[#003087] to-[#0047b3] rounded-3xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">AfriBayit — Zone FCFA</h2>
            <p className="text-sm text-white/70">Union Économique et Monétaire Ouest-Africaine</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-2xl font-bold">{stats?.users.total?.toLocaleString('fr-FR') ?? '—'}</p>
            <p className="text-xs text-white/70">Utilisateurs totaux</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-2xl font-bold">{stats?.properties.total?.toLocaleString('fr-FR') ?? '—'}</p>
            <p className="text-xs text-white/70">Propriétés</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-2xl font-bold">{stats?.transactions.total?.toLocaleString('fr-FR') ?? '—'}</p>
            <p className="text-xs text-white/70">Transactions</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3">
            <p className="text-2xl font-bold">
              {stats ? ((stats.transactions.totalVolume / 1000000).toFixed(1) + 'M') : '—'}
            </p>
            <p className="text-xs text-white/70">Volume (FCFA)</p>
          </div>
        </div>
      </div>

      {/* Country cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PILOT_COUNTRIES.map((country) => {
          const userCount = stats?.users.byCountry[country.code] || 0;
          const propCount = stats?.properties.byCountry[country.code] || 0;
          const txCount = stats?.transactions.byStatus
            ? Object.values(stats.transactions.byStatus).reduce((a, b) => a + b, 0)
            : 0;
          const revenue = getCountryRevenue(country.code);
          const accCount = accreditationCounts[country.code] || 0;

          return (
            <Card
              key={country.code}
              className="rounded-3xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              {/* Card top gradient bar */}
              <div className="h-2 bg-gradient-to-r from-[#003087] to-[#D4AF37]" />

              <CardContent className="p-6">
                {/* Country header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#003087]/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      {country.flag}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{country.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] font-mono text-gray-500">
                          {country.code}
                        </Badge>
                        <span className="text-xs text-gray-400">{country.capital}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#D4AF37]/10 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#D4AF37]">{accCount} admins</span>
                  </div>
                </div>

                {/* Stats grid */}
                {statsLoading ? (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2.5 p-3 bg-[#003087]/5 rounded-xl">
                      <Users className="w-4 h-4 text-[#003087]" />
                      <div>
                        <p className="text-lg font-bold text-[#003087]">{userCount.toLocaleString('fr-FR')}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Utilisateurs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-[#003087]/5 rounded-xl">
                      <Building2 className="w-4 h-4 text-[#003087]" />
                      <div>
                        <p className="text-lg font-bold text-[#003087]">{propCount.toLocaleString('fr-FR')}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Propriétés</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-[#003087]/5 rounded-xl">
                      <ArrowLeftRight className="w-4 h-4 text-[#003087]" />
                      <div>
                        <p className="text-lg font-bold text-[#003087]">{txCount.toLocaleString('fr-FR')}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Transactions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-[#D4AF37]/10 rounded-xl">
                      <Wallet className="w-4 h-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-lg font-bold text-[#D4AF37]">
                          {(revenue / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Revenus (FCFA)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link href={`/admin/${country.code}/dashboard`} className="flex-1">
                    <Button className="w-full bg-[#003087] hover:bg-[#0047b3] text-white rounded-xl h-10">
                      Accéder au backoffice
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href={`/admin/${country.code}/accreditations`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-xl h-10"
                    >
                      <KeyRound className="w-4 h-4 mr-2" />
                      Gérer les accréditations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
