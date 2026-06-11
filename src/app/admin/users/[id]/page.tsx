'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Ban,
  ShieldCheck,
  Key,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Award,
  Wallet,
  Shield,
  Star,
  Building2,
  ArrowLeftRight,
  FileCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAdminUser, useUpdateUser, type AdminUser } from '@/hooks/useAdmin';

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

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };
const KYC_LABELS: Record<number, string> = { 0: 'Anonyme', 1: 'Standard', 2: 'Avancé', 3: 'Pro' };

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: 'Carte d\'identité',
  passport: 'Passeport',
  selfie: 'Selfie de vérification',
  proof_address: 'Justificatif de domicile',
  agent_license: 'Licence agent',
  notary_license: 'Licence notaire',
  geometer_license: 'Licence géomètre',
  business_reg: 'Registre de commerce',
};

const DOC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  ai_validated: 'bg-blue-50 text-blue-700 border-blue-200',
  human_validated: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const DOC_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  ai_validated: 'Validé IA',
  human_validated: 'Validé',
  rejected: 'Rejeté',
};

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(d: string | null) {
  if (!d) return 'Jamais';
  const diff = Date.now() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, isLoading } = useAdminUser(id);
  const updateUser = useUpdateUser(id);

  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [banOpen, setBanOpen] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const user = data?.user;
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-medium text-gray-900">Utilisateur non trouvé</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/users')}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const isBanned = user.role === 'banned';
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const kycDocs = (user as Record<string, unknown>).kycDocuments as Array<Record<string, unknown>> || [];
  const properties = (user as Record<string, unknown>).properties as Array<Record<string, unknown>> || [];
  const transactions = (user as Record<string, unknown>).transactions as Array<Record<string, unknown>> || [];
  const subscriptions = (user as Record<string, unknown>).subscriptions as Array<Record<string, unknown>> || [];
  const counts = (user as Record<string, unknown>)._count as Record<string, number> | undefined;

  const handleUpdateRole = () => {
    updateUser.mutate(
      { role: newRole } as Partial<AdminUser>,
      {
        onSuccess: () => {
          toast.success(`Rôle mis à jour : ${ROLE_LABELS[newRole] || newRole}`);
          setEditRoleOpen(false);
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
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
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleUnban = () => {
    updateUser.mutate(
      { role: 'buyer' } as Partial<AdminUser>,
      {
        onSuccess: () => toast.success('Utilisateur rétabli'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleVerify = () => {
    updateUser.mutate(
      { verified: true } as Partial<AdminUser>,
      {
        onSuccess: () => toast.success('Compte vérifié'),
        onError: () => toast.error('Erreur'),
      }
    );
  };

  const handleResetPw = () => {
    toast.success('Email de réinitialisation envoyé');
    setResetPwOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Utilisateurs
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setNewRole(user.role); setEditRoleOpen(true); }}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
            Modifier rôle
          </Button>
          {!user.verified && !isBanned && (
            <Button variant="outline" size="sm" onClick={handleVerify} className="text-green-600 border-green-200 hover:bg-green-50">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Vérifier
            </Button>
          )}
          {isBanned ? (
            <Button variant="outline" size="sm" onClick={handleUnban} className="text-green-600 border-green-200 hover:bg-green-50">
              Rétablir
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setBanOpen(true)} className="text-red-600 border-red-200 hover:bg-red-50">
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              Bannir
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setResetPwOpen(true)}>
            <Key className="w-3.5 h-3.5 mr-1.5" />
            Reset MDP
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="bg-[#003087] text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
              <Badge variant="secondary" className="text-xs">
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
              {user.verified && (
                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <ShieldCheck className="w-3 h-3 mr-1" /> Vérifié
                </Badge>
              )}
              {isBanned && (
                <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                  <Ban className="w-3 h-3 mr-1" /> Banni
                </Badge>
              )}
              {user.premiumTier && (
                <Badge className="bg-[#D4AF37]/10 text-[#B8962E] text-xs">
                  <Star className="w-3 h-3 mr-1" /> {user.premiumTier}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" /> {user.email}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" /> {user.phone || '—'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />{' '}
                {user.city ? `${user.city}, ` : ''}{user.country ? `${COUNTRY_FLAGS[user.country] || ''} ${user.country}` : '—'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" /> Inscrit le {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-gray-100">
          {[
            { label: 'KYC', value: `Niveau ${user.kycLevel}`, sub: KYC_LABELS[user.kycLevel] },
            { label: 'Score', value: user.score, sub: '/ 1000' },
            { label: 'Réputation', value: user.reputation, sub: '' },
            { label: 'Portefeuille', value: formatXOF(user.walletBalance), sub: '' },
            { label: 'Escrow bloqué', value: formatXOF(user.escrowHeld), sub: '' },
            { label: 'AfriPoints', value: user.afriPoints, sub: 'pts' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">{stat.value}</p>
              {stat.sub && <p className="text-[10px] text-gray-400">{stat.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profil" className="space-y-4">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="profil" className="text-xs">Profil</TabsTrigger>
          <TabsTrigger value="proprietes" className="text-xs">
            Propriétés ({counts?.properties ?? properties.length})
          </TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">
            Transactions ({counts?.transactions ?? transactions.length})
          </TabsTrigger>
          <TabsTrigger value="portefeuille" className="text-xs">Portefeuille</TabsTrigger>
          <TabsTrigger value="abonnements" className="text-xs">
            Abonnements ({subscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
        </TabsList>

        {/* Profil Tab */}
        <TabsContent value="profil">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* KYC Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#003087]" />
                  Documents KYC
                </CardTitle>
              </CardHeader>
              <CardContent>
                {kycDocs.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun document KYC</p>
                ) : (
                  <div className="space-y-2">
                    {kycDocs.map((doc: Record<string, unknown>) => (
                      <div key={doc.id as string} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', DOC_STATUS_COLORS[doc.status as string] || 'bg-gray-100')}>
                            {doc.status === 'human_validated' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : doc.status === 'rejected' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {DOC_TYPE_LABELS[doc.docType as string] || (doc.docType as string)}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {formatDate(doc.createdAt as string)}
                              {doc.aiScore != null && ` · Score IA: ${Math.round(doc.aiScore as number)}%`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px]', DOC_STATUS_COLORS[doc.status as string])}>
                          {DOC_STATUS_LABELS[doc.status as string] || (doc.status as string)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#003087]" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: Calendar, color: 'bg-blue-50 text-blue-500', text: 'Inscription', time: formatDate(user.createdAt) },
                    ...(user.lastSeenAt ? [{ icon: Eye, color: 'bg-green-50 text-green-500', text: 'Dernière connexion', time: timeAgo(user.lastSeenAt) }] : []),
                    ...(user.verified ? [{ icon: ShieldCheck, color: 'bg-green-50 text-green-500', text: 'Compte vérifié', time: formatDate(user.updatedAt) }] : []),
                    ...(kycDocs.length > 0 ? [{ icon: FileCheck, color: 'bg-amber-50 text-amber-500', text: `${kycDocs.length} document(s) KYC`, time: formatDate(kycDocs[0]?.createdAt as string || user.createdAt) }] : []),
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', item.color)}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">{item.text}</p>
                        <p className="text-[11px] text-gray-400">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Propriétés Tab */}
        <TabsContent value="proprietes">
          <Card>
            <CardContent className="p-0">
              {properties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Building2 className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Aucune propriété</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Titre</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Prix</TableHead>
                      <TableHead className="text-xs">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.map((prop: Record<string, unknown>) => (
                      <TableRow key={prop.id as string}>
                        <TableCell className="text-sm font-medium">{prop.title as string}</TableCell>
                        <TableCell className="text-sm text-gray-600">{prop.type as string}</TableCell>
                        <TableCell className="text-sm font-mono">{formatXOF(prop.price as number)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{prop.status as string}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <ArrowLeftRight className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Aucune transaction</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Montant</TableHead>
                      <TableHead className="text-xs">Commission</TableHead>
                      <TableHead className="text-xs">Statut</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: Record<string, unknown>) => (
                      <TableRow key={tx.id as string}>
                        <TableCell className="text-xs font-mono text-gray-500">{(tx.id as string).slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm font-mono">{formatXOF(tx.amount as number)}</TableCell>
                        <TableCell className="text-sm font-mono text-gray-500">{formatXOF(tx.commission as number)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{tx.status as string}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">{formatDate(tx.createdAt as string)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portefeuille Tab */}
        <TabsContent value="portefeuille">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Wallet className="w-8 h-8 text-[#003087] mx-auto mb-2" />
                <p className="text-[11px] text-gray-500 uppercase">Solde</p>
                <p className="text-xl font-bold text-gray-900">{formatXOF(user.walletBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-[11px] text-gray-500 uppercase">Escrow bloqué</p>
                <p className="text-xl font-bold text-gray-900">{formatXOF(user.escrowHeld)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
                <p className="text-[11px] text-gray-500 uppercase">AfriPoints</p>
                <p className="text-xl font-bold text-gray-900">{user.afriPoints} pts</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Abonnements Tab */}
        <TabsContent value="abonnements">
          <Card>
            <CardContent className="p-0">
              {subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Aucun abonnement</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs">Prix</TableHead>
                      <TableHead className="text-xs">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub: Record<string, unknown>, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{sub.planType as string}</TableCell>
                        <TableCell className="text-sm font-mono">{formatXOF(sub.priceXof as number)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{sub.status as string}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setNewRole(user.role); setEditRoleOpen(true); }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-[#003087]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Modifier le rôle</p>
                  <p className="text-xs text-gray-500">Actuel : {ROLE_LABELS[user.role]}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={handleVerify} >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Vérifier le compte</p>
                  <p className="text-xs text-gray-500">{user.verified ? 'Déjà vérifié' : 'Non vérifié'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => isBanned ? handleUnban() : setBanOpen(true)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', isBanned ? 'bg-green-50' : 'bg-red-50')}>
                  {isBanned ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <Ban className="w-5 h-5 text-red-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{isBanned ? 'Rétablir le compte' : 'Bannir le compte'}</p>
                  <p className="text-xs text-gray-500">{isBanned ? 'Réactiver l\'utilisateur' : 'Désactiver l\'utilisateur'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setResetPwOpen(true)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Réinitialiser le mot de passe</p>
                  <p className="text-xs text-gray-500">Envoyer un email de reset</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleOpen} onOpenChange={setEditRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle de {user.name}</DialogTitle>
            <DialogDescription>Sélectionnez le nouveau rôle</DialogDescription>
          </DialogHeader>
          <Select value={newRole} onValueChange={setNewRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Annuler</Button>
            <Button className="bg-[#003087] hover:bg-[#002a70]" onClick={handleUpdateRole} disabled={updateUser.isPending}>
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
            <DialogDescription>Cette action désactivera le compte.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleBan} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Bannissement...' : 'Confirmer le bannissement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>Un email de réinitialisation sera envoyé à {user.email}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwOpen(false)}>Annuler</Button>
            <Button className="bg-[#003087] hover:bg-[#002a70]" onClick={handleResetPw}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
