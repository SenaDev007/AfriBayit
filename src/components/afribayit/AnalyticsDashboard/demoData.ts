import type {
  SearchAppearanceRow,
  ProfileViewsRow,
  ConnectionsRow,
  EngagementRow,
  ConversionStage,
  ZonePerformanceRow,
  RebeccaRecommendation,
} from './types';

export const PROFILE_VIEWS_DATA: Record<string, ProfileViewsRow> = {
  '7j': { total: 142, direct: 45, search: 62, referral: 35, evolution: 12.3 },
  '30j': { total: 587, direct: 189, search: 248, referral: 150, evolution: 18.5 },
  '90j': { total: 1842, direct: 580, search: 782, referral: 480, evolution: 24.1 },
  '12m': { total: 7250, direct: 2280, search: 3070, referral: 1900, evolution: 31.2 },
};

export const SEARCH_APPEARANCES: Record<string, SearchAppearanceRow[]> = {
  '7j': [
    { keyword: 'villa Cotonou', appearances: 28, clicks: 5, ctr: 17.8 },
    { keyword: 'terrain Abidjan', appearances: 22, clicks: 4, ctr: 18.2 },
    { keyword: 'appartement Lomé', appearances: 15, clicks: 3, ctr: 20.0 },
    { keyword: 'maison Ouagadougou', appearances: 12, clicks: 2, ctr: 16.7 },
    { keyword: 'investissement Bénin', appearances: 8, clicks: 1, ctr: 12.5 },
  ],
  '30j': [
    { keyword: 'villa Cotonou', appearances: 112, clicks: 19, ctr: 17.0 },
    { keyword: 'terrain Abidjan', appearances: 95, clicks: 16, ctr: 16.8 },
    { keyword: 'appartement Lomé', appearances: 68, clicks: 12, ctr: 17.6 },
    { keyword: 'maison Ouagadougou', appearances: 45, clicks: 7, ctr: 15.6 },
    { keyword: 'investissement Bénin', appearances: 32, clicks: 5, ctr: 15.6 },
  ],
  '90j': [
    { keyword: 'villa Cotonou', appearances: 342, clicks: 58, ctr: 17.0 },
    { keyword: 'terrain Abidjan', appearances: 285, clicks: 47, ctr: 16.5 },
    { keyword: 'appartement Lomé', appearances: 198, clicks: 35, ctr: 17.7 },
    { keyword: 'maison Ouagadougou', appearances: 142, clicks: 22, ctr: 15.5 },
    { keyword: 'investissement Bénin', appearances: 95, clicks: 14, ctr: 14.7 },
  ],
  '12m': [
    { keyword: 'villa Cotonou', appearances: 1340, clicks: 228, ctr: 17.0 },
    { keyword: 'terrain Abidjan', appearances: 1120, clicks: 187, ctr: 16.7 },
    { keyword: 'appartement Lomé', appearances: 780, clicks: 138, ctr: 17.7 },
    { keyword: 'maison Ouagadougou', appearances: 560, clicks: 87, ctr: 15.5 },
    { keyword: 'investissement Bénin', appearances: 380, clicks: 56, ctr: 14.7 },
  ],
};

export const CONNECTIONS_GROWTH: Record<string, ConnectionsRow> = {
  '7j': { connections: 8, followers: 14, connGrowth: 5.2, followGrowth: 8.1 },
  '30j': { connections: 32, followers: 58, connGrowth: 12.4, followGrowth: 18.3 },
  '90j': { connections: 87, followers: 142, connGrowth: 22.7, followGrowth: 31.5 },
  '12m': { connections: 248, followers: 425, connGrowth: 45.2, followGrowth: 62.8 },
};

export const CONTENT_ENGAGEMENT: Record<string, EngagementRow> = {
  '7j': { likes: 45, comments: 18, shares: 7, saves: 12 },
  '30j': { likes: 182, comments: 74, shares: 29, saves: 48 },
  '90j': { likes: 540, comments: 215, shares: 87, saves: 142 },
  '12m': { likes: 2180, comments: 870, shares: 350, saves: 570 },
};

