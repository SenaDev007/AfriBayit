/**
 * Directory dataset — annuaires Artisans BTP & Notaires (P1 audit Manus)
 *
 * Source unique de vérité partagée entre :
 *  - `prisma/seed.ts` (bases fraîches)
 *  - `/api/admin/migrate` (patch idempotent de la base de production,
 *    sans re-seed destructif)
 *
 * Contraintes de schéma respectées :
 *  - Artisan.userId  est unique → 1 profil artisan par compte utilisateur
 *  - Notary.userId et Notary.licenseNumber sont uniques
 *  - les emails des comptes "annuaire" sont dédiés (@artisan.afribayit.com /
 *    @notaire.afribayit.com) pour ne jamais entrer en collision avec les
 *    comptes de test classiques (artisan1@…, notaire1@…).
 */

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface DirectoryUserSeed {
  email: string;
  phone: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  country: string;
  city: string;
  kycLevel: number;
  score: number;
  reputation: string;
  bio: string;
  verified: boolean;
  preferredLanguage: string;
  currency: string;
}

export interface DirectoryArtisanSeed {
  /** email du compte utilisateur porteur du profil (clé de jointure) */
  userEmail: string;
  trade: string;
  specialties: string[];
  certified: boolean;
  kybValid: boolean;
  available: boolean;
  emergency: boolean;
  priceRange: string;
  dailyRate: number;
  rating: number;
  reviews: number;
  zone: string;
  city: string;
  country: string;
  subscriptionTier: string;
  responseTime: number;
  completedMissions: number;
  portfolio: string[];
}

export interface DirectoryNotarySeed {
  /** email du compte utilisateur porteur du profil (clé de jointure) */
  userEmail: string;
  licenseNumber: string;
  chamberName: string;
  specialty: string;
  certificationLevel: string;
  country: string;
  zone: string;
  available: boolean;
  rating: number;
  missions: number;
  subscriptionTier: string;
  conventionSigned: boolean;
  conventionUrl?: string;
  certified: boolean;
  /** jours avant maintenant pour certifiedAt (entier) */
  certifiedDaysAgo: number;
}

// Images du pool déjà vérifiées HTTP 200 (dédupliquées lors du fix P0).
const IMG = {
  chantier1: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
  chantier2: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
  chantier3: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop',
  interieur: 'https://images.unsplash.com/photo-1586023492125-27b2c045fd7a?w=400&h=300&fit=crop',
  interieur2: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
  toiture: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop',
  cuisine: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=300&fit=crop',
  paysage: 'https://images.unsplash.com/photo-1585323945692-8e6d4d1c1c1c?w=400&h=300&fit=crop',
  bureau: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
  renovation: 'https://images.unsplash.com/photo-1503564693086-6f6b50dbb5f6?w=400&h=300&fit=crop',
};

// ─────────────────────────────────────────────────────────────────────────
// Comptes utilisateurs dédiés aux annuaires
// ─────────────────────────────────────────────────────────────────────────

