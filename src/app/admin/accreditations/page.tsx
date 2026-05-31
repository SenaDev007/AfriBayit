'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Clock, Globe, KeyRound, Plus, Search, ShieldCheck, ShieldX, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PILOT_COUNTRIES = [
  { code: 'ALL', name: 'Tous les pays (SUPER_ADMIN)', flag: '<Globe className="w-4 h-4" />' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

interface Accreditation {
  id: string;
  userId: string;
  country: string;
  role: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt: string | null;
  active: boolean;
  user: { id: string; name: string; email: string; avatar: string | null; role: string };
}

const roleLabels: Record<string, { label: string; color: string; description: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    color: 'bg-red-50 text-red-700 border-red-200',
    description: 'Accès complet à tous les pays + backoffice global',
  },
  COUNTRY_ADMIN: {
    label: 'Admin Pays',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Accès au backoffice du pays assigné uniquement',
  },
};

const countryNameMap: Record<string, string> = {
  ALL: '<Globe className="w-4 h-4" /> Global (tous les pays)',
  BJ: '🇧🇯 Bénin',
  CI: "🇨🇮 Côte d'Ivoire",
  BF: '🇧🇫 Burkina Faso',
  TG: '🇹🇬 Togo',
};

export default function GlobalAccreditationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [grantDialogOpen, setGrantDialogOpen] = useState(false);
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('COUNTRY_ADMIN');
  const [selectedCountry, setSelectedCountry] = useState('BJ');
  const [expiryDate, setExpiryDate] = useState('');
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['all-accreditations'],
    queryFn: () => apiFetch<{ data: Accreditation[] }>('/api/admin/accreditations'),
  });

  const accreditations = data?.data || [];
  const activeAccreditations = accreditations.filter((a) => a.active);
  const revokedAccreditations = accreditations.filter((a) => !a.active);

  const grantMutation = useMutation({
    mutationFn: async () => {
      return apiFetch('/api/admin/accreditations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: searchUserEmail.trim(),
          country: selectedCountry,
          role: selectedRole,
          expiresAt: expiryDate || undefined,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-accreditations'] });
      toast({ title: 'Accréditation accordée', description: `L'utilisateur a été accrédité` });
      setGrantDialogOpen(false);
      setSearchUserEmail('');
      setSelectedRole('COUNTRY_ADMIN');
      setSelectedCountry('BJ');
      setExpiryDate('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message || "Impossible d'accorder l'accréditation",
        variant: 'destructive',
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`/api/admin/accreditations/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-accreditations'] });
      toast({ title: 'Accréditation révoquée', description: "L'accès a été supprimé" });
      setConfirmRevokeId(null);
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de révoquer', variant: 'destructive' });
    },
  });

  const handleGrant = () => {
    if (!searchUserEmail.trim()) return;
    grantMutation.mutate();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Stats
  const superAdminCount = activeAccreditations.filter((a) => a.role === 'SUPER_ADMIN').length;
  const countryAdminCount = activeAccreditations.filter((a) => a.role === 'COUNTRY_ADMIN').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-[#D4AF37]" />
            Accréditations — Global
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion centralisée des accès administrateurs pour tous les pays
          </p>
        </div>
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Accorder une accréditation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#D4AF37]" />
                Accorder une accréditation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* User email */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email de l&apos;utilisateur
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="recherche@exemple.com"
                    value={searchUserEmail}
                    onChange={(e) => setSearchUserEmail(e.target.value)}
                    className="pl-9"
                    type="email"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Saisissez l&apos;email d&apos;un utilisateur existant
                </p>
              </div>

              {/* Role selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Rôle</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-red-500" />
                        Super Admin — Accès à tous les pays
                      </span>
                    </SelectItem>
                    <SelectItem value="COUNTRY_ADMIN">
                      <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-blue-500" />
                        Admin Pays — Accès au pays assigné
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {selectedRole && (
                  <p className="text-xs text-gray-500 mt-1">
                    {roleLabels[selectedRole]?.description}
                  </p>
                )}
              </div>

              {/* Country selection */}
              {selectedRole === 'COUNTRY_ADMIN' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Pays</label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {PILOT_COUNTRIES.filter((c) => c.code !== 'ALL').map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            {c.flag} {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Expiry date */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Date d&apos;expiration (optionnelle)
                </label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button
                onClick={handleGrant}
                className="w-full bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-xl h-11"
                disabled={!searchUserEmail.trim() || grantMutation.isPending}
              >
                {grantMutation.isPending ? 'En cours...' : "Accorder l'accréditation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{activeAccreditations.length}</p>
              <p className="text-xs text-gray-500">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{superAdminCount}</p>
              <p className="text-xs text-gray-500">Super Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{countryAdminCount}</p>
              <p className="text-xs text-gray-500">Admins Pays</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <ShieldX className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-500">{revokedAccreditations.length}</p>
              <p className="text-xs text-gray-500">Révoquées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active accreditations */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            Accréditations actives ({activeAccreditations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Utilisateur</th>
                  <th className="text-left p-4 font-medium text-gray-600">Email</th>
                  <th className="text-left p-4 font-medium text-gray-600">Rôle</th>
                  <th className="text-left p-4 font-medium text-gray-600">Pays</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-600">Accordée le</th>
                  <th className="text-left p-4 font-medium text-gray-600">Expiration</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                ) : activeAccreditations.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">Aucune accréditation active</td></tr>
                ) : (
                  activeAccreditations.map((acc) => {
                    const roleInfo = roleLabels[acc.role] || { label: acc.role, color: 'bg-gray-50 text-gray-600 border-gray-200' };
                    const expired = isExpired(acc.expiresAt);
                    return (
                      <tr key={acc.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                              <UserCircle className="w-4 h-4 text-[#003087]" />
                            </div>
                            <span className="truncate">{acc.user?.name || 'Utilisateur'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">{acc.user?.email || acc.userId}</td>
                        <td className="p-4">
                          <Badge className={`${roleInfo.color} border text-xs`} variant="outline">
                            {roleInfo.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{countryNameMap[acc.country] || acc.country}</span>
                        </td>
                        <td className="p-4">
                          {expired ? (
                            <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs border" variant="outline">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Expirée
                            </Badge>
                          ) : (
                            <Badge className="bg-green-50 text-green-700 border-0 text-xs">
                              <ShieldCheck className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-gray-500 text-xs">
                          {new Date(acc.grantedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-gray-500 text-xs">
                          {acc.expiresAt ? (
                            <span className={cn(expired && 'text-orange-600 font-medium')}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(acc.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-gray-400">Sans expiration</span>
                          )}
                        </td>
                        <td className="p-4">
                          {confirmRevokeId === acc.id ? (
                            <div className="flex items-center gap-1.5">
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => revokeMutation.mutate(acc.id)} disabled={revokeMutation.isPending}>Confirmer</Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmRevokeId(null)}>Annuler</Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmRevokeId(acc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">
                              <ShieldX className="w-4 h-4 mr-1" /> Révoquer
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
