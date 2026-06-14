'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPatch, apiDelete } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star, Search, AlertTriangle, Clock, CheckCircle2, Eye, EyeOff,
  Trash2, Loader2, ChevronLeft, ChevronRight, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface ReviewRow {
  id: string;
  author: string;
  target: string;
  targetType: string;
  rating: number;
  comment: string;
  status: string;
  reported: boolean;
  createdAt: string;
}

interface ReviewsResponse {
  reviews: ReviewRow[];
  summary: {
    total: number;
    averageRating: number;
    reported: number;
    pending: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function CountryReviewsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);
  if (ratingFilter) queryParams.set('rating', ratingFilter);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['admin-reviews', country, search, statusFilter, ratingFilter, page],
    queryFn: () => apiFetch(`/api/admin/reviews?${queryParams.toString()}`),
  });

  const reviews = data?.reviews || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      if (action === 'delete') return apiDelete(`/api/reviews/${id}`);
      return apiPatch(`/api/reviews/${id}`, { action });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews', country] });
      toast.success(
        variables.action === 'approve' ? 'Avis approuvé' :
        variables.action === 'hide' ? 'Avis masqué' :
        variables.action === 'delete' ? 'Avis supprimé' : 'Action effectuée'
      );
    },
    onError: () => {
      toast.error("Erreur lors de l'action");
    },
  });

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#003087]" />
            Avis — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Modération des avis du {COUNTRY_NAMES[country]}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total avis</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{summary?.averageRating?.toFixed(1) ?? '—'}</p>
              <p className="text-xs text-gray-500">Note moyenne</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{summary?.reported ?? 0}</p>
              <p className="text-xs text-gray-500">Signalés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{summary?.pending ?? 0}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un avis..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'pending', 'approved', 'hidden', 'reported'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
              className={statusFilter === s ? 'bg-[#003087] text-white' : ''}
              onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s === '' ? 'Tous' : s === 'approved' ? 'Approuvés' : s === 'reported' ? 'Signalés' :
               s === 'hidden' ? 'Masqués' : 'En attente'}
            </Button>
          ))}
        </div>
        <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Note" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes notes</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>{r} étoile{r > 1 ? 's' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center text-gray-400">
            Aucun avis trouvé
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <Card key={review.id} className={`rounded-2xl ${review.reported ? 'border-red-200' : review.status === 'hidden' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{review.author}</p>
                    <p className="text-xs text-gray-500">sur {review.target} ({review.targetType})</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {review.reported && (
                      <Badge className="bg-red-50 text-red-700 text-[10px] border-0" variant="outline">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Signalé
                      </Badge>
                    )}
                    <Badge
                      className={`text-[10px] border-0 ${
                        review.status === 'approved' ? 'bg-green-50 text-green-700' :
                        review.status === 'hidden' ? 'bg-gray-50 text-gray-600' :
                        'bg-amber-50 text-amber-700'
                      }`}
                      variant="outline"
                    >
                      {review.status === 'approved' ? 'Approuvé' : review.status === 'hidden' ? 'Masqué' : 'En attente'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-xs text-gray-500">{review.rating}/5</span>
                </div>

                <p className="text-sm text-gray-700 line-clamp-3">{review.comment}</p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    {review.status !== 'approved' && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 h-7 text-xs"
                        onClick={() => actionMutation.mutate({ id: review.id, action: 'approve' })}
                        disabled={actionMutation.isPending}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approuver
                      </Button>
                    )}
                    {review.status !== 'hidden' && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-7 text-xs"
                        onClick={() => actionMutation.mutate({ id: review.id, action: 'hide' })}
                        disabled={actionMutation.isPending}
                      >
                        <EyeOff className="w-3.5 h-3.5 mr-1" /> Masquer
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-xs"
                      onClick={() => actionMutation.mutate({ id: review.id, action: 'delete' })}
                      disabled={actionMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {(pagination.page - 1) * LIMIT + 1}–{Math.min(pagination.page * LIMIT, pagination.total)} sur {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
