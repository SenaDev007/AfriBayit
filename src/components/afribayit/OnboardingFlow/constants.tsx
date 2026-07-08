import {
  BarChart3, Bell, Bot, Check, Coins, Globe, Hammer, HardHat, Home,
  Lightbulb, Lock, Mail, Map, MessageCircle, Plane, Scale, Search,
  Smartphone, Store, Tag, TrendingUp, Umbrella, User,
} from 'lucide-react';
import type { StepDefinition } from './types';

export const onboardingSteps: StepDefinition[] = [
  { step: 1, title: 'Bienvenue', icon: <Home className="w-4 h-4" /> },
  { step: 2, title: 'Profil', icon: <User className="w-4 h-4" /> },
  { step: 3, title: 'Localisation', icon: <Globe className="w-4 h-4" /> },
  { step: 4, title: 'Budget', icon: <Coins className="w-4 h-4" /> },
  { step: 5, title: 'Alertes', icon: <Bell className="w-4 h-4" /> },
  { step: 6, title: 'Découverte', icon: <Map className="w-4 h-4" /> },
  { step: 7, title: 'Rebecca IA', icon: <Bot className="w-4 h-4" /> },
];

// Profile types — CDC §4.2
export const profileTypes = [
  { value: 'acheteur', label: 'Acheteur', icon: <Home className="w-4 h-4" />, desc: 'Je cherche à acheter un bien immobilier', color: '#003087' },
  { value: 'vendeur', label: 'Vendeur', icon: <Tag className="w-4 h-4" />, desc: 'Je souhaite vendre ou louer un bien', color: '#D4AF37' },
  { value: 'investisseur', label: 'Investisseur', icon: <TrendingUp className="w-4 h-4" />, desc: 'Je cherche des opportunités d\'investissement', color: '#009CDE' },
  { value: 'touriste', label: 'Touriste', icon: <Plane className="w-4 h-4" />, desc: 'Je cherche un hébergement temporaire', color: '#00A651' },
  { value: 'artisan', label: 'Artisan', icon: <Hammer className="w-4 h-4" />, desc: 'Je suis artisan et propose mes services', color: '#2C2E2F' },
];

// Countries — AfriBayit pilot zone
export const countries = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

// Cities by country
export const citiesByCountry: Record<string, { value: string; label: string }[]> = {
  BJ: [
    { value: 'cotonou', label: 'Cotonou' },
    { value: 'porto-novo', label: 'Porto-Novo' },
    { value: 'parakou', label: 'Parakou' },
    { value: 'abomey-calavi', label: 'Abomey-Calavi' },
    { value: 'ouidah', label: 'Ouidah' },
  ],
  CI: [
    { value: 'abidjan', label: 'Abidjan' },
    { value: 'yamoussoukro', label: 'Yamoussoukro' },
    { value: 'bouake', label: 'Bouaké' },
    { value: 'san-pedro', label: 'San Pedro' },
    { value: 'korhogo', label: 'Korhogo' },
  ],
  BF: [
    { value: 'ouagadougou', label: 'Ouagadougou' },
    { value: 'bobo-dioulasso', label: 'Bobo-Dioulasso' },
    { value: 'koudougou', label: 'Koudougou' },
    { value: 'banfora', label: 'Banfora' },
  ],
  TG: [
    { value: 'lome', label: 'Lomé' },
    { value: 'sokode', label: 'Sokodé' },
    { value: 'kara', label: 'Kara' },
    { value: 'kpalime', label: 'Kpalimé' },
  ],
};

// Goals
export const goalOptions = [
  { value: 'residence', label: 'Résidence principale', icon: <Home className="w-4 h-4" /> },
  { value: 'investissement', label: 'Investissement locatif', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'vacances', label: 'Résidence secondaire / vacances', icon: <Umbrella className="w-4 h-4" /> },
  { value: 'commercial', label: 'Local commercial', icon: <Store className="w-4 h-4" /> },
  { value: 'terrain', label: 'Terrain constructible', icon: <Map className="w-4 h-4" /> },
  { value: 'neuf', label: 'Programme neuf', icon: <HardHat className="w-4 h-4" /> },
];

