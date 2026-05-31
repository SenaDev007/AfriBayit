'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPatch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
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
import { Users, Search, Shield, ShieldCheck, Eye, Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };

const roleLabels: Record<string, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  agent: 'Agent',
  investor: 'Investisseur',
  tourist: 'Touriste',
  artisan: 'Artisan',
  notary: 'Notaire',
  geometer: 'Géomètre',
  admin: 'Admin',
};

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  verified: boolean;
  city: string | null;
  kycLevel: number;
  createdAt: string;
}

export default function CountryUsersPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', country, searchQuery, page],
    queryFn: () => {
      const params = new URLSearchParams({ country, limit: '25', page: String(page) });
      if (searchQuery) params.set('search', searchQuery);
      return apiFetch<{ users: UserItem[]; pagination: { total: number; pages: number } }>(
        `/api/admin/users?${params.toString()}`
      );
    },
  });

  const users = data?.users || [];
  const pagination = data?.pagination || { total: 0, pages: 0 };

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiPatch(`/api/admin/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users', country] });
      setEditDialogOpen(false);
      toast({ title: 'Rôle mis à jour', description: 'Le rôle de l\'utilisateur a été modifié' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de modifier le rôle', variant: 'destructive' });
    },
  });

  const handleEditRole = (user: UserItem) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditDialogOpen(true);
  };

  const saveRole = () => {
    if (editingUser && editRole) {
      updateRoleMutation.mutate({ id: editingUser.id, role: editRole });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs — {COUNTRY_NAMES[country]}</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} utilisateurs dans ce pays</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Utilisateur</th>
                  <th className="text-left p-4 font-medium text-gray-600">Email</th>
                  <th className="text-left p-4 font-medium text-gray-600">Rôle</th>
                  <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                  <th className="text-left p-4 font-medium text-gray-600">KYC</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
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
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4 text-[#003087]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-400">Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-600">{user.city || '—'}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          Niveau {user.kycLevel}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {user.verified ? (
                          <Badge className="bg-green-50 text-green-700 text-xs border-0">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Vérifié
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-500">Non vérifié</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-[#003087]/5"
                            title="Voir le profil"
                          >
                            <Eye className="w-4 h-4 text-[#003087]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-[#D4AF37]/10"
                            title="Modifier le rôle"
                            onClick={() => handleEditRole(user)}
                          >
                            <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                          </Button>
                        </div>
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
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} / {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Utilisateur</p>
                <p className="font-semibold">{editingUser.name}</p>
                <p className="text-xs text-gray-400">{editingUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nouveau rôle</label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Acheteur</SelectItem>
                    <SelectItem value="seller">Vendeur</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="investor">Investisseur</SelectItem>
                    <SelectItem value="artisan">Artisan</SelectItem>
                    <SelectItem value="notary">Notaire</SelectItem>
                    <SelectItem value="geometer">Géomètre</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={saveRole}
                className="w-full bg-[#003087] hover:bg-[#0047b3] text-white"
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