export const DIRECTORY_ARTISAN_USERS: DirectoryUserSeed[] = [
  // ── Bénin ──
  { email: 'serge.aka@artisan.afribayit.com', phone: '+229 97 12 34 01', name: 'Serge Aka', firstName: 'Serge', lastName: 'Aka', role: 'artisan', country: 'BJ', city: 'Cotonou', kycLevel: 2, score: 720, reputation: 'Artisan fiable', bio: 'Maçon expérimenté, 12 ans de chantiers résidentiels et commerciaux à Cotonou. Spécialiste des fondations et du gros œuvre.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'kossi.adjovi@artisan.afribayit.com', phone: '+229 97 12 34 02', name: 'Kossi Adjovi', firstName: 'Kossi', lastName: 'Adjovi', role: 'artisan', country: 'BJ', city: 'Cotonou', kycLevel: 2, score: 745, reputation: 'Artisan fiable', bio: 'Électricien certifié — installations domestiques et tertiaires, mise aux normes, tableaux et groupes électrogènes.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'rachelle.agbo@artisan.afribayit.com', phone: '+229 97 12 34 03', name: 'Rachelle Agbo', firstName: 'Rachelle', lastName: 'Agbo', role: 'artisan', country: 'BJ', city: 'Porto-Novo', kycLevel: 2, score: 690, reputation: 'Artisan fiable', bio: 'Plombière diplômée — réseaux d\'eau, sanitaires, pompes et surpresseurs. Interventions rapides sur Porto-Novo et environs.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'ibrahim.bio@artisan.afribayit.com', phone: '+229 97 12 34 04', name: 'Ibrahim Bio', firstName: 'Ibrahim', lastName: 'Bio', role: 'artisan', country: 'BJ', city: 'Cotonou', kycLevel: 2, score: 705, reputation: 'Artisan fiable', bio: 'Carreleur-faïencier — sols, murs, terrasses. Pose grès cérame, marbre et granito avec finitions soignées.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'firmin.hounsou@artisan.afribayit.com', phone: '+229 97 12 34 05', name: 'Firmin Hounsou', firstName: 'Firmin', lastName: 'Hounsou', role: 'artisan', country: 'BJ', city: 'Abomey-Calavi', kycLevel: 2, score: 675, reputation: 'Artisan fiable', bio: 'Coffreur-bétonnier — dalles, poteaux, longrines et dallage industriel. Équipe de 4 personnes disponible.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'nadege.tossou@artisan.afribayit.com', phone: '+229 97 12 34 06', name: 'Nadège Tossou', firstName: 'Nadège', lastName: 'Tossou', role: 'artisan', country: 'BJ', city: 'Cotonou', kycLevel: 3, score: 810, reputation: 'Artisan Pro', bio: 'Architecte d\'intérieur — conception 3D, home staging, agencement complet d\'appartements et de bureaux.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'ulrich.vodounon@artisan.afribayit.com', phone: '+229 97 12 34 07', name: 'Ulrich Vodounon', firstName: 'Ulrich', lastName: 'Vodounon', role: 'artisan', country: 'BJ', city: 'Cotonou', kycLevel: 2, score: 715, reputation: 'Artisan fiable', bio: 'Climaticien-frigoriste — split, gainable, chambres froides et maintenance préventive. Intervention sous 24h.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'bernice.dossa@artisan.afribayit.com', phone: '+229 97 12 34 08', name: 'Bernice Dossa', firstName: 'Bernice', lastName: 'Dossa', role: 'artisan', country: 'BJ', city: 'Porto-Novo', kycLevel: 1, score: 560, reputation: 'Nouvel artisan', bio: 'Peintre en bâtiment — peinture décorative, enduits et ravalement de façades. Profil en cours de certification.', verified: false, preferredLanguage: 'fr', currency: 'XOF' },
  // ── Côte d'Ivoire ──
  { email: 'mamadou.traore@artisan.afribayit.com', phone: '+225 07 12 34 01', name: 'Mamadou Traoré', firstName: 'Mamadou', lastName: 'Traoré', role: 'artisan', country: 'CI', city: 'Abidjan', kycLevel: 2, score: 730, reputation: 'Artisan fiable', bio: 'Constructeur parpaings — murs porteurs, clôtures et blocs vibrés. Production sur site possible.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'awa.kone@artisan.afribayit.com', phone: '+225 07 12 34 02', name: 'Awa Koné', firstName: 'Awa', lastName: 'Koné', role: 'artisan', country: 'CI', city: 'Abidjan', kycLevel: 3, score: 825, reputation: 'Artisan Pro', bio: 'Menuisière ébéniste — cuisines sur mesure, dressings, escaliers et parquets. Atelier à Yopougon.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'yao.nguessan@artisan.afribayit.com', phone: '+225 07 12 34 03', name: 'Yao N\'Guessan', firstName: 'Yao', lastName: 'N\'Guessan', role: 'artisan', country: 'CI', city: 'Yamoussoukro', kycLevel: 2, score: 740, reputation: 'Artisan fiable', bio: 'Installateur solaire photovoltaïque — kits autonomes, pompes solaires et raccordements hybrides.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'chantal.amani@artisan.afribayit.com', phone: '+225 07 12 34 04', name: 'Chantal Amani', firstName: 'Chantal', lastName: 'Amani', role: 'artisan', country: 'CI', city: 'Abidjan', kycLevel: 2, score: 700, reputation: 'Artisan fiable', bio: 'Paysagiste — aménagement de jardins, gazon, arrosage automatique et entretien d\'espaces verts.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'salif.bamba@artisan.afribayit.com', phone: '+225 07 12 34 05', name: 'Salif Bamba', firstName: 'Salif', lastName: 'Bamba', role: 'artisan', country: 'CI', city: 'Bouaké', kycLevel: 2, score: 685, reputation: 'Artisan fiable', bio: 'Étanchéiste — toitures-terrasses, membranes bitumineuses et traitement des fuites récurrentes.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'georges.kouassi@artisan.afribayit.com', phone: '+225 07 12 34 06', name: 'Georges Kouassi', firstName: 'Georges', lastName: 'Kouassi', role: 'artisan', country: 'CI', city: 'Abidjan', kycLevel: 3, score: 795, reputation: 'Artisan Pro', bio: 'Domotique / smart home — vidéosurveillance, alarmes, automatismes de portails et réseaux domotiques.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  // ── Togo ──
  { email: 'koffi.amegan@artisan.afribayit.com', phone: '+228 90 12 34 01', name: 'Koffi Amégan', firstName: 'Koffi', lastName: 'Amégan', role: 'artisan', country: 'TG', city: 'Lomé', kycLevel: 2, score: 710, reputation: 'Artisan fiable', bio: 'Charpentier — charpentes bois et métalliques, couverture associée et vérification de stabilité.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'afide.tchalla@artisan.afribayit.com', phone: '+228 90 12 34 02', name: 'Afide Tchalla', firstName: 'Afide', lastName: 'Tchalla', role: 'artisan', country: 'TG', city: 'Lomé', kycLevel: 2, score: 695, reputation: 'Artisan fiable', bio: 'Couvreur — tôles bac alu, tuiles, gouttières et étanchéité de toits. Déplacements dans tout le Maritime.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'richard.ayele@artisan.afribayit.com', phone: '+228 90 12 34 03', name: 'Richard Ayélé', firstName: 'Richard', lastName: 'Ayélé', role: 'artisan', country: 'TG', city: 'Kara', kycLevel: 2, score: 680, reputation: 'Artisan fiable', bio: 'Rénovateur — réhabilitation complète de logements anciens : plomberie, électricité, finitions.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'sabine.kpodar@artisan.afribayit.com', phone: '+228 90 12 34 04', name: 'Sabine Kpodar', firstName: 'Sabine', lastName: 'Kpodar', role: 'artisan', country: 'TG', city: 'Lomé', kycLevel: 2, score: 725, reputation: 'Artisan fiable', bio: 'Pisciniste — bassins maçonnés, kits coques, filtration et traitement d\'eau.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'mensah.tetteh@artisan.afribayit.com', phone: '+228 90 12 34 05', name: 'Mensah Tetteh', firstName: 'Mensah', lastName: 'Tetteh', role: 'artisan', country: 'TG', city: 'Tsévié', kycLevel: 1, score: 545, reputation: 'Nouvel artisan', bio: 'Terrassier — fouilles, nivellements et accès de chantier. En cours de certification plateforme.', verified: false, preferredLanguage: 'fr', currency: 'XOF' },
  // ── Burkina Faso ──
  { email: 'moussa.sawadogo@artisan.afribayit.com', phone: '+226 70 12 34 01', name: 'Moussa Sawadogo', firstName: 'Moussa', lastName: 'Sawadogo', role: 'artisan', country: 'BF', city: 'Ouagadougou', kycLevel: 2, score: 735, reputation: 'Artisan fiable', bio: 'Maçon — murs, dalles et extensions. Maîtrise de la construction en banco stabilisé et parpaings.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'fatimata.kabore@artisan.afribayit.com', phone: '+226 70 12 34 02', name: 'Fatimata Kaboré', firstName: 'Fatimata', lastName: 'Kaboré', role: 'artisan', country: 'BF', city: 'Ouagadougou', kycLevel: 2, score: 720, reputation: 'Artisan fiable', bio: 'Peintre en bâtiment — décoration intérieure, façades et finitions haute qualité.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'issouf.compaore@artisan.afribayit.com', phone: '+226 70 12 34 03', name: 'Issouf Compaoré', firstName: 'Issouf', lastName: 'Compaoré', role: 'artisan', country: 'BF', city: 'Bobo-Dioulasso', kycLevel: 2, score: 705, reputation: 'Artisan fiable', bio: 'Plombier — adduction d\'eau, forages, plomberie sanitaire et dégorgement.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'alizeta.ouedraogo@artisan.afribayit.com', phone: '+226 70 12 34 04', name: 'Alizèta Ouédraogo', firstName: 'Alizèta', lastName: 'Ouédraogo', role: 'artisan', country: 'BF', city: 'Ouagadougou', kycLevel: 2, score: 690, reputation: 'Artisan fiable', bio: 'Plâtrière — cloisons sèches, faux plafonds et staff décoratif.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'boukary.zongo@artisan.afribayit.com', phone: '+226 70 12 34 05', name: 'Boukary Zongo', firstName: 'Boukary', lastName: 'Zongo', role: 'artisan', country: 'BF', city: 'Koudougou', kycLevel: 2, score: 685, reputation: 'Artisan fiable', bio: 'Tailleur de pierre — moellons, parements et pierre de taille pour villas et clôtures.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
];

export const DIRECTORY_NOTARY_USERS: DirectoryUserSeed[] = [
  // ── Bénin ──
  { email: 'grace.sossou@notaire.afribayit.com', phone: '+229 96 55 55 01', name: 'Me Grâce Sossou', firstName: 'Grâce', lastName: 'Sossou', role: 'notary', country: 'BJ', city: 'Cotonou', kycLevel: 3, score: 930, reputation: 'Notaire certifié', bio: 'Notaire — droit foncier et formalisation d\'actes de vente immobilière. Étude à Cotonou Ganhi.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'luc.zinsou@notaire.afribayit.com', phone: '+229 96 55 55 02', name: 'Me Luc Zinsou', firstName: 'Luc', lastName: 'Zinsou', role: 'notary', country: 'BJ', city: 'Porto-Novo', kycLevel: 3, score: 900, reputation: 'Notaire certifié', bio: 'Notaire — successions et partage immobilier. Étude historique de Porto-Novo.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'bernadette.alavo@notaire.afribayit.com', phone: '+229 96 55 55 03', name: 'Me Bernadette Alavo', firstName: 'Bernadette', lastName: 'Alavo', role: 'notary', country: 'BJ', city: 'Cotonou', kycLevel: 3, score: 915, reputation: 'Notaire certifié', bio: 'Notaire — baux professionnels et commerciaux, montage de sociétés immobilières.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'patrick.adechy@notaire.afribayit.com', phone: '+229 96 55 55 04', name: 'Me Patrick Adechy', firstName: 'Patrick', lastName: 'Adechy', role: 'notary', country: 'BJ', city: 'Parakou', kycLevel: 3, score: 880, reputation: 'Notaire certifié', bio: 'Notaire — droit des sociétés et conseils aux investisseurs du Nord-Bénin.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  // ── Côte d'Ivoire ──
  { email: 'alassane.coulibaly@notaire.afribayit.com', phone: '+225 27 22 44 01', name: 'Me Alassane Coulibaly', firstName: 'Alassane', lastName: 'Coulibaly', role: 'notary', country: 'CI', city: 'Abidjan', kycLevel: 3, score: 935, reputation: 'Notaire certifié', bio: 'Notaire — droit foncier, immatriculation et attestations villageoises. Étude au Plateau.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'mariam.diabate@notaire.afribayit.com', phone: '+225 27 22 44 02', name: 'Me Mariam Diabaté', firstName: 'Mariam', lastName: 'Diabaté', role: 'notary', country: 'CI', city: 'Abidjan', kycLevel: 3, score: 905, reputation: 'Notaire certifié', bio: 'Notaire — successions et libéralités, contentieux familial préventif.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'jean.kouame@notaire.afribayit.com', phone: '+225 27 22 44 03', name: 'Me Jean Kouamé', firstName: 'Jean', lastName: 'Kouamé', role: 'notary', country: 'CI', city: 'Yamoussoukro', kycLevel: 3, score: 875, reputation: 'Notaire certifié', bio: 'Notaire — baux d\'habitation et conventions de mise en location.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  // ── Togo ──
  { email: 'kossi.olympio@notaire.afribayit.com', phone: '+228 22 21 33 01', name: 'Me Kossi Olympio', firstName: 'Kossi', lastName: 'Olympio', role: 'notary', country: 'TG', city: 'Lomé', kycLevel: 3, score: 920, reputation: 'Notaire certifié', bio: 'Notaire — droit foncier et constat de vente coutumière. Étude au centre-ville de Lomé.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'akouwa.gnassingbe@notaire.afribayit.com', phone: '+228 22 21 33 02', name: 'Me Akouwa Gnassingbé', firstName: 'Akouwa', lastName: 'Gnassingbé', role: 'notary', country: 'TG', city: 'Lomé', kycLevel: 3, score: 890, reputation: 'Notaire certifié', bio: 'Notaire — successions et gestion patrimoniale familiale.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'emmanuel.bodjona@notaire.afribayit.com', phone: '+228 22 21 33 03', name: 'Me Emmanuel Bodjona', firstName: 'Emmanuel', lastName: 'Bodjona', role: 'notary', country: 'TG', city: 'Kara', kycLevel: 3, score: 865, reputation: 'Notaire certifié', bio: 'Notaire — baux ruraux et transactions foncières du Nord-Togo.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  // ── Burkina Faso ──
  { email: 'mariam.ouedraogo@notaire.afribayit.com', phone: '+226 25 31 44 01', name: 'Me Mariam Ouédraogo', firstName: 'Mariam', lastName: 'Ouédraogo', role: 'notary', country: 'BF', city: 'Ouagadougou', kycLevel: 3, score: 925, reputation: 'Notaire certifié', bio: 'Notaire — droit foncier et sécurisation d\'acquisitions périurbaines à Ouaga.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
  { email: 'soungalo.sawadogo@notaire.afribayit.com', phone: '+226 25 31 44 02', name: 'Me Soungalo Sawadogo', firstName: 'Soungalo', lastName: 'Sawadogo', role: 'notary', country: 'BF', city: 'Bobo-Dioulasso', kycLevel: 3, score: 895, reputation: 'Notaire certifié', bio: 'Notaire — droit des sociétés et transactions agricoles dans l\'Ouest.', verified: true, preferredLanguage: 'fr', currency: 'XOF' },
];

// ─────────────────────────────────────────────────────────────────────────
// Artisans — 24 profils (métiers alignés sur les filtres du marketplace)
// ─────────────────────────────────────────────────────────────────────────

export const DIRECTORY_ARTISANS: DirectoryArtisanSeed[] = [
  // ── Bénin ──
  { userEmail: 'serge.aka@artisan.afribayit.com', trade: 'Maçon', specialties: ['gros œuvre', 'fondations', 'murs porteurs', 'dalles'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '12000-35000', dailyRate: 22000, rating: 4.6, reviews: 38, zone: 'Cotonou et environs', city: 'Cotonou', country: 'BJ', subscriptionTier: 'pro', responseTime: 25, completedMissions: 47, portfolio: [IMG.chantier1, IMG.chantier2, IMG.chantier3] },
  { userEmail: 'kossi.adjovi@artisan.afribayit.com', trade: 'Électricien', specialties: ['installation domestique', 'tableaux électriques', 'mise aux normes', 'groupes électrogènes'], certified: true, kybValid: true, available: true, emergency: true, priceRange: '15000-45000', dailyRate: 28000, rating: 4.8, reviews: 52, zone: 'Cotonou', city: 'Cotonou', country: 'BJ', subscriptionTier: 'pro', responseTime: 15, completedMissions: 63, portfolio: [IMG.chantier2, IMG.bureau] },
  { userEmail: 'rachelle.agbo@artisan.afribayit.com', trade: 'Plombier', specialties: ['réseaux d\'eau', 'sanitaires', 'pompes', 'surpresseurs'], certified: true, kybValid: true, available: true, emergency: true, priceRange: '10000-30000', dailyRate: 20000, rating: 4.5, reviews: 29, zone: 'Porto-Novo et environs', city: 'Porto-Novo', country: 'BJ', subscriptionTier: 'pro', responseTime: 30, completedMissions: 35, portfolio: [IMG.chantier3, IMG.cuisine] },
  { userEmail: 'ibrahim.bio@artisan.afribayit.com', trade: 'Carreleur / Faïencier', specialties: ['sols', 'murs', 'grès cérame', 'marbre', 'granito'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '13000-40000', dailyRate: 24000, rating: 4.4, reviews: 21, zone: 'Cotonou', city: 'Cotonou', country: 'BJ', subscriptionTier: 'gratuit', responseTime: 40, completedMissions: 26, portfolio: [IMG.interieur, IMG.chantier1] },
  { userEmail: 'firmin.hounsou@artisan.afribayit.com', trade: 'Coffreur / Bétonnier', specialties: ['coffrage', 'dallage', 'poteaux', 'longrines'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '14000-38000', dailyRate: 23000, rating: 4.3, reviews: 17, zone: 'Abomey-Calavi', city: 'Abomey-Calavi', country: 'BJ', subscriptionTier: 'gratuit', responseTime: 45, completedMissions: 19, portfolio: [IMG.chantier1, IMG.chantier3] },
  { userEmail: 'nadege.tossou@artisan.afribayit.com', trade: 'Architecte d\'intérieur', specialties: ['conception 3D', 'home staging', 'agencement', 'consultation'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '25000-60000', dailyRate: 35000, rating: 4.9, reviews: 44, zone: 'Cotonou', city: 'Cotonou', country: 'BJ', subscriptionTier: 'pro', responseTime: 20, completedMissions: 51, portfolio: [IMG.interieur, IMG.interieur2, IMG.bureau] },
  { userEmail: 'ulrich.vodounon@artisan.afribayit.com', trade: 'Climaticien / Frigoriste', specialties: ['split', 'gainable', 'chambres froides', 'maintenance'], certified: true, kybValid: true, available: true, emergency: true, priceRange: '18000-50000', dailyRate: 30000, rating: 4.6, reviews: 33, zone: 'Cotonou', city: 'Cotonou', country: 'BJ', subscriptionTier: 'pro', responseTime: 20, completedMissions: 40, portfolio: [IMG.bureau, IMG.renovation] },
  { userEmail: 'bernice.dossa@artisan.afribayit.com', trade: 'Peintre en bâtiment', specialties: ['peinture décorative', 'enduits', 'ravalement'], certified: false, kybValid: false, available: true, emergency: false, priceRange: '8000-25000', dailyRate: 15000, rating: 4.0, reviews: 9, zone: 'Porto-Novo', city: 'Porto-Novo', country: 'BJ', subscriptionTier: 'gratuit', responseTime: 55, completedMissions: 11, portfolio: [IMG.renovation, IMG.interieur2] },
  // ── Côte d'Ivoire ──
  { userEmail: 'mamadou.traore@artisan.afribayit.com', trade: 'Constructeur parpaings', specialties: ['murs', 'clôtures', 'blocs vibrés'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '12000-32000', dailyRate: 21000, rating: 4.4, reviews: 24, zone: 'Abidjan', city: 'Abidjan', country: 'CI', subscriptionTier: 'pro', responseTime: 30, completedMissions: 28, portfolio: [IMG.chantier1, IMG.chantier3] },
  { userEmail: 'awa.kone@artisan.afribayit.com', trade: 'Menuisier', specialties: ['cuisines sur mesure', 'dressings', 'escaliers', 'parquets'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '20000-55000', dailyRate: 32000, rating: 4.8, reviews: 41, zone: 'Abidjan', city: 'Abidjan', country: 'CI', subscriptionTier: 'pro', responseTime: 18, completedMissions: 49, portfolio: [IMG.cuisine, IMG.interieur] },
  { userEmail: 'yao.nguessan@artisan.afribayit.com', trade: 'Installateur solaire photovoltaïque', specialties: ['kits autonomes', 'pompes solaires', 'hybride'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '22000-60000', dailyRate: 34000, rating: 4.7, reviews: 26, zone: 'Yamoussoukro et centre', city: 'Yamoussoukro', country: 'CI', subscriptionTier: 'pro', responseTime: 25, completedMissions: 31, portfolio: [IMG.chantier2, IMG.bureau] },
  { userEmail: 'chantal.amani@artisan.afribayit.com', trade: 'Paysagiste', specialties: ['jardins', 'gazon', 'arrosage automatique'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '15000-45000', dailyRate: 26000, rating: 4.5, reviews: 19, zone: 'Abidjan', city: 'Abidjan', country: 'CI', subscriptionTier: 'gratuit', responseTime: 35, completedMissions: 22, portfolio: [IMG.paysage] },
  { userEmail: 'salif.bamba@artisan.afribayit.com', trade: 'Étanchéiste', specialties: ['toitures-terrasses', 'membranes', 'fuites'], certified: true, kybValid: true, available: true, emergency: true, priceRange: '14000-40000', dailyRate: 25000, rating: 4.3, reviews: 15, zone: 'Bouaké', city: 'Bouaké', country: 'CI', subscriptionTier: 'gratuit', responseTime: 40, completedMissions: 17, portfolio: [IMG.toiture, IMG.chantier3] },
  { userEmail: 'georges.kouassi@artisan.afribayit.com', trade: 'Domotique / Smart Home', specialties: ['vidéosurveillance', 'alarmes', 'automatismes'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '25000-70000', dailyRate: 38000, rating: 4.7, reviews: 23, zone: 'Abidjan', city: 'Abidjan', country: 'CI', subscriptionTier: 'pro', responseTime: 20, completedMissions: 27, portfolio: [IMG.bureau, IMG.interieur] },
  // ── Togo ──
  { userEmail: 'koffi.amegan@artisan.afribayit.com', trade: 'Charpentier', specialties: ['charpente bois', 'charpente métallique', 'stabilité'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '16000-42000', dailyRate: 27000, rating: 4.4, reviews: 20, zone: 'Lomé', city: 'Lomé', country: 'TG', subscriptionTier: 'pro', responseTime: 30, completedMissions: 24, portfolio: [IMG.toiture, IMG.chantier1] },
  { userEmail: 'afide.tchalla@artisan.afribayit.com', trade: 'Couvreur', specialties: ['bac alu', 'tuiles', 'gouttières', 'étanchéité'], certified: true, kybValid: true, available: true, emergency: true, priceRange: '10000-28000', dailyRate: 18000, rating: 4.2, reviews: 13, zone: 'Lomé et Maritime', city: 'Lomé', country: 'TG', subscriptionTier: 'gratuit', responseTime: 40, completedMissions: 16, portfolio: [IMG.toiture] },
  { userEmail: 'richard.ayele@artisan.afribayit.com', trade: 'Rénovateur', specialties: ['réhabilitation', 'plomberie', 'électricité', 'finitions'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '18000-50000', dailyRate: 29000, rating: 4.5, reviews: 18, zone: 'Kara et Nord', city: 'Kara', country: 'TG', subscriptionTier: 'pro', responseTime: 35, completedMissions: 21, portfolio: [IMG.renovation, IMG.interieur2] },
  { userEmail: 'sabine.kpodar@artisan.afribayit.com', trade: 'Pisciniste', specialties: ['bassins maçonnés', 'kits coques', 'filtration'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '30000-80000', dailyRate: 42000, rating: 4.6, reviews: 12, zone: 'Lomé', city: 'Lomé', country: 'TG', subscriptionTier: 'pro', responseTime: 30, completedMissions: 14, portfolio: [IMG.paysage, IMG.interieur2] },
  { userEmail: 'mensah.tetteh@artisan.afribayit.com', trade: 'Terrassier', specialties: ['fouilles', 'nivellement', 'accès chantier'], certified: false, kybValid: false, available: true, emergency: false, priceRange: '9000-22000', dailyRate: 16000, rating: 3.9, reviews: 7, zone: 'Tsévié', city: 'Tsévié', country: 'TG', subscriptionTier: 'gratuit', responseTime: 50, completedMissions: 9, portfolio: [IMG.chantier3] },
  // ── Burkina Faso ──
  { userEmail: 'moussa.sawadogo@artisan.afribayit.com', trade: 'Maçon', specialties: ['murs', 'dalles', 'extensions', 'banco stabilisé'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '11000-30000', dailyRate: 19000, rating: 4.5, reviews: 31, zone: 'Ouagadougou', city: 'Ouagadougou', country: 'BF', subscriptionTier: 'pro', responseTime: 30, completedMissions: 38, portfolio: [IMG.chantier1, IMG.chantier2] },
  { userEmail: 'fatimata.kabore@artisan.afribayit.com', trade: 'Peintre en bâtiment', specialties: ['décoration intérieure', 'façades', 'finitions'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '10000-28000', dailyRate: 17000, rating: 4.4, reviews: 22, zone: 'Ouagadougou', city: 'Ouagadougou', country: 'BF', subscriptionTier: 'pro', responseTime: 35, completedMissions: 25, portfolio: [IMG.renovation, IMG.interieur] },
  { userEmail: 'issouf.compaore@artisan.afribayit.com', trade: 'Plombier', specialties: ['adduction d\'eau', 'forages', 'sanitaire', 'dégorgement'], certified: true, kybValid: true, available: true, emergency: true, priceRange: '12000-32000', dailyRate: 20000, rating: 4.3, reviews: 16, zone: 'Bobo-Dioulasso', city: 'Bobo-Dioulasso', country: 'BF', subscriptionTier: 'gratuit', responseTime: 40, completedMissions: 18, portfolio: [IMG.chantier2, IMG.cuisine] },
  { userEmail: 'alizeta.ouedraogo@artisan.afribayit.com', trade: 'Plâtrier', specialties: ['cloisons sèches', 'faux plafonds', 'staff décoratif'], certified: true, kybValid: true, available: true, emergency: false, priceRange: '13000-35000', dailyRate: 22000, rating: 4.4, reviews: 14, zone: 'Ouagadougou', city: 'Ouagadougou', country: 'BF', subscriptionTier: 'gratuit', responseTime: 35, completedMissions: 17, portfolio: [IMG.interieur2, IMG.renovation] },
  { userEmail: 'boukary.zongo@artisan.afribayit.com', trade: 'Tailleur de pierre', specialties: ['moellons', 'parements', 'pierre de taille'], certified: true, kybValid: false, available: true, emergency: false, priceRange: '14000-36000', dailyRate: 23000, rating: 4.2, reviews: 10, zone: 'Koudougou', city: 'Koudougou', country: 'BF', subscriptionTier: 'gratuit', responseTime: 45, completedMissions: 12, portfolio: [IMG.chantier3, IMG.chantier1] },
];

// ─────────────────────────────────────────────────────────────────────────
// Notaires — 12 études (chambres réelles des 4 pays)
// ─────────────────────────────────────────────────────────────────────────

export const DIRECTORY_NOTARIES: DirectoryNotarySeed[] = [
  // ── Bénin ──
  { userEmail: 'grace.sossou@notaire.afribayit.com', licenseNumber: 'NOT-BJ-2025-101', chamberName: 'Chambre Nationale des Notaires du Bénin', specialty: 'droit_foncier', certificationLevel: 'expert', country: 'BJ', zone: 'Cotonou et environs', available: true, rating: 4.9, missions: 52, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-bj-101.pdf', certified: true, certifiedDaysAgo: 210 },
  { userEmail: 'luc.zinsou@notaire.afribayit.com', licenseNumber: 'NOT-BJ-2025-102', chamberName: 'Chambre Nationale des Notaires du Bénin', specialty: 'succession', certificationLevel: 'expert', country: 'BJ', zone: 'Porto-Novo', available: true, rating: 4.6, missions: 34, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-bj-102.pdf', certified: true, certifiedDaysAgo: 180 },
  { userEmail: 'bernadette.alavo@notaire.afribayit.com', licenseNumber: 'NOT-BJ-2025-103', chamberName: 'Chambre Nationale des Notaires du Bénin', specialty: 'baux', certificationLevel: 'expert', country: 'BJ', zone: 'Cotonou', available: true, rating: 4.7, missions: 41, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-bj-103.pdf', certified: true, certifiedDaysAgo: 160 },
  { userEmail: 'patrick.adechy@notaire.afribayit.com', licenseNumber: 'NOT-BJ-2025-104', chamberName: 'Chambre Nationale des Notaires du Bénin', specialty: 'societes', certificationLevel: 'standard', country: 'BJ', zone: 'Parakou et Nord-Bénin', available: true, rating: 4.4, missions: 26, subscriptionTier: 'essentiel', conventionSigned: false, certified: true, certifiedDaysAgo: 120 },
  // ── Côte d'Ivoire ──
  { userEmail: 'alassane.coulibaly@notaire.afribayit.com', licenseNumber: 'NOT-CI-2025-201', chamberName: 'Chambre des Notaires de Côte d\'Ivoire', specialty: 'droit_foncier', certificationLevel: 'expert', country: 'CI', zone: 'Abidjan et environs', available: true, rating: 4.8, missions: 58, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-ci-201.pdf', certified: true, certifiedDaysAgo: 190 },
  { userEmail: 'mariam.diabate@notaire.afribayit.com', licenseNumber: 'NOT-CI-2025-202', chamberName: 'Chambre des Notaires de Côte d\'Ivoire', specialty: 'succession', certificationLevel: 'standard', country: 'CI', zone: 'Abidjan', available: true, rating: 4.5, missions: 29, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-ci-202.pdf', certified: true, certifiedDaysAgo: 140 },
  { userEmail: 'jean.kouame@notaire.afribayit.com', licenseNumber: 'NOT-CI-2025-203', chamberName: 'Chambre des Notaires de Côte d\'Ivoire', specialty: 'baux', certificationLevel: 'standard', country: 'CI', zone: 'Yamoussoukro et centre', available: true, rating: 4.3, missions: 21, subscriptionTier: 'essentiel', conventionSigned: true, certified: true, certifiedDaysAgo: 110 },
  // ── Togo ──
  { userEmail: 'kossi.olympio@notaire.afribayit.com', licenseNumber: 'NOT-TG-2025-301', chamberName: 'Chambre des Notaires du Togo', specialty: 'droit_foncier', certificationLevel: 'expert', country: 'TG', zone: 'Lomé et Maritime', available: true, rating: 4.7, missions: 44, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-tg-301.pdf', certified: true, certifiedDaysAgo: 170 },
  { userEmail: 'akouwa.gnassingbe@notaire.afribayit.com', licenseNumber: 'NOT-TG-2025-302', chamberName: 'Chambre des Notaires du Togo', specialty: 'succession', certificationLevel: 'standard', country: 'TG', zone: 'Lomé', available: true, rating: 4.4, missions: 23, subscriptionTier: 'essentiel', conventionSigned: true, certified: true, certifiedDaysAgo: 100 },
  { userEmail: 'emmanuel.bodjona@notaire.afribayit.com', licenseNumber: 'NOT-TG-2025-303', chamberName: 'Chambre des Notaires du Togo', specialty: 'baux', certificationLevel: 'standard', country: 'TG', zone: 'Kara et Nord-Togo', available: true, rating: 4.2, missions: 16, subscriptionTier: 'gratuit', conventionSigned: false, certified: true, certifiedDaysAgo: 80 },
  // ── Burkina Faso ──
  { userEmail: 'mariam.ouedraogo@notaire.afribayit.com', licenseNumber: 'NOT-BF-2025-401', chamberName: 'Chambre des Notaires du Burkina Faso', specialty: 'droit_foncier', certificationLevel: 'expert', country: 'BF', zone: 'Ouagadougou et Centre', available: true, rating: 4.6, missions: 36, subscriptionTier: 'pro', conventionSigned: true, conventionUrl: 'https://afribayit.com/conventions/notary-bf-401.pdf', certified: true, certifiedDaysAgo: 150 },
  { userEmail: 'soungalo.sawadogo@notaire.afribayit.com', licenseNumber: 'NOT-BF-2025-402', chamberName: 'Chambre des Notaires du Burkina Faso', specialty: 'societes', certificationLevel: 'standard', country: 'BF', zone: 'Bobo-Dioulasso et Ouest', available: true, rating: 4.3, missions: 19, subscriptionTier: 'essentiel', conventionSigned: true, certified: true, certifiedDaysAgo: 95 },
];

export const DIRECTORY_STATS = {
  artisans: DIRECTORY_ARTISANS.length,
  notaries: DIRECTORY_NOTARIES.length,
  countries: 4,
};
