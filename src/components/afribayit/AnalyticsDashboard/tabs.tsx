import {
  BarChart3,
  BookOpen,
  Briefcase,
  Download,
  Eye,
  Landmark,
  Lightbulb,
  MapPin,
  Search,
  Users,
  Wrench,
} from 'lucide-react';
import type { AnalyticsTab, AnalyticsTabDef, PeriodKey, PeriodOption, ProfileTab, ProfileTabDef } from './types';

export const PERIOD_OPTIONS: PeriodOption[] = [
  { key: '7j', label: '7j' },
  { key: '30j', label: '30j' },
  { key: '90j', label: '90j' },
  { key: '12m', label: '12 mois' },
  { key: 'custom', label: 'Personnalisé' },
];

export const ANALYTICS_TABS: AnalyticsTabDef[] = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'profile_views', label: 'Vues profil', icon: <Eye className="w-4 h-4" /> },
  { key: 'search', label: 'Recherche', icon: <Search className="w-4 h-4" /> },
  { key: 'profiles', label: 'Par profil', icon: <Users className="w-4 h-4" /> },
  { key: 'heatmap', label: 'Zone', icon: <MapPin className="w-4 h-4" /> },
  { key: 'rebecca', label: 'Rebecca', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
];

export const PROFILE_TABS_DEF: ProfileTabDef[] = [
  { key: 'agent', label: 'Agent', icon: <Briefcase className="w-4 h-4" />, color: '#003087' },
  { key: 'artisan', label: 'Artisan', icon: <Wrench className="w-4 h-4" />, color: '#D4AF37' },
  { key: 'formateur', label: 'Formateur', icon: <BookOpen className="w-4 h-4" />, color: '#009CDE' },
  { key: 'investisseur', label: 'Investisseur', icon: <Landmark className="w-4 h-4" />, color: '#00A651' },
];

export type { AnalyticsTab, ProfileTab, PeriodKey };
