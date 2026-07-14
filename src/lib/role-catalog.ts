/**
 * Role catalog for AfriBayit multi-role system (CDC V4 §3.1.1)
 */

import {
  Shield, Briefcase, Scale, TrendingUp, ShoppingBag, Hotel, Map,
  Home, GraduationCap, Plane, Wrench, Award, Crown,
  type LucideIcon,
} from 'lucide-react';

export interface RoleDefinition {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  hasDashboard?: boolean;
  dashboardUrl?: string;
}

export const ROLE_CATALOG: RoleDefinition[] = [
  { key: 'admin', label: 'Administrateur', description: 'Supervision de la plateforme, gestion des utilisateurs et validation KYC', icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { key: 'agent', label: 'Agent immobilier', description: 'Publication de biens, mise en relation acheteurs/vendeurs, commissions', icon: Briefcase, color: 'text-[#003087]', bgColor: 'bg-[#003087]/10', borderColor: 'border-[#003087]/30', hasDashboard: true, dashboardUrl: '/agent-dashboard' },
  { key: 'certified_agent', label: 'Agent certifié', description: 'Agent avec certification officielle — badge vérifié, ProMatch prioritaire', icon: Award, color: 'text-[#00A651]', bgColor: 'bg-[#00A651]/10', borderColor: 'border-[#00A651]/30', hasDashboard: true, dashboardUrl: '/agent-dashboard' },
  { key: 'premium_agent', label: 'Agent Premium', description: 'Abonnement Premium — boost des annonces, statistiques avancées', icon: Crown, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10', borderColor: 'border-[#D4AF37]/30', hasDashboard: true, dashboardUrl: '/agent-dashboard' },
  { key: 'notary', label: 'Notaire', description: 'Génération d\'actes authentiques, signature électronique, enregistrement ANDF', icon: Scale, color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', hasDashboard: true, dashboardUrl: '/notary-dashboard' },
  { key: 'geometer', label: 'Géomètre', description: 'Bornage foncier, rapports GeoTrust, missions de vérification terrain', icon: Map, color: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', hasDashboard: true, dashboardUrl: '/geotrust' },
  { key: 'artisan', label: 'Artisan BTP', description: 'Maçon, électricien, plombier — devis et suivi de chantier en ligne', icon: Wrench, color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'artisan_pro', label: 'Artisan Pro', description: 'Artisan certifié — devis prioritaires, intervention urgence, garanties étendues', icon: Wrench, color: 'text-orange-800', bgColor: 'bg-orange-100', borderColor: 'border-orange-300' },
  { key: 'seller', label: 'Vendeur', description: 'Propriétaire vendeur — publier et vendre un bien immobilier', icon: Home, color: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  { key: 'buyer', label: 'Acheteur', description: 'Recherche et achat de biens immobiliers, favoris, alertes', icon: ShoppingBag, color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { key: 'investor', label: 'Investisseur', description: 'Score IA d\'investissement, ROI calculator, alertes prix, portfolio dashboard', icon: TrendingUp, color: 'text-[#D4AF37]', bgColor: 'bg-[#D4AF37]/10', borderColor: 'border-[#D4AF37]/30', hasDashboard: true, dashboardUrl: '/investor-dashboard' },
  { key: 'hotelier', label: 'Hôtelier', description: 'Gestion d\'hôtel ou guesthouse, chambres, réservations, tarifs', icon: Hotel, color: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', hasDashboard: true, dashboardUrl: '/hotel-dashboard' },
  { key: 'trainer', label: 'Formateur', description: 'Création de cours dans l\'Académie AfriBayit — droit foncier, investissement', icon: GraduationCap, color: 'text-indigo-700', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  { key: 'tourist', label: 'Touriste', description: 'Réservation de séjours courts, hôtels, guesthouses en Afrique de l\'Ouest', icon: Plane, color: 'text-cyan-700', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
];

export const ROLE_MAP: Record<string, RoleDefinition> = ROLE_CATALOG.reduce(
  (acc, role) => { acc[role.key] = role; return acc; },
  {} as Record<string, RoleDefinition>,
);

export function getRoleDefinition(roleKey: string): RoleDefinition {
  return ROLE_MAP[roleKey] || {
    key: roleKey,
    label: roleKey.charAt(0).toUpperCase() + roleKey.slice(1).replace(/_/g, ' '),
    description: 'Rôle personnalisé',
    icon: Briefcase,
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  };
}

export function getUserRoles(primaryRole: string, roles?: string[] | null): string[] {
  if (roles && roles.length > 0) return roles;
  return [primaryRole];
}
