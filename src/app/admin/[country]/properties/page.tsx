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
} from '@/components/ui/dialog';
import {
  Building2,
  MapPin,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  Crown,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };

const statusColors: Record<string, string> = {
  published: 'bg-green-50 text-green-700 border-green-200',
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
  sold: 'bg-blue-50 text-blue-700 border-blue-200',
  rented: 'bg-purple-50 text-purple-700 border-purple-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ai_review: 'bg-sky-50 text-sky-700 border-sky-200',
  human_review: 'bg-violet-50 text-violet-700 border-violet-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const statusLabels: Record<string, string> = {
  published: 'Publiée',
  draft: 'Brouillon',
  sold: 'Vendue',
  rented: 'Louée',
  pending: 'En attente',
  ai_review: 'Revue IA',
  human_review: 'Revue humaine',
  rejected: 'Rejetée',
};

interface PropertyItem {
  id: string;
  title: string;
  type: string;
  city: string;
  quartier: string;
  price: number;
  status: string;
  verified: boolean;
  premium: boolean;
  views: number;
  bedrooms: number;
  surface: number;
}

export default function CountryPropertiesPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionProperty, setActionProperty] = useState<PropertyItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'feature' | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-properties', country, searchQuery, statusFilter, page],
    queryFn: () => {
      const p = new URLSearchParams({ country, limit: '25', page: String(page) });
      if (searchQuery) p.set('search', searchQuery);
      if (statusFilter) p.set('status', statusFilter);
      return apiFetch<{ properties: PropertyItem[]; pagination: { total: number; pages: number } }>(
        `/api/admin/properties?${p.toString()}`
      );
    },
  });

  const properties = data?.properties || [];
  const pagination = data?.pagination || { total: 0, pages: 0 };

  const actionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiPatch(`/api/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties', country] });
      setActionProperty(null);
      setActionType(null);
      setRejectReason('');
      toast({ title: 'Action réussie', description: 'La propriété a été mise à jour' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible d\'effectuer cette action', variant: 'destructive' });
    },
  });

  const handleAction = () => {
    if (!actionProperty || !actionType) return;
    if (actionType === 'approve') {
      actionMutation.mutate({ id: actionProperty.id, data: { status: 'published' } });
    } else if (actionType === 'reject') {
      actionMutation.mutate({ id: actionProperty.id, data: { status: 'rejected', rejectionReason: rejectReason } });
    } else if (actionType === 'feature') {
      actionMutation.mutate({ id: actionProperty.id, data: { premium: !actionProperty.premium } });
    }
  };

  const typeLabels: Record<string, string> = {
    villa: 'Villa',
    appartement: 'Appartement',
    terrain: 'Terrain',
    bureau: 'Bureau',
    commerce: 'Commerce',
    chambre: 'Chambre',
    guesthouse: 'Guesthouse',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propriétés — {COUNTRY_NAMES[country]}</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} propriétés dans ce pays</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="published">Publiées</option>
            <option value="sold">Vendues</option>
            <option value="rejected">Rejetées</option>
          </select>
        </div>
      </div>

      {/* Pending count banner */}
      {properties.filter((p) => p.status === 'pending').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Eye className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              {properties.filter((p) => p.status === 'pending').length} propriété(s) en attente de validation
            </p>
            <p className="text-xs text-yellow-600">Approuvez ou rejetez les propriétés ci-dessous</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse rounded-2xl"><CardContent className="p-4"><div className="h-20 bg-gray-100 rounded" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <Card key={prop.id} className="hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#003087] shrink-0" />
                      <span className="truncate">{prop.title}</span>
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {prop.quartier}, {prop.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge className={cn('text-xs border', statusColors[prop.status] || 'bg-gray-50 text-gray-600 border-gray-200')} variant="outline">
                      {statusLabels[prop.status] || prop.status}
                    </Badge>
                    {prop.premium && (
                      <Badge className="bg-[#D4AF37] text-white text-[10px] border-0">
                        <Crown className="w-3 h-3 mr-0.5" /> Premium
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="font-bold text-[#D4AF37] text-sm">{prop.price.toLocaleString('fr-FR')} FCFA</span>
                  {prop.bedrooms > 0 && <span>{prop.bedrooms} ch.</span>}
                  <span>{prop.surface} m²</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {prop.views}</span>
                  {prop.verified && <span className="flex items-center gap-1 text-green-600"><Star className="w-3 h-3" /> Vérifié</span>}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {prop.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => { setActionProperty(prop); setActionType('approve'); }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => { setActionProperty(prop); setActionType('reject'); }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeter
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className={cn(
                      'h-8 text-xs',
                      prop.premium
                        ? 'text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10'
                        : 'text-gray-500 hover:bg-gray-50'
                    )}
                    onClick={() => { setActionProperty(prop); setActionType('feature'); }}
                  >
                    <Crown className="w-3.5 h-3.5 mr-1" /> {prop.premium ? 'Retirer Premium' : 'Mettre en avant'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} / {pagination.pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setActionProperty(null); setRejectReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approuver la propriété'}
              {actionType === 'reject' && 'Rejeter la propriété'}
              {actionType === 'feature' && (actionProperty?.premium ? 'Retirer le statut Premium' : 'Mettre en avant')}
            </DialogTitle>
          </DialogHeader>
          {actionProperty && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-900">{actionProperty.title}</p>
                <p className="text-sm text-gray-500">{actionProperty.quartier}, {actionProperty.city}</p>
                <p className="text-sm font-bold text-[#D4AF37] mt-1">{actionProperty.price.toLocaleString('fr-FR')} FCFA</p>
              </div>
              {actionType === 'reject' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">Raison du rejet</label>
                  <Input
                    placeholder="Expliquez pourquoi cette propriété est rejetée..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
              {actionType === 'approve' && (
                <p className="text-sm text-gray-600">Cette propriété sera publiée et visible par tous les utilisateurs.</p>
              )}
              {actionType === 'feature' && (
                <p className="text-sm text-gray-600">
                  {actionProperty.premium
                    ? 'La propriété ne sera plus mise en avant dans les résultats de recherche.'
                    : 'La propriété sera mise en avant dans les résultats de recherche et les listes.'}
                </p>
              )}
              <Button
                onClick={handleAction}
                className={cn(
                  'w-full text-white',
                  actionType === 'approve' && 'bg-green-600 hover:bg-green-700',
                  actionType === 'reject' && 'bg-red-600 hover:bg-red-700',
                  actionType === 'feature' && 'bg-[#D4AF37] hover:bg-[#b8961f]'
                )}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? 'En cours...' : 'Confirmer'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