// Budget presets (FCFA)
export const budgetPresets = [
  { label: '< 10M', min: 0, max: 10_000_000 },
  { label: '10M – 50M', min: 10_000_000, max: 50_000_000 },
  { label: '50M – 100M', min: 50_000_000, max: 100_000_000 },
  { label: '> 100M', min: 100_000_000, max: 500_000_000 },
];

// Alert frequencies
export const alertFrequencies = [
  { value: 'instant', label: 'Instantanée', desc: 'Dès qu\'un bien correspond' },
  { value: 'daily', label: 'Quotidienne', desc: 'Résumé journalier' },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Résumé hebdomadaire' },
];

// Notification channels — CDC §4.2
export const notificationChannels = [
  { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" />, desc: 'Recevez les alertes par courriel' },
  { value: 'sms', label: 'SMS', icon: <MessageCircle className="w-4 h-4" />, desc: 'Notifications par texto' },
  { value: 'push', label: 'Notifications push', icon: <Smartphone className="w-4 h-4" />, desc: 'Alertes sur votre appareil' },
  { value: 'whatsapp', label: 'WhatsApp', icon: <Smartphone className="w-4 h-4" />, desc: 'Messages via WhatsApp' },
];

// Interactive tour items — CDC §4.2
export const tourItems = [
  { icon: <Search className="w-4 h-4" />, title: 'Recherche intelligente', desc: 'Trouvez des biens filtrés par pays, ville, budget et plus', color: '#003087' },
  { icon: <Lock className="w-4 h-4" />, title: 'Escrow sécurisé', desc: 'Vos fonds sont protégés pendant toute la transaction', color: '#00A651' },
  { icon: <Globe className="w-4 h-4" />, title: 'GeoTrust', desc: 'Validation géomatique et vérification des limites de propriété', color: '#009CDE' },
  { icon: <Hammer className="w-4 h-4" />, title: 'Marché artisans', desc: 'Trouvez des artisans certifiés pour vos travaux', color: '#D4AF37' },
  { icon: null, title: 'Académie', desc: 'Formations en droit foncier, investissement et construction', color: '#2C2E2F' },
  { icon: <Bot className="w-4 h-4" />, title: 'Rebecca IA', desc: 'Votre assistante IA disponible 24/7 pour vous guider', color: '#9333ea' },
];

// Rebecca capabilities
export const rebeccaCapabilities = [
  { icon: <Search className="w-4 h-4" />, label: 'Recherche de biens' },
  { icon: <Lock className="w-4 h-4" />, label: 'Suivi escrow' },
  { icon: <User className="w-4 h-4" />, label: 'Contacter agents' },
  { icon: <Hammer className="w-4 h-4" />, label: 'Devis artisans' },
  { icon: <BarChart3 className="w-4 h-4" />, label: 'Prix du marché' },
  { icon: <Globe className="w-4 h-4" />, label: 'GeoTrust' },
];

// Welcome feature grid (step 1)
export const welcomeFeatures = [
  { icon: <Lock className="w-4 h-4" />, label: 'Escrow', desc: 'Paiement sécurisé' },
  { icon: <Globe className="w-4 h-4" />, label: 'GeoTrust', desc: 'Vérification foncière' },
  { icon: <Scale className="w-4 h-4" />, label: 'Notaires', desc: 'Actes certifiés' },
  { icon: <Hammer className="w-4 h-4" />, label: 'Artisans', desc: 'BTP certifiés' },
  { icon: null, label: 'Académie', desc: 'Formations' },
  { icon: <Bot className="w-4 h-4" />, label: 'Rebecca IA', desc: 'Assistante 24/7' },
];

export { Check, Lightbulb, Coins, Bell, Map, User, Globe, Bot };