export const AGENT_ANALYTICS = {
  timeToSale: { avg: 45, median: 32, best: 7, unit: 'jours' },
  performanceAnnonces: { active: 12, vues: 4520, contacts: 89, tauxConversion: 5.2 },
  volumeTransactions: { total: 5, valeur: 125000000, enCours: 3 },
  roiPremium: { investissement: 35000, revenuGenere: 87500, roi: 150, contactsSupp: 38 },
  conversionFunnel: [
    { stage: 'Vues annonce', count: 1247, pct: 100 },
    { stage: 'Contacts', count: 89, pct: 7.1 },
    { stage: 'Visites', count: 34, pct: 2.7 },
    { stage: 'Offres', count: 12, pct: 1.0 },
    { stage: 'Ventes', count: 5, pct: 0.4 },
  ] as ConversionStage[],
  localRanking: { position: 3, totalAgents: 47, city: 'Cotonou', score: 87 },
};

export const ARTISAN_ANALYTICS = {
  missionsCompleted: 28,
  avgRating: 4.7,
  tauxSatisfaction: 94,
  responseTime: 45,
  repeatClients: 62,
  monthlyRevenue: 1250000,
  demandesDevis: { recues: 85, envoyees: 62, acceptees: 38, enAttente: 12 },
  classementMetier: { position: 5, totalArtisans: 89, specialty: 'Carrelage' },
  specialties: [
    { name: 'Carrelage', missions: 12, rating: 4.8 },
    { name: 'Peinture', missions: 9, rating: 4.6 },
    { name: 'Plomberie', missions: 7, rating: 4.7 },
  ],
  conversionFunnel: [
    { stage: 'Demandes reçues', count: 85, pct: 100 },
    { stage: 'Devis envoyés', count: 62, pct: 72.9 },
    { stage: 'Devis acceptés', count: 38, pct: 44.7 },
    { stage: 'Missions terminées', count: 28, pct: 32.9 },
  ] as ConversionStage[],
};

export const FORMATEUR_ANALYTICS = {
  coursesPublished: 4,
  totalStudents: 342,
  avgRating: 4.8,
  completionRate: 78,
  monthlyRevenue: 850000,
  inscritsParCours: [
    { name: 'Droit foncier Bénin', students: 145, completion: 82 },
    { name: 'Investissement immobilier', students: 112, completion: 71 },
    { name: 'Gestion locative', students: 85, completion: 76 },
  ],
  notesAvis: { avg: 4.8, total: 127, repartition: [82, 28, 12, 4, 1] },
  certificationsDelivrees: 267,
  topCourses: [
    { name: 'Droit foncier Bénin', students: 145, rating: 4.9, revenue: 362500 },
    { name: 'Investissement immobilier', students: 112, rating: 4.7, revenue: 280000 },
    { name: 'Gestion locative', students: 85, rating: 4.8, revenue: 212500 },
  ],
  conversionFunnel: [
    { stage: 'Vues cours', count: 2840, pct: 100 },
    { stage: 'Inscriptions', count: 520, pct: 18.3 },
    { stage: 'Complétions', count: 342, pct: 12.0 },
    { stage: 'Certificats', count: 267, pct: 9.4 },
  ] as ConversionStage[],
};

export const INVESTISSEUR_ANALYTICS = {
  portfolioValue: 85000000,
  totalROI: 14.2,
  roiLocatif: 8.7,
  propertiesOwned: 6,
  monthlyRentalIncome: 1450000,
  occupancyRate: 92,
  activiteRecherche: { biensConsultes: 340, alertesActives: 5, visitesPlanifiees: 3 },
  historiqueTransactions: [
    { date: '2025-11-15', type: 'Acquisition', bien: 'Villa Cotonou Godomey', montant: 25000000 },
    { date: '2025-09-20', type: 'Acquisition', bien: 'Appartement Abidjan Cocody', montant: 18000000 },
    { date: '2025-07-08', type: 'Vente', bien: 'Studio Lomé', montant: 8500000 },
    { date: '2025-04-12', type: 'Acquisition', bien: 'Terrain Lomé Agoè', montant: 15000000 },
  ],
  investments: [
    { name: 'Villa Cotonou Godomey', value: 25000000, roi: 16.5, type: 'villa', rentalYield: 9.2 },
    { name: 'Appartement Abidjan Cocody', value: 18000000, roi: 12.8, type: 'appartement', rentalYield: 7.8 },
    { name: 'Terrain Lomé Agoè', value: 15000000, roi: 22.0, type: 'terrain', rentalYield: 0 },
    { name: 'Commerce Cotonou Ganhi', value: 12000000, roi: 10.5, type: 'commerce', rentalYield: 8.1 },
  ],
  conversionFunnel: [
    { stage: 'Biens analysés', count: 340, pct: 100 },
    { stage: 'Visites effectuées', count: 45, pct: 13.2 },
    { stage: 'Offres faites', count: 12, pct: 3.5 },
    { stage: 'Acquisitions', count: 6, pct: 1.8 },
  ] as ConversionStage[],
};

