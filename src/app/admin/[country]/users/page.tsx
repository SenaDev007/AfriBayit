'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users, Search, ShieldCheck, Mail, MapPin, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  country: string | null;
  city: string | null;
  kycLevel: number;
  verified: boolean;
  createdAt: string;
}

export default function CountryUsersPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery<{ data: UserRow[]; total: number }>({
    queryKey: ['admin-users', country, search, page],
    queryFn: () => apiFetch(`/api/admin/users?country=${country}&search=${encodeURIComponent(search)}&skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`),
  });

  const users = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const kycLabels = ['Anonyme', 'Standard', 'Avancé', 'Pro'];
  const roleLabels: Record<string, string> = { buyer: 'Acheteur', seller: 'Vendeur', agent: 'Agent', investor: 'Investisseur', tourist: 'Touriste', artisan: 'Artisan', notary: 'Notaire', geometer: 'Géomètre', admin: 'Admin' };
  const roleColors: Record<string, string> = { admin: 'bg-red-50 text-red-700', agent: 'bg-blue-50 text-blue-700', buyer: 'bg-green-50 text-green-700', seller: 'bg-purple-50 text-purple-700' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#003087]" />
            Utilisateurs — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestion des utilisateurs du {COUNTRY_NAMES[country]}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {total} utilisateur{total !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="pl-9"
        />
      </div>

      {/* Users table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Utilisateur</th>
                  <th className="text-left p-4 font-medium text-gray-600">Email</th>
                  <th className="text-left p-4 font-medium text-gray-600">Rôle</th>
                  <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                  <th className="text-left p-4 font-medium text-gray-600">KYC</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-600">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Aucun utilisateur trouvé</td></tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-[#003087]" />
                          </div>
                          <span className="font-medium text-gray-900 truncate">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4">
                        <Badge className={`${roleColors[user.role] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-600">{user.city || '—'}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">{kycLabels[user.kycLevel]}</Badge>
                      </td>
                      <td className="p-4">
                        {user.verified ? (
                          <Badge className="bg-green-50 text-green-700 border-0 text-xs"><ShieldCheck className="w-3 h-3 mr-1" />Vérifié</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">Non vérifié</Badge>
                        )}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
