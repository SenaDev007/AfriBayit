'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit3,
  Ban,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  useAdminUsers,
  useUpdateUser,
  type AdminUser,
  type AdminUserFilters,
} from '@/hooks/useAdmin';

const ROLE_LABELS: Record<string, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  agent: 'Agent',
  investor: 'Investisseur',
  tourist: 'Touriste',
  artisan: 'Artisan',
  notary: 'Notaire',
  geometer: 'Géomètre',
  admin: 'Admin',
  banned: 'Banni',
};

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

const KYC_LABELS: Record<number, string> = {
  0: 'Anonyme',
  1: 'Standard',
  2: 'Avancé',
  3: 'Pro',
};

const KYC_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-50 text-blue-700',
  2: 'bg-green-50 text-green-700',
  3: 'bg-[#D4AF37]/10 text-[#B8962E]',
};

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<AdminUserFilters>({ page: 1, limit: 20 });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useAdminUsers(filters);
  const users = data?.users || [];
  const pagination = data?.pagination;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination ? `${pagination.total} utilisateurs au total` : 'Chargement...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exporter
          </Button>
          <Button size="sm" className="text-xs bg-[#003087] hover:bg-[#002a70]">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.role || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, role: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="buyer">Acheteur</SelectItem>
                <SelectItem value="seller">Vendeur</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="artisan">Artisan</SelectItem>
                <SelectItem value="notary">Notaire</SelectItem>
                <SelectItem value="geometer">Géomètre</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
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
              </SelectContent>
            </Select>

            <Select
              value={filters.status || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="verified">Vérifié</SelectItem>
                <SelectItem value="unverified">Non vérifié</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleSearch}
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filtrer
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun utilisateur trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Utilisateur
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Email
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Rôle
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pays
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    KYC
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Score
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </TableBody>
            </Table>

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
                  {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          'h-8 w-8 p-0 text-xs',
                          pageNum === pagination.page && 'bg-[#003087] hover:bg-[#002a70]'
                        )}
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, page: pageNum }))
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
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
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [newRole, setNewRole] = useState(user.role);
  const [banReason, setBanReason] = useState('');
  const updateUser = useUpdateUser(user.id);

  const handleUpdateRole = () => {
    updateUser.mutate(
      { role: newRole } as Partial<AdminUser>,
      {
        onSuccess: () => {
          toast.success(`Rôle mis à jour : ${ROLE_LABELS[newRole] || newRole}`);
          setEditRoleOpen(false);
        },
        onError: () => toast.error('Erreur lors de la mise à jour du rôle'),
      }
    );
  };

  const handleBan = () => {
    updateUser.mutate(
      { role: 'banned' } as Partial<AdminUser>,
      {
        onSuccess: () => {
          toast.success('Utilisateur banni');
          setBanOpen(false);
        },
        onError: () => toast.error('Erreur lors du bannissement'),
      }
    );
  };

  const handleVerify = () => {
    updateUser.mutate(
      { verified: true } as Partial<AdminUser>,
      {
        onSuccess: () => toast.success('Utilisateur vérifié'),
        onError: () => toast.error('Erreur lors de la vérification'),
      }
    );
  };

  const handleUnban = () => {
    updateUser.mutate(
      { role: 'buyer' } as Partial<AdminUser>,
      {
        onSuccess: () => toast.success('Utilisateur rétabli'),
        onError: () => toast.error('Erreur lors du rétablissement'),
      }
    );
  };

  const isBanned = user.role === 'banned';
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <TableRow className="hover:bg-gray-50/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-9 h-9">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {user.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {user._count?.properties || 0} biens · {user._count?.transactions || 0} tx
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className={cn(
              'text-[11px] font-medium',
              user.role === 'admin' && 'bg-[#D4AF37]/10 text-[#B8962E]',
              user.role === 'agent' && 'bg-[#003087]/10 text-[#003087]',
              isBanned && 'bg-red-50 text-red-600'
            )}
          >
            {ROLE_LABELS[user.role] || user.role}
          </Badge>
        </TableCell>
        <TableCell>
          <span className="text-sm">
            {user.country ? `${COUNTRY_FLAGS[user.country] || ''} ${user.country}` : '—'}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={cn('text-[11px]', KYC_COLORS[user.kycLevel])}>
            Niv. {user.kycLevel} — {KYC_LABELS[user.kycLevel]}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#003087] rounded-full"
                style={{ width: `${Math.min((user.score / 1000) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-mono">{user.score}</span>
          </div>
        </TableCell>
        <TableCell>
          {isBanned ? (
            <Badge className="bg-red-50 text-red-600 border-red-200 text-[11px]">Banni</Badge>
          ) : user.verified ? (
            <Badge className="bg-green-50 text-green-700 border-green-200 text-[11px]">
              Vérifié
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] text-gray-500">
              Non vérifié
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Voir le détail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditRoleOpen(true)}>
                <Edit3 className="w-4 h-4" />
                Modifier le rôle
              </DropdownMenuItem>
              {!user.verified && !isBanned && (
                <DropdownMenuItem onClick={handleVerify}>
                  <ShieldCheck className="w-4 h-4" />
                  Vérifier
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {isBanned ? (
                <DropdownMenuItem onClick={handleUnban} className="text-green-600">
                  <ShieldCheck className="w-4 h-4" />
                  Rétablir
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setBanOpen(true)} className="text-red-600">
                  <Ban className="w-4 h-4" />
                  Bannir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Changer le rôle de {user.name}
            </DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger>
              <SelectValue />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-[#003087] hover:bg-[#002a70]"
              onClick={handleUpdateRole}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banOpen} onOpenChange={setBanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bannir {user.name}</DialogTitle>
            <DialogDescription>
              Cette action désactivera le compte de cet utilisateur.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du bannissement (optionnel)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Bannissement...' : 'Bannir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
