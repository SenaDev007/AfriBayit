'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Pencil,
  ChevronRight,
  FileText,
  Layout,
  Building2,
  Hotel,
  Hammer,
  Scale,
  Globe,
  Clock,
  Layers,
  Save,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdminContent, useUpdateContent } from '@/hooks/useAdmin';

const SECTION_CONFIG = [
  { key: 'homepage', label: 'Homepage', icon: Layout, color: 'bg-[#003087]/10 text-[#003087]' },
  { key: 'properties', label: 'Propriétés', icon: Building2, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
  { key: 'hotels', label: 'Hôtellerie', icon: Hotel, color: 'bg-green-50 text-green-600' },
  { key: 'artisans', label: 'Artisans', icon: Hammer, color: 'bg-purple-50 text-purple-600' },
  { key: 'legal', label: 'Légal', icon: Scale, color: 'bg-amber-50 text-amber-700' },
  { key: 'footer', label: 'Footer', icon: Globe, color: 'bg-blue-50 text-blue-700' },
] as const;

interface ContentItem {
  key: string;
  label: string;
  value: string;
  updatedAt: string;
}

interface ContentSection {
  key: string;
  label: string;
  items: ContentItem[];
}

export default function AdminContentPage() {
  const [country, setCountry] = useState<string>('');
  const [editOpen, setEditOpen] = useState<{ sectionKey: string; itemKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data, isLoading } = useAdminContent({ country: country || undefined });
  const sections = (data?.sections as ContentSection[]) || [];
  const summary = data?.summary as {
    totalSections: number;
    totalItems: number;
    lastModified: string;
  } | undefined;

  const updateContent = useUpdateContent();

  const handleEdit = (sectionKey: string, itemKey: string, currentValue: string) => {
    setEditOpen({ sectionKey, itemKey });
    setEditValue(currentValue);
  };

  const handleSave = () => {
    if (!editOpen) return;
    updateContent.mutate(
      {
        sectionKey: editOpen.sectionKey,
        itemKey: editOpen.itemKey,
        value: editValue,
        country: country || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Contenu mis à jour avec succès');
          setEditOpen(null);
          setEditValue('');
        },
        onError: () => toast.error('Erreur lors de la mise à jour'),
      }
    );
  };

  const getSectionConfig = (key: string) => {
    return SECTION_CONFIG.find((s) => s.key === key) || { key, label: key, icon: FileText, color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du contenu</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérer le contenu et les textes de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <Select
            value={country || 'all'}
            onValueChange={(v) => setCountry(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Tous les pays (défaut)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌐 Par défaut (global)</SelectItem>
              <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
              <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
              <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
              <SelectItem value="TG">🇹🇬 Togo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total sections</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalSections ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total éléments</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalItems ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Dernière modification</p>
            <p className="text-sm font-bold text-gray-900">
              {summary?.lastModified
                ? new Date(summary.lastModified).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Country override indicator */}
      {country && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            Affichage des remplacements de contenu pour <strong>{country}</strong>
          </span>
        </div>
      )}

      {/* Content Sections */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-900">Aucun contenu trouvé</p>
          <p className="text-sm text-gray-500 mt-1">Sélectionnez un pays ou consultez le contenu par défaut</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const config = getSectionConfig(section.key);
            const IconComponent = config.icon;
            return (
              <div key={section.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Section header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.color)}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{section.label || config.label}</h3>
                      <p className="text-[11px] text-gray-400">{section.items?.length || 0} éléments</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {section.key}
                  </Badge>
                </div>

                {/* Section items */}
                <div className="divide-y divide-gray-50">
                  {section.items?.map((item) => (
                    <div
                      key={item.key}
                      className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-gray-300 font-mono">{item.key}</span>
                        </div>
                        <p className="text-sm text-gray-900 truncate mt-0.5 max-w-[600px]">
                          {item.value || <span className="text-gray-300 italic">Non défini</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.updatedAt && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(item.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(section.key, item.key, item.value)}
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!section.items || section.items.length === 0) && (
                    <div className="px-6 py-6 text-center text-sm text-gray-400">
                      Aucun élément dans cette section
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editOpen} onOpenChange={() => setEditOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le contenu</DialogTitle>
            <DialogDescription>
              Modifier la valeur de <strong>{editOpen?.itemKey}</strong> dans <strong>{editOpen?.sectionKey}</strong>
              {country && (
                <span className="block mt-1 text-amber-600">
                  Remplacement pour {country}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Clé
              </label>
              <p className="text-sm font-mono text-gray-900 mt-0.5">{editOpen?.sectionKey}.{editOpen?.itemKey}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Valeur
              </label>
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={6}
                className="mt-1 font-mono text-sm"
                placeholder="Entrez le contenu..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(null)}>Annuler</Button>
            <Button
              className="bg-[#003087] hover:bg-[#003087]/90"
              onClick={handleSave}
              disabled={updateContent.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              {updateContent.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
