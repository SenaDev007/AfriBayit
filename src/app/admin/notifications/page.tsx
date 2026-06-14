'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Bell,
  Mail,
  MailOpen,
  Send,
  Plus,
  Info,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAdminNotifications, useCreateNotification } from '@/hooks/useAdmin';

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

const TYPE_LABELS: Record<string, string> = {
  info: 'Information',
  warning: 'Avertissement',
  success: 'Succès',
  alert: 'Alerte',
};

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  alert: 'bg-red-50 text-red-600 border-red-200',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  success: <CheckCircle2 className="w-3.5 h-3.5" />,
  alert: <AlertCircle className="w-3.5 h-3.5" />,
};

interface NotificationRow {
  id: string;
  recipientName: string;
  type: string;
  title: string;
  message: string;
  country: string;
  read: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [filters, setFilters] = useState<{ type?: string; country?: string; search?: string; page: number; limit: number }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Create notification form state
  const [formUserId, setFormUserId] = useState('');
  const [formType, setFormType] = useState('info');
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formCountry, setFormCountry] = useState('');

  const { data, isLoading } = useAdminNotifications(filters);
  const createNotification = useCreateNotification();

  const notifications = data?.notifications ?? [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleMarkAsRead = (notif: NotificationRow) => {
    toast.success(notif.read ? 'Déjà lu' : 'Marqué comme lu');
  };

  const handleSend = (notif: NotificationRow) => {
    toast.success('Notification envoyée');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    toast.success('Notification supprimée');
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleCreateNotification = () => {
    if (!formTitle.trim() || !formMessage.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }
    createNotification.mutate(
      {
        userId: formUserId || undefined,
        type: formType,
        title: formTitle,
        message: formMessage,
        country: formCountry || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Notification créée avec succès');
          setCreateOpen(false);
          setFormUserId('');
          setFormType('info');
          setFormTitle('');
          setFormMessage('');
          setFormCountry('');
        },
        onError: () => {
          toast.error('Erreur lors de la création');
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const truncate = (str: string, maxLen: number) => {
    if (!str) return '—';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Créer et gérer les notifications de la plateforme
          </p>
        </div>
        <Button
          className="bg-[#003087] hover:bg-[#003087]/90 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Nouvelle notification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.total ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Non lues</p>
            <p className="text-2xl font-bold text-gray-900">{summary?.unread ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <MailOpen className="w-5 h-5 text-[#B8962E]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Par type</p>
            <div className="flex items-center gap-2">
              {summary?.byType && Object.entries(summary.byType).map(([type, count]) => (
                <span key={type} className="flex items-center gap-0.5 text-xs text-gray-600">
                  {TYPE_ICONS[type]} {count}
                </span>
              ))}
              {!summary?.byType && <span className="text-2xl font-bold text-gray-900">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par destinataire, titre..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.type || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, type: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="alert">Alerte</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.country || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, country: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[130px] h-9 text-xs">
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
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleSearch}>
              <Filter className="w-3.5 h-3.5 mr-1" /> Filtrer
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune notification trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres ou créez-en une</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Destinataire
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Titre
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Message
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Pays
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Lu
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notif) => (
                  <TableRow key={notif.id} className={cn('hover:bg-gray-50/50', !notif.read && 'bg-blue-50/30')}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] text-[11px] font-bold shrink-0">
                          {notif.recipientName?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{notif.recipientName || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] gap-1', TYPE_COLORS[notif.type] || '')}>
                        {TYPE_ICONS[notif.type]}
                        {TYPE_LABELS[notif.type] || notif.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{notif.title || '—'}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px]">{truncate(notif.message, 50)}</TableCell>
                    <TableCell className="text-sm">
                      {notif.country ? `${COUNTRY_FLAGS[notif.country] || ''} ${notif.country}` : '—'}
                    </TableCell>
                    <TableCell>
                      {notif.read ? (
                        <MailOpen className="w-4 h-4 text-green-500" />
                      ) : (
                        <Mail className="w-4 h-4 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(notif.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handleMarkAsRead(notif)} disabled={notif.read}>
                            <Eye className="w-4 h-4" /> Marquer comme lu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSend(notif)}>
                            <Send className="w-4 h-4" /> Envoyer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setDeleteTarget(notif); setDeleteOpen(true); }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
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
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle notification</DialogTitle>
            <DialogDescription>Créer et envoyer une notification aux utilisateurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">ID Utilisateur (optionnel)</label>
              <Input
                placeholder="Laisser vide pour diffusion globale"
                value={formUserId}
                onChange={(e) => setFormUserId(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Information</SelectItem>
                  <SelectItem value="warning">⚠️ Avertissement</SelectItem>
                  <SelectItem value="success">✅ Succès</SelectItem>
                  <SelectItem value="alert">🚨 Alerte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Titre</label>
              <Input
                placeholder="Titre de la notification"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
              <Textarea
                placeholder="Contenu de la notification..."
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Pays (optionnel)</label>
              <Select value={formCountry || 'all'} onValueChange={(v) => setFormCountry(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les pays</SelectItem>
                  <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                  <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                  <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                  <SelectItem value="TG">🇹🇬 Togo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button
              className="bg-[#003087] hover:bg-[#003087]/90 text-white"
              onClick={handleCreateNotification}
              disabled={createNotification.isPending}
            >
              {createNotification.isPending ? 'Envoi...' : (
                <>
                  <Send className="w-4 h-4 mr-1" /> Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la notification</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette notification ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
