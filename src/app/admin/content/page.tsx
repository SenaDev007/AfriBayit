'use client';

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Shield,
  Globe,
  Edit,
  Eye,
  Save,
  X,
  Search,
  Home,
  Star,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentItem {
  id: string;
  label: string;
  value: string;
  lastModified: string;
}

interface ContentSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  items: ContentItem[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const initialSections: ContentSection[] = [
  {
    id: 'accueil',
    title: "Page d'accueil",
    description: 'Gérez le contenu principal de la page d\u2019accueil',
    icon: <Home className="size-5" />,
    accentColor: 'text-[#003087]',
    accentBg: 'bg-[#003087]/10',
    items: [
      {
        id: 'hero-titre',
        label: 'Hero titre',
        value:
          'Trouvez votre bien immobilier en Afrique de l\u2019Ouest',
        lastModified: '2025-12-10T14:30:00',
      },
      {
        id: 'hero-sous-titre',
        label: 'Hero sous-titre',
        value:
          'La premi\u00e8re plateforme immobili\u00e8re v\u00e9rifi\u00e9e et s\u00e9curis\u00e9e pour l\u2019Afrique de l\u2019Ouest',
        lastModified: '2025-12-10T14:30:00',
      },
      {
        id: 'section-confiance',
        label: 'Section confiance',
        value:
          'Plus de 10\u00a0000 biens v\u00e9rifi\u00e9s \u2022 500+ notaires partenaires \u2022 Pr\u00e9sent dans 8 pays',
        lastModified: '2025-11-28T09:15:00',
      },
      {
        id: 'section-comment-ca-marche',
        label: 'Section comment \u00e7a marche',
        value:
          '1. Recherchez \u2022 2. V\u00e9rifiez \u2022 3. Visitez \u2022 4. Signez en toute s\u00e9curit\u00e9',
        lastModified: '2025-11-20T16:45:00',
      },
      {
        id: 'section-temoignages',
        label: 'Section t\u00e9moignages',
        value:
          'D\u00e9couvrez les t\u00e9moignages de nos utilisateurs qui ont r\u00e9alis\u00e9 leur projet immobilier avec AfriBayit.',
        lastModified: '2025-11-15T11:00:00',
      },
      {
        id: 'cta-banniere',
        label: 'CTA banni\u00e8re',
        value:
          'Pr\u00eat \u00e0 trouver votre bien\u00a0? Commencez votre recherche d\u00e8s maintenant.',
        lastModified: '2025-11-05T08:30:00',
      },
    ],
  },
  {
    id: 'legales',
    title: 'Pages l\u00e9gales',
    description: 'Modifiez les documents juridiques et politiques',
    icon: <Shield className="size-5" />,
    accentColor: 'text-[#D4AF37]',
    accentBg: 'bg-[#D4AF37]/10',
    items: [
      {
        id: 'politique-confidentialite',
        label: 'Politique de confidentialit\u00e9',
        value:
          'AfriBayit s\u2019engage \u00e0 prot\u00e9ger la vie priv\u00e9e de ses utilisateurs. Cette politique d\u00e9crit les donn\u00e9es collect\u00e9es, leur utilisation et vos droits...',
        lastModified: '2025-10-22T10:00:00',
      },
      {
        id: 'cgu',
        label: 'CGU',
        value:
          'En utilisant la plateforme AfriBayit, vous acceptez les pr\u00e9sentes conditions g\u00e9n\u00e9rales d\u2019utilisation...',
        lastModified: '2025-10-22T10:00:00',
      },
      {
        id: 'remboursement',
        label: 'Remboursement',
        value:
          'Notre politique de remboursement s\u2019applique aux transactions effectu\u00e9es via le service de s\u00e9curisation AfriEscrow...',
        lastModified: '2025-09-15T14:20:00',
      },
      {
        id: 'suppression-donnees',
        label: 'Suppression de donn\u00e9es',
        value:
          'Conform\u00e9ment aux r\u00e9glementations en vigueur, vous pouvez demander la suppression de vos donn\u00e9es personnelles...',
        lastModified: '2025-09-15T14:20:00',
      },
    ],
  },
  {
    id: 'realisations',
    title: 'Nos R\u00e9alisations',
    description: 'G\u00e9rez le contenu de la section r\u00e9alisations',
    icon: <Star className="size-5" />,
    accentColor: 'text-[#00A651]',
    accentBg: 'bg-[#00A651]/10',
    items: [
      {
        id: 'realisations-description',
        label: 'Description',
        value:
          'D\u00e9couvrez les projets r\u00e9alis\u00e9s gr\u00e2ce \u00e0 AfriBayit. Des milliers de familles ont trouv\u00e9 leur logement id\u00e9al.',
        lastModified: '2025-12-01T16:00:00',
      },
      {
        id: 'realisations-statistiques',
        label: 'Statistiques',
        value:
          '2\u00a0500+ transactions r\u00e9ussies \u2022 98% de satisfaction \u2022 8 pays couverts \u2022 500+ partenaires notariaux',
        lastModified: '2025-12-01T16:00:00',
      },
      {
        id: 'realisations-projets',
        label: 'Projets',
        value:
          'R\u00e9sidence Les Palmiers \u2013 Cotonou \u2022 Villa Horizon \u2013 Lom\u00e9 \u2022 Appartements Baobab \u2013 Dakar',
        lastModified: '2025-11-18T09:45:00',
      },
    ],
  },
  {
    id: 'seo',
    title: 'SEO & Meta',
    description: 'Configurez les balises m\u00e9ta et le r\u00e9f\u00e9rencement',
    icon: <Globe className="size-5" />,
    accentColor: 'text-[#009CDE]',
    accentBg: 'bg-[#009CDE]/10',
    items: [
      {
        id: 'seo-title',
        label: 'Title',
        value:
          'AfriBayit \u2013 Plateforme immobili\u00e8re v\u00e9rifi\u00e9e en Afrique de l\u2019Ouest',
        lastModified: '2025-11-30T12:00:00',
      },
      {
        id: 'seo-description',
        label: 'Description',
        value:
          'Achetez, vendez et louez des biens immobiliers v\u00e9rifi\u00e9s en Afrique de l\u2019Ouest. Transactions s\u00e9curis\u00e9es, notaires partenaires, v\u00e9rification g\u00e9olocalis\u00e9e.',
        lastModified: '2025-11-30T12:00:00',
      },
      {
        id: 'seo-keywords',
        label: 'Keywords',
        value:
          'immobilier afrique, achat maison afrique, location appartement, bien v\u00e9rifi\u00e9, notaire, transaction s\u00e9curis\u00e9e',
        lastModified: '2025-11-30T12:00:00',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentManagementPage() {
  const [sections, setSections] = useState<ContentSection[]>(initialSections);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // View modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null);
  const [viewingSection, setViewingSection] = useState<ContentSection | null>(null);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleEdit = useCallback((section: ContentSection, item: ContentItem) => {
    setEditingSection(section);
    setEditingItem(item);
    setEditValue(item.value);
    setEditOpen(true);
  }, []);

  const handleView = useCallback((section: ContentSection, item: ContentItem) => {
    setViewingSection(section);
    setViewingItem(item);
    setViewOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!editingSection || !editingItem) return;
    setIsSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== editingSection.id) return s;
        return {
          ...s,
          items: s.items.map((it) => {
            if (it.id !== editingItem.id) return it;
            return {
              ...it,
              value: editValue,
              lastModified: new Date().toISOString(),
            };
          }),
        };
      }),
    );
    setIsSaving(false);
    setEditOpen(false);
  }, [editingSection, editingItem, editValue]);

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setEditValue('');
    setEditingSection(null);
    setEditingItem(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------

  const filteredSections = React.useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (it) =>
            it.label.toLowerCase().includes(q) ||
            it.value.toLowerCase().includes(q),
        ),
      }))
      .filter((s) => s.items.length > 0 || s.title.toLowerCase().includes(q));
  }, [sections, searchQuery]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Page Header                                                        */}
      {/* ----------------------------------------------------------------- */}
      <div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#003087]">
              Gestion du Contenu
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Modifiez le contenu des pages et sections de la plateforme
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mt-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher du contenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* ----------------------------------------------------------------- */}
      {/* Content Sections Grid                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredSections.map((section) => (
          <Card
            key={section.id}
            className="overflow-hidden border hover:shadow-md transition-shadow"
          >
            {/* Section header with accent bar */}
            <CardHeader className="relative pb-3">
              <div
                className={cn(
                  'absolute top-0 left-0 h-1 w-full rounded-t-xl',
                  section.id === 'accueil' && 'bg-[#003087]',
                  section.id === 'legales' && 'bg-[#D4AF37]',
                  section.id === 'realisations' && 'bg-[#00A651]',
                  section.id === 'seo' && 'bg-[#009CDE]',
                )}
              />
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    section.accentBg,
                  )}
                >
                  <span className={section.accentColor}>{section.icon}</span>
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base text-[#003087]">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="mt-0.5">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-2">
              <div className="space-y-2">
                {section.items.length === 0 && (
                  <p className="text-sm text-muted-foreground italic py-4 text-center">
                    Aucun r\u00e9sultat trouv\u00e9
                  </p>
                )}
                {section.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      'group flex items-start justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50',
                      idx < section.items.length - 1 && '',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {truncate(item.value, 100)}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        Modifi\u00e9 le {formatDate(item.lastModified)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#009CDE] hover:text-[#009CDE] hover:bg-[#009CDE]/10"
                        onClick={() => handleView(section, item)}
                      >
                        <Eye className="size-3.5 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[#003087] hover:text-[#003087] hover:bg-[#003087]/10"
                        onClick={() => handleEdit(section, item)}
                      >
                        <Edit className="size-3.5 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="border-t pt-4 pb-4">
              <div className="flex w-full items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {section.items.length}{' '}
                  {section.items.length > 1 ? '\u00e9l\u00e9ments' : '\u00e9l\u00e9ment'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (section.items.length > 0) {
                      handleEdit(section, section.items[0]);
                    }
                  }}
                >
                  <Edit className="size-3.5 mr-1" />
                  Modifier la section
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* View Modal                                                         */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#003087]">
              <Eye className="size-5" />
              {viewingItem?.label}
            </DialogTitle>
            <DialogDescription>
              Section : {viewingSection?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {viewingItem?.value}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Derni\u00e8re modification :{' '}
              {viewingItem ? formatDate(viewingItem.lastModified) : ''}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewingSection && viewingItem) {
                  setViewOpen(false);
                  handleEdit(viewingSection, viewingItem);
                }
              }}
            >
              <Edit className="size-3.5 mr-1" />
              Modifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------------------------------------------------------- */}
      {/* Edit Modal                                                         */}
      {/* ----------------------------------------------------------------- */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        if (!open) handleCancel();
        else setEditOpen(true);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#003087]">
              <Edit className="size-5" />
              Modifier : {editingItem?.label}
            </DialogTitle>
            <DialogDescription>
              Section : {editingSection?.title} \u2014 Modifiez le contenu ci-dessous puis
              enregistrez.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Contenu
              </label>
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[180px] resize-y"
                placeholder="Saisissez le contenu ici..."
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <FileText className="size-3.5" />
              <span>
                Derni\u00e8re modification :{' '}
                {editingItem ? formatDate(editingItem.lastModified) : ''}
              </span>
              <span className="ml-auto">
                {editValue.length} caract\u00e8re{editValue.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <X className="size-4 mr-1" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || editValue === editingItem?.value}
              className="bg-[#003087] hover:bg-[#003087]/90 text-white"
            >
              {isSaving ? (
                <>
                  <span className="size-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
