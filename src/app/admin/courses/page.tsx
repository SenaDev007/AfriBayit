'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap, Search, CheckCircle2, XCircle, StarOff,
  BookOpen, Award, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'droit_foncier', label: 'Droit foncier' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'construction', label: 'Construction' },
  { value: 'finance', label: 'Finance' },
  { value: 'certification', label: 'Certification' },
];

const LEVEL_OPTIONS = [
  { value: '', label: 'Tous niveaux' },
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

const PUBLISHED_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'true', label: 'Publié' },
  { value: 'false', label: 'Non publié' },
];

const levelLabels: Record<string, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert',
};

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

interface CourseRow {
  id: string;
  title: string;
  instructor: string;
  category: string;
  price: number;
  students: number;
  rating: number;
  published: boolean;
  level: string;
  _count: { enrollments: number };
}

interface CoursesResponse {
  courses: CourseRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { published: number; byCategory: Array<{ category: string; _count: number }> };
}

export default function AdminCoursesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ category: '', country: '', level: '', published: '', search: '', page: 1 });

  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.country) params.set('country', filters.country);
  if (filters.level) params.set('level', filters.level);
  if (filters.published) params.set('published', filters.published);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery<CoursesResponse>({
    queryKey: ['admin-courses', filters],
    queryFn: () => apiFetch<CoursesResponse>(`/api/admin/courses?${params.toString()}`),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const updates: Record<string, unknown> = {};
      if (action === 'approve') updates.published = true;
      else if (action === 'unpublish') updates.published = false;
      else if (action === 'feature') updates.certificate = true;
      return apiPatch(`/api/courses/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast({ title: 'Action effectuée' });
    },
  });

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[#003087]" />
          Académie
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des cours et formations</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total cours</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{data?.pagination.total || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publiés</p>
            <p className="text-2xl font-bold text-green-600 font-display">{s?.published || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Non publiés</p>
            <p className="text-2xl font-bold text-amber-600 font-display">{(data?.pagination.total || 0) - (s?.published || 0)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Rechercher un cours..." className="pl-10 h-9 text-sm" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} />
          </div>
          <Select value={filters.category} onValueChange={(v) => setFilters((f) => ({ ...f, category: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.level} onValueChange={(v) => setFilters((f) => ({ ...f, level: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Niveau" /></SelectTrigger>
            <SelectContent>
              {LEVEL_OPTIONS.map((l) => <SelectItem key={l.value || '__all'} value={l.value || '__all'}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.published} onValueChange={(v) => setFilters((f) => ({ ...f, published: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Publication" /></SelectTrigger>
            <SelectContent>
              {PUBLISHED_OPTIONS.map((p) => <SelectItem key={p.value || '__all'} value={p.value || '__all'}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : !data?.courses.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun cours trouvé</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Titre</TableHead>
                  <TableHead className="text-xs font-semibold">Instructeur</TableHead>
                  <TableHead className="text-xs font-semibold">Catégorie</TableHead>
                  <TableHead className="text-xs font-semibold">Prix</TableHead>
                  <TableHead className="text-xs font-semibold">Étudiants</TableHead>
                  <TableHead className="text-xs font-semibold">Note</TableHead>
                  <TableHead className="text-xs font-semibold">Niveau</TableHead>
                  <TableHead className="text-xs font-semibold">Publié</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.courses.map((c) => (
                  <TableRow key={c.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-sm font-medium text-gray-900 max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell className="text-sm text-gray-700">{c.instructor}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{c.category}</Badge></TableCell>
                    <TableCell className="text-sm font-semibold">{c.price > 0 ? formatXOF(c.price) : 'Gratuit'}</TableCell>
                    <TableCell className="text-sm">{c._count.enrollments || c.students}</TableCell>
                    <TableCell className="text-sm font-medium">{c.rating.toFixed(1)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{levelLabels[c.level] || c.level}</Badge></TableCell>
                    <TableCell>
                      {c.published
                        ? <Badge className="bg-green-50 text-green-700 text-[10px]">Oui</Badge>
                        : <Badge variant="outline" className="text-[10px]">Non</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Approuver" onClick={() => actionMutation.mutate({ id: c.id, action: 'approve' })}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Dépublier" onClick={() => actionMutation.mutate({ id: c.id, action: 'unpublish' })}>
                          <XCircle className="w-3.5 h-3.5 text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Mettre en avant" onClick={() => actionMutation.mutate({ id: c.id, action: 'feature' })}>
                          <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {(data.pagination.page - 1) * data.pagination.limit + 1}–
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} sur {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pagination.pages || Math.abs(p - filters.page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showDots = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showDots && <span className="px-1 text-xs text-gray-400">...</span>}
                      <Button
                        variant={p === filters.page ? 'default' : 'outline'}
                        size="sm"
                        className={cn('h-8 w-8 p-0 text-xs', p === filters.page && 'bg-[#003087] hover:bg-[#002a70]')}
                        onClick={() => setFilters((f) => ({ ...f, page: p }))}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  );
                })}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
