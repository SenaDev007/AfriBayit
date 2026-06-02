'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, UsersRound, CalendarDays, Star, Search,
  CheckCircle2, EyeOff, Trash2, Pin, Award, Ban, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch, apiDelete } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Toutes catégories' },
  { value: 'discussion', label: 'Discussion' },
  { value: 'question', label: 'Question' },
  { value: 'success_story', label: 'Témoignage' },
  { value: 'market_analysis', label: 'Analyse marché' },
  { value: 'legal', label: 'Juridique' },
  { value: 'investment', label: 'Investissement' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Toutes notes' },
  { value: '5', label: '5 étoiles' },
  { value: '4', label: '4 étoiles' },
  { value: '3', label: '3 étoiles' },
  { value: '2', label: '2 étoiles' },
  { value: '1', label: '1 étoile' },
];

const categoryLabels: Record<string, string> = {
  discussion: 'Discussion', question: 'Question', success_story: 'Témoignage',
  market_analysis: 'Analyse marché', legal: 'Juridique', event: 'Événement', investment: 'Investissement',
};

export default function AdminCommunityPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('posts');
  const [filters, setFilters] = useState({ category: '', country: '', rating: '', search: '', page: 1 });

  const params = new URLSearchParams();
  params.set('tab', activeTab);
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  if (filters.rating) params.set('rating', filters.rating);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-community', activeTab, filters],
    queryFn: () => apiFetch(`/api/admin/community?${params.toString()}`),
  });

  const postMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      if (action === 'delete') return apiDelete(`/api/community/posts/${id}`);
      const updates: Record<string, unknown> = {};
      if (action === 'approve') updates.pinned = true;
      else if (action === 'hide') updates.category = 'hidden';
      else if (action === 'pin') updates.pinned = true;
      return apiPatch(`/api/community/posts/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast({ title: 'Action effectuée' });
    },
  });

  const groupMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const updates: Record<string, unknown> = {};
      if (action === 'feature') updates.isPrivate = false;
      else if (action === 'suspend') updates.isPrivate = true;
      return apiPatch(`/api/community/groups/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast({ title: 'Action effectuée' });
    },
  });

  const eventMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      if (action === 'cancel') return apiDelete(`/api/community/events/${id}`);
      return apiPatch(`/api/community/events/${id}`, { isPrivate: action === 'feature' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast({ title: 'Action effectuée' });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      if (action === 'delete') return apiDelete(`/api/reviews/${id}`);
      return apiPatch(`/api/reviews/${id}`, { verified: action === 'approve' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      toast({ title: 'Action effectuée' });
    },
  });

  const tabFilters = (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {activeTab === 'posts' && (
          <Select value={filters.category} onValueChange={(v) => setFilters((f) => ({ ...f, category: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {activeTab === 'reviews' && (
          <Select value={filters.rating} onValueChange={(v) => setFilters((f) => ({ ...f, rating: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Note" /></SelectTrigger>
            <SelectContent>
              {RATING_OPTIONS.map((r) => <SelectItem key={r.value || '__all'} value={r.value || '__all'}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === '__all' ? '' : v, page: 1 }))}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pays" /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communauté</h1>
        <p className="text-sm text-gray-500 mt-0.5">Modération du contenu communautaire</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setFilters({ category: '', country: '', rating: '', search: '', page: 1 }); }}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="posts" className="gap-1.5"><MessageSquare className="w-4 h-4" /> Publications</TabsTrigger>
          <TabsTrigger value="groups" className="gap-1.5"><UsersRound className="w-4 h-4" /> Groupes</TabsTrigger>
          <TabsTrigger value="events" className="gap-1.5"><CalendarDays className="w-4 h-4" /> Événements</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><Star className="w-4 h-4" /> Avis</TabsTrigger>
        </TabsList>

        {tabFilters}

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : !data?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Aucune publication trouvée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold">Titre</TableHead>
                      <TableHead className="text-xs font-semibold">Auteur</TableHead>
                      <TableHead className="text-xs font-semibold">Catégorie</TableHead>
                      <TableHead className="text-xs font-semibold">Vues</TableHead>
                      <TableHead className="text-xs font-semibold">Réponses</TableHead>
                      <TableHead className="text-xs font-semibold">Épinglé</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((post: Record<string, unknown>) => (
                      <TableRow key={post.id as string} className="hover:bg-gray-50/50">
                        <TableCell className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{post.title as string}</TableCell>
                        <TableCell className="text-sm text-gray-700">{(post.author as Record<string, string>)?.name || '-'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{categoryLabels[post.category as string] || (post.category as string)}</Badge></TableCell>
                        <TableCell className="text-sm">{post.views as number}</TableCell>
                        <TableCell className="text-sm">{post.replies as number}</TableCell>
                        <TableCell>{(post.pinned as boolean) ? <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px]">Oui</Badge> : <span className="text-xs text-gray-400">Non</span>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Approuver" onClick={() => postMutation.mutate({ id: post.id as string, action: 'approve' })}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Masquer" onClick={() => postMutation.mutate({ id: post.id as string, action: 'hide' })}>
                              <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Épingler" onClick={() => postMutation.mutate({ id: post.id as string, action: 'pin' })}>
                              <Pin className="w-3.5 h-3.5 text-[#003087]" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Supprimer" onClick={() => postMutation.mutate({ id: post.id as string, action: 'delete' })}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : !data?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <UsersRound className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Aucun groupe trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold">Nom</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Membres</TableHead>
                      <TableHead className="text-xs font-semibold">Privé</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((group: Record<string, unknown>) => (
                      <TableRow key={group.id as string} className="hover:bg-gray-50/50">
                        <TableCell className="text-sm font-medium text-gray-900">{group.name as string}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{group.type as string}</Badge></TableCell>
                        <TableCell className="text-sm">{group.members as number}</TableCell>
                        <TableCell>{(group.isPrivate as boolean) ? <Badge className="bg-amber-50 text-amber-700 text-[10px]">Oui</Badge> : <span className="text-xs text-gray-400">Non</span>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Mettre en avant" onClick={() => groupMutation.mutate({ id: group.id as string, action: 'feature' })}>
                              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Suspendre" onClick={() => groupMutation.mutate({ id: group.id as string, action: 'suspend' })}>
                              <Ban className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : !data?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CalendarDays className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Aucun événement trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold">Titre</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Date</TableHead>
                      <TableHead className="text-xs font-semibold">Participants</TableHead>
                      <TableHead className="text-xs font-semibold">Ville</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((event: Record<string, unknown>) => (
                      <TableRow key={event.id as string} className="hover:bg-gray-50/50">
                        <TableCell className="text-sm font-medium text-gray-900">{event.title as string}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{event.eventType as string}</Badge></TableCell>
                        <TableCell className="text-xs text-gray-500">{new Date(event.eventDate as string).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-sm">{event.attendees as number}{event.maxAttendees ? `/${event.maxAttendees as number}` : ''}</TableCell>
                        <TableCell className="text-sm">{(event.city as string) || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Mettre en avant" onClick={() => eventMutation.mutate({ id: event.id as string, action: 'feature' })}>
                              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Annuler" onClick={() => eventMutation.mutate({ id: event.id as string, action: 'cancel' })}>
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="mt-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : !data?.data?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Star className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Aucun avis trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs font-semibold">Évaluateur</TableHead>
                      <TableHead className="text-xs font-semibold">Type</TableHead>
                      <TableHead className="text-xs font-semibold">Note</TableHead>
                      <TableHead className="text-xs font-semibold">Commentaire</TableHead>
                      <TableHead className="text-xs font-semibold">Vérifié</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((review: Record<string, unknown>) => (
                      <TableRow key={review.id as string} className="hover:bg-gray-50/50">
                        <TableCell className="text-sm">{(review.reviewer as Record<string, string>)?.name || '-'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{review.targetType as string}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn('w-3 h-3', i < (review.rating as number) ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-200')} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 max-w-[200px] truncate">{(review.comment as string) || '-'}</TableCell>
                        <TableCell>{(review.verified as boolean) ? <Badge className="bg-green-50 text-green-700 text-[10px]">Oui</Badge> : <Badge variant="outline" className="text-[10px]">Non</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Approuver" onClick={() => reviewMutation.mutate({ id: review.id as string, action: 'approve' })}>
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Masquer" onClick={() => reviewMutation.mutate({ id: review.id as string, action: 'hide' })}>
                              <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2" title="Supprimer" onClick={() => reviewMutation.mutate({ id: review.id as string, action: 'delete' })}>
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
