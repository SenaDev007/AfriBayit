import { type ReactNode } from 'react';
import {
  Award,
  BarChart3,
  Bed,
  Calendar,
  CheckCircle,
  ClipboardList,
  Croissant,
  Home,
  Key,
  PartyPopper,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wrench,
} from 'lucide-react';

export const easeOut = [0.16, 1, 0.3, 1] as const;

export const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const certificationProcessSteps: { step: number; title: string; desc: string; icon: ReactNode }[] = [
  { step: 1, title: 'Demande', desc: 'Soumission du dossier de certification', icon: <ClipboardList className="w-4 h-4" /> },
  { step: 2, title: 'Inspection', desc: 'Visite de contrôle qualité AfriBayit', icon: <Search className="w-4 h-4" /> },
  { step: 3, title: 'Conformité', desc: 'Vérification sécurité, hygiène, confort', icon: <CheckCircle className="w-4 h-4" /> },
  { step: 4, title: 'Certification', desc: 'Badge Guesthouse Certifié délivré', icon: <Award className="w-4 h-4" /> },
];

export const mealTypeConfig = [
  { key: 'breakfast', label: 'Petit-déjeuner', icon: <Croissant className="w-6 h-6" />, color: '#D4AF37' },
  { key: 'lunch', label: 'Déjeuner', icon: <Users className="w-6 h-6" />, color: '#00A651' },
  { key: 'dinner', label: 'Dîner', icon: <Home className="w-6 h-6" />, color: '#003087' },
];

export const roleIconMap: Record<string, ReactNode> = {
  receptionist: <User className="w-4 h-4" />,
  housekeeping: <Home className="w-4 h-4" />,
  cook: <Croissant className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  manager: <Users className="w-4 h-4" />,
  maintenance: <Wrench className="w-4 h-4" />,
  concierge: <Key className="w-4 h-4" />,
};

export const staffRoleOptions = [
  { value: 'receptionist', label: 'Réceptionniste' },
  { value: 'housekeeping', label: 'Femme de ménage' },
  { value: 'cook', label: 'Cuisinier(e)' },
  { value: 'security', label: 'Sécurité' },
  { value: 'manager', label: 'Gérant(e)' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'concierge', label: 'Concierge' },
];

export const staffSchedulePresets = [
  '7h-15h',
  '15h-23h',
  '23h-7h',
  '8h-17h',
  '9h-18h',
  'Temps plein',
  'Temps partiel matin',
  'Temps partiel après-midi',
];

export const pricingPeriodOptions = [
  { value: 'low_season', label: 'Basse saison', icon: <TrendingDown className="w-4 h-4" />, color: '#009CDE' },
  { value: 'high_season', label: 'Haute saison', icon: <TrendingUp className="w-4 h-4" />, color: '#D4AF37' },
  { value: 'event', label: 'Événementiel', icon: <PartyPopper className="w-4 h-4" />, color: '#D93025' },
  { value: 'holiday', label: 'Fêtes', icon: <Calendar className="w-4 h-4" />, color: '#D4AF37' },
  { value: 'custom', label: 'Personnalisé', icon: <BarChart3 className="w-4 h-4" />, color: '#6b7280' },
];

export const certificationFilterOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'certified', label: 'Certifiées' },
  { value: 'pending', label: 'En cours' },
];

// keep these icons imported so the bundle is consistent with the original module
export const Icons = { Award, BarChart3, Bed, Calendar, CheckCircle, ClipboardList, Croissant, Home, Key, PartyPopper, Search, Shield, TrendingDown, TrendingUp, User, Users, Wrench };