export const DEMO_COMPLETENESS = {
  percentage: 65,
  missing: [
    { field: 'certifications', labelFr: 'Certifications', weight: 10 },
    { field: 'portfolio', labelFr: 'Portfolio', weight: 10 },
    { field: 'education', labelFr: 'Formation', weight: 10 },
  ],
};

export const DEMO_COMPARISON = {
  metrics: [
    { labelFr: 'Taux de conversion', user: 5.2, market: 4.4, unit: '%', status: 'above' as const },
    { labelFr: 'Temps de réponse', user: 150, market: 180, unit: 'min', status: 'above' as const },
    { labelFr: 'Vues par annonce', user: 200, market: 250, unit: '/mois', status: 'below' as const },
    { labelFr: 'Taux de clôture', user: 22, market: 20, unit: '%', status: 'above' as const },
    { labelFr: 'Complétude annonces', user: 58, market: 65, unit: '%', status: 'below' as const },
  ],
};

export const ZONE_PERFORMANCE: ZonePerformanceRow[] = [
  { zone: 'Cotonou Godomey', performance: 87, trend: 'up', avgPrice: 35000000 },
  { zone: 'Cotonou Ganhi', performance: 72, trend: 'up', avgPrice: 28000000 },
  { zone: 'Abidjan Cocody', performance: 91, trend: 'up', avgPrice: 45000000 },
  { zone: 'Abidjan Yopougon', performance: 65, trend: 'down', avgPrice: 18000000 },
  { zone: 'Lomé Agoè', performance: 58, trend: 'stable', avgPrice: 12000000 },
  { zone: 'Ouagadougou Koulouba', performance: 44, trend: 'down', avgPrice: 15000000 },
  { zone: 'Cotonou Fidjrossè', performance: 79, trend: 'up', avgPrice: 22000000 },
  { zone: 'Abidjan Plateau', performance: 95, trend: 'up', avgPrice: 65000000 },
];

export const REBECCA_RECOMMENDATIONS: RebeccaRecommendation[] = [
  {
    id: 'rec-1',
    title: 'Optimisez vos annonces',
    description: 'Ajoutez des photos HD et une description détaillée pour augmenter vos vues de 40%. Les annonces avec 8+ photos reçoivent 2x plus de contacts.',
    action: 'Compléter mes annonces',
    priority: 'high',
    icon: 'listing',
  },
  {
    id: 'rec-2',
    title: 'Répondez plus rapidement',
    description: 'Votre temps de réponse moyen est de 150 min. Les agents qui répondent en moins de 30 min ont un taux de conversion 3x supérieur.',
    action: 'Voir les messages non lus',
    priority: 'high',
    icon: 'message',
  },
  {
    id: 'rec-3',
    title: 'Passez en Pro Essentiel',
    description: 'Avec le plan Pro Essentiel, vos annonces seraient vues en premier. Boost x1.5 sur toutes vos publications. ROI estimé: +35% de contacts.',
    action: 'Découvrir Premium',
    priority: 'medium',
    icon: 'premium',
  },
  {
    id: 'rec-4',
    title: 'Ciblez Godomey et Cocody',
    description: 'Ces zones montrent une forte demande actuelle. 3 de vos annonces correspondent aux critères recherchés dans ces quartiers.',
    action: 'Voir les opportunités',
    priority: 'medium',
    icon: 'location',
  },
  {
    id: 'rec-5',
    title: 'Obtenez votre certification',
    description: 'Les agents certifiés gagnent 28% plus de confiance. Complétez votre vérification KYC pour débloquer le badge certifié.',
    action: 'Commencer la vérification',
    priority: 'low',
    icon: 'cert',
  },
  {
    id: 'rec-6',
    title: 'Augmentez votre réseau',
    description: 'Votre nombre de connexions a augmenté de 12% ce mois. Continuez à développer votre réseau pour accroître votre visibilité.',
    action: 'Voir les suggestions',
    priority: 'low',
    icon: 'network',
  },
];

export const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun',
  '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
};

export const CITY_COLORS: Record<string, string> = {
  'Cotonou': '#003087',
  'Abidjan': '#009CDE',
  'Lomé': '#D4AF37',
  'Ouagadougou': '#00A651',
};

export const easeOut = [0.16, 1, 0.3, 1] as const;
