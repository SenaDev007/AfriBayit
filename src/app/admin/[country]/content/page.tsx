'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPatch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText, Search, Loader2, Pencil, Globe, Scale, Award, BarChart3,
  Save, X,
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface ContentItem {
  id: string;
  key: string;
  label: string;
  value: string;
  section: string;
  updatedAt: string;
}

interface ContentResponse {
  content: ContentItem[];
}

const sections = [
  { key: 'homepage', label: "Page d'accueil", icon: Globe, color: 'bg-[#003087]/10 text-[#003087]' },
  { key: 'legal', label: 'Pages légales', icon: Scale, color: 'bg-green-50 text-green-600' },
  { key: 'realizations', label: 'Nos Réalisations', icon: Award, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
  { key: 'seo', label: 'SEO & Meta', icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
];

export default function CountryContentPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<ContentResponse>({
    queryKey: ['admin-content', country],
    queryFn: () => apiFetch(`/api/admin/content?country=${country}`),
  });

  const contentItems = data?.content || [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      return apiPatch(`/api/admin/content/${id}`, { value, country });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content', country] });
      toast.success('Contenu mis à jour avec succès');
      setDialogOpen(false);
      setEditItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleEdit = (item: ContentItem) => {
    setEditItem(item);
    setEditValue(item.value);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editItem) return;
    updateMutation.mutate({ id: editItem.id, value: editValue });
  };

  const groupedContent = sections.map((section) => ({
    ...section,
    items: contentItems.filter((item) => item.section === section.key),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#003087]" />
            Contenu — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestion du contenu du {COUNTRY_NAMES[country]}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {contentItems.length} éléments
        </Badge>
      </div>

      {/* Sections */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedContent.map((section) => {
            const SectionIcon = section.icon;
            return (
              <Card key={section.key} className="rounded-2xl">
                <CardHeader className="border-b border-gray-100 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${section.color} flex items-center justify-center`}>
                      <SectionIcon className="w-4 h-4" />
                    </div>
                    {section.label}
                    <Badge variant="outline" className="text-[10px] ml-2">{section.items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {section.items.length === 0 ? (
                    <p className="p-6 text-center text-gray-400 text-sm">Aucun contenu dans cette section</p>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {section.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">{item.key}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.value || <span className="text-gray-400 italic">Vide</span>}
                            </p>
                            {item.updatedAt && (
                              <p className="text-[11px] text-gray-400 mt-1">
                                Mis à jour le {new Date(item.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#003087] hover:text-[#002A70] hover:bg-[#003087]/5 shrink-0"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-4 h-4 mr-1" /> Modifier
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-[#003087]" />
              Modifier le contenu
            </DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="bg-[#003087]/5 rounded-xl p-4">
                <p className="text-sm text-[#003087] font-medium">{editItem.label}</p>
                <p className="text-xs text-gray-500 font-mono">{editItem.key}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Section : {sections.find((s) => s.key === editItem.section)?.label || editItem.section}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">Contenu</label>
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Saisissez le contenu..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setDialogOpen(false); setEditItem(null); }}
                >
                  <X className="w-4 h-4 mr-1" /> Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#003087] hover:bg-[#002A70] text-white"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Enregistrement...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-1" /> Enregistrer</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
