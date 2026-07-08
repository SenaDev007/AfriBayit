import {
  Award,
  BookOpen,
  Crown,
  Diamond,
  Gem,
  Globe,
  Handshake,
  Lock,
  Medal,
  PenTool,
  Sprout,
  Star,
  Trophy,
} from 'lucide-react';
import type {
  AfriPointLevel,
  AmbassadorTier,
  Badge,
  CommunityTab,
  ForumCategory,
  ReputationLevel,
  ServiceItem,
} from './types';

export const easeOut = [0.16, 1, 0.3, 1] as const;

export const afriPointLevels: AfriPointLevel[] = [
  { name: 'Bronze', min: 0, icon: <Medal className="w-4 h-4" style={{ color: '#CD7F32' }} />, color: '#CD7F32' },
  { name: 'Argent', min: 200, icon: <Medal className="w-4 h-4" style={{ color: '#C0C0C0' }} />, color: '#C0C0C0' },
  { name: 'Or', min: 500, icon: <Medal className="w-4 h-4" style={{ color: '#FFD700' }} />, color: '#FFD700' },
  { name: 'Platine', min: 1500, icon: <Diamond className="w-4 h-4" style={{ color: '#E5E4E2' }} />, color: '#E5E4E2' },
  { name: 'Diamant', min: 5000, icon: <Gem className="w-4 h-4" style={{ color: '#B9F2FF' }} />, color: '#B9F2FF' },
];

export const reputationLevels: ReputationLevel[] = [
  { name: 'Découvreur', min: 0, max: 100, color: '#6b7280', icon: <Sprout className="w-4 h-4" /> },
  { name: 'Acteur', min: 100, max: 300, color: '#009CDE', icon: <Star className="w-4 h-4" /> },
  { name: 'Expert', min: 300, max: 600, color: '#00A651', icon: <Trophy className="w-4 h-4" /> },
  { name: 'Ambassadeur', min: 600, max: 1001, color: '#D4AF37', icon: <Crown className="w-4 h-4" /> },
];

export const badges: Badge[] = [
  { id: 'first_post', name: 'Premier pas', icon: <PenTool className="w-3.5 h-3.5" />, description: 'Premier sujet publié', earned: true },
  { id: 'helper', name: 'Bon samaritain', icon: <Handshake className="w-3.5 h-3.5" />, description: '5 réponses utiles', earned: false },
  { id: 'reviewer', name: 'Critique immobilier', icon: <Star className="w-3.5 h-3.5" />, description: '3 avis publiés', earned: false },
  { id: 'networker', name: 'Réseauteur', icon: <Globe className="w-3.5 h-3.5" />, description: '10 connexions', earned: false },
  { id: 'student', name: 'Étudiant', icon: <BookOpen className="w-3.5 h-3.5" />, description: '1 cours complété', earned: true },
  { id: 'certified', name: 'Certifié', icon: <Award className="w-3.5 h-3.5" />, description: '1 certificat obtenu', earned: false },
];

export const ambassadorTiers: AmbassadorTier[] = [
  { tier: 'Bronze', commission: '5%', icon: <Medal className="w-5 h-5" style={{ color: '#CD7F32' }} />, color: '#CD7F32', benefits: ['Lien de parrainage', 'Commission 5%', 'Dashboard ambassadeur'] },
  { tier: 'Argent', commission: '10%', icon: <Medal className="w-5 h-5" style={{ color: '#C0C0C0' }} />, color: '#C0C0C0', benefits: ['Tous les avantages Bronze', 'Commission 10%', 'Page personnalisée', 'Support prioritaire'] },
  { tier: 'Or', commission: '15%', icon: <Medal className="w-5 h-5" style={{ color: '#FFD700' }} />, color: '#FFD700', benefits: ['Tous les avantages Argent', 'Commission 15%', 'Événements co-brandés', 'Accès VIP formations'] },
];

export const FORUM_CATEGORIES: ForumCategory[] = [
  { key: '', label: 'Toutes' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'question', label: 'Question' },
  { key: 'success_story', label: 'Témoignage' },
  { key: 'market_analysis', label: 'Marché' },
  { key: 'legal', label: 'Juridique' },
  { key: 'investment', label: 'Investissement' },
  { key: 'event', label: 'Événement' },
];

export const SERVICES_ITEMS: ServiceItem[] = [
  { id: 's1', title: 'Photographe immobilier professionnel', provider: 'Kofi Mensah', city: 'Cotonou', price: 25000, rating: 4.9, category: 'Photo', avatar: '' },
  { id: 's2', title: 'Expertise foncière certifiée', provider: 'Me. Adjo Dossou', city: 'Abidjan', price: 75000, rating: 4.8, category: 'Juridique', avatar: '' },
  { id: 's3', title: 'Home staging complet', provider: 'Aminata Traoré', city: 'Lomé', price: 150000, rating: 4.7, category: 'Décoration', avatar: '' },
  { id: 's4', title: 'Inspection technique du bâtiment', provider: 'GeoTrust Bénin', city: 'Cotonou', price: 50000, rating: 5.0, category: 'Technique', avatar: '' },
  { id: 's5', title: 'Vidéo aérienne par drone', provider: 'DroneView Africa', city: 'Abidjan', price: 35000, rating: 4.6, category: 'Photo', avatar: '' },
];

export const tabs: CommunityTab[] = [
  { key: 'forum', label: 'Forum' },
  { key: 'investor_groups', label: 'Groupes Invest' },
  { key: 'news', label: 'Actualités' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'events', label: 'Événements' },
  { key: 'points', label: 'AfriPoints' },
  { key: 'ambassador', label: 'Ambassadeur' },
];

// re-export to keep imports used in this file's icon set (prevents accidental dead imports)
export const Icons = { Award, BookOpen, Crown, Diamond, Gem, Globe, Handshake, Lock, Medal, PenTool, Sprout, Star, Trophy };
