// AfriBayit — Comprehensive Seed Script
// Populates the database with realistic test data for the AfriBayit platform

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helper ────────────────────────────────────────────────────────────────
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

// ─── Seed Data ─────────────────────────────────────────────────────────────

const USERS = [
  // ── Admins ──
  {
    email: 'admin@afribayit.com',
    phone: '+229 97 00 00 01',
    name: 'Aminata Dossou',
    firstName: 'Aminata',
    lastName: 'Dossou',
    role: 'admin',
    country: 'BJ',
    city: 'Cotonou',
    kycLevel: 3,
    score: 950,
    reputation: 'Ambassadeur',
    bio: 'Administratrice principale de la plateforme AfriBayit.',
    verified: true,
    premiumTier: 'elite',
    premiumExpiry: daysFromNow(365),
    walletBalance: 0,
    escrowHeld: 0,
    pendingPayout: 0,
    afriPoints: 5000,
    credibilityScore: 98,
    isOnline: true,
    lastSeenAt: now,
    preferredLanguage: 'fr',
    currency: 'XOF',
  },
  {
    email: 'admin2@afribayit.com',
    phone: '+225 07 00 00 02',
    name: 'Kouadio Yao',
    firstName: 'Kouadio',
    lastName: 'Yao',
    role: 'admin',
    country: 'CI',
    city: 'Abidjan',
    kycLevel: 3,
    score: 920,
    reputation: 'Ambassadeur',
    bio: 'Co-administrateur AfriBayit Côte d\'Ivoire.',
    verified: true,
    premiumTier: 'elite',
    premiumExpiry: daysFromNow(365),
    walletBalance: 0,
    afriPoints: 4500,
    credibilityScore: 95,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── Agents ──
  {
    email: 'agent.bj@afribayit.com',
    phone: '+229 97 00 00 10',
    name: 'Hervé Houénou',
    firstName: 'Hervé',
    lastName: 'Houénou',
    role: 'agent',
    country: 'BJ',
    city: 'Cotonou',
    kycLevel: 2,
    score: 780,
    reputation: 'Expert',
    bio: 'Agent immobilier certifié avec 8 ans d\'expérience à Cotonou et environs.',
    specialties: '["villa","terrain","appartement"]',
    verified: true,
    premiumTier: 'avance',
    premiumExpiry: daysFromNow(180),
    walletBalance: 250000,
    escrowHeld: 5000000,
    pendingPayout: 150000,
    afriPoints: 2800,
    credibilityScore: 88,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },
  {
    email: 'agent.ci@afribayit.com',
    phone: '+225 07 00 00 11',
    name: 'Fatou Koné',
    firstName: 'Fatou',
    lastName: 'Koné',
    role: 'agent',
    country: 'CI',
    city: 'Abidjan',
    kycLevel: 2,
    score: 720,
    reputation: 'Expert',
    bio: 'Agence immobilière Koné & Fils — spécialiste Cocody et Plateau.',
    specialties: '["appartement","villa","bureau"]',
    verified: true,
    premiumTier: 'avance',
    premiumExpiry: daysFromNow(120),
    walletBalance: 180000,
    escrowHeld: 3200000,
    pendingPayout: 90000,
    afriPoints: 2100,
    credibilityScore: 82,
    isOnline: false,
    lastSeenAt: daysAgo(1),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },
  {
    email: 'agent.tg@afribayit.com',
    phone: '+228 90 00 00 12',
    name: 'Kofi Mensah',
    firstName: 'Kofi',
    lastName: 'Mensah',
    role: 'agent',
    country: 'TG',
    city: 'Lomé',
    kycLevel: 2,
    score: 650,
    reputation: 'Acteur',
    bio: 'Agent immobilier Togolais, spécialiste des terrains et villas à Lomé.',
    specialties: '["terrain","villa"]',
    verified: true,
    premiumTier: 'essentiel',
    premiumExpiry: daysFromNow(90),
    walletBalance: 95000,
    escrowHeld: 1500000,
    pendingPayout: 45000,
    afriPoints: 1500,
    credibilityScore: 75,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── Buyers ──
  {
    email: 'buyer1@example.com',
    phone: '+229 97 00 00 20',
    name: 'Pierre Agossou',
    firstName: 'Pierre',
    lastName: 'Agossou',
    role: 'buyer',
    country: 'BJ',
    city: 'Cotonou',
    kycLevel: 1,
    score: 320,
    reputation: 'Acteur',
    bio: 'Investisseur cherchant des opportunités immobilières au Bénin.',
    verified: true,
    walletBalance: 5000000,
    afriPoints: 600,
    credibilityScore: 55,
    isOnline: false,
    lastSeenAt: daysAgo(2),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },
  {
    email: 'buyer2@example.com',
    phone: '+225 07 00 00 21',
    name: 'Marie Bamba',
    firstName: 'Marie',
    lastName: 'Bamba',
    role: 'buyer',
    country: 'CI',
    city: 'Abidjan',
    kycLevel: 1,
    score: 180,
    reputation: 'Decouvreur',
    bio: 'Première acquisition immobilière — recherche appartement Cocody.',
    verified: false,
    walletBalance: 2000000,
    afriPoints: 200,
    credibilityScore: 30,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── Artisan ──
  {
    email: 'artisan1@afribayit.com',
    phone: '+229 97 00 00 30',
    name: 'Issifou Saka',
    firstName: 'Issifou',
    lastName: 'Saka',
    role: 'artisan',
    country: 'BJ',
    city: 'Cotonou',
    kycLevel: 2,
    score: 450,
    reputation: 'Acteur',
    bio: 'Maçon qualifié avec 12 ans d\'expérience en construction moderne.',
    specialties: '["maçonnerie","dallage","fondation"]',
    verified: true,
    premiumTier: 'starter',
    walletBalance: 75000,
    afriPoints: 800,
    credibilityScore: 65,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── Geometer ──
  {
    email: 'geometer1@afribayit.com',
    phone: '+229 97 00 00 40',
    name: 'Rachidou Bello',
    firstName: 'Rachidou',
    lastName: 'Bello',
    role: 'geometer',
    country: 'BJ',
    city: 'Cotonou',
    kycLevel: 3,
    score: 680,
    reputation: 'Expert',
    bio: 'Géomètre expert certifié — topographie, bornage, certification foncière.',
    specialties: '["GEO_SURF","GEO_INSP","GEO_BORN","GEO_TOPO","GEO_CERT"]',
    verified: true,
    premiumTier: 'essentiel',
    premiumExpiry: daysFromNow(200),
    walletBalance: 320000,
    afriPoints: 1800,
    credibilityScore: 85,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── Notary ──
  {
    email: 'notaire1@afribayit.com',
    phone: '+229 97 00 00 50',
    name: 'Me Florent Agboka',
    firstName: 'Florent',
    lastName: 'Agboka',
    role: 'notary',
    country: 'BJ',
    city: 'Cotonou',
    kycLevel: 3,
    score: 850,
    reputation: 'Ambassadeur',
    bio: 'Notaire de profession — spécialiste droit foncier et successions au Bénin.',
    verified: true,
    premiumTier: 'avance',
    premiumExpiry: daysFromNow(300),
    walletBalance: 150000,
    afriPoints: 2200,
    credibilityScore: 92,
    isOnline: false,
    lastSeenAt: daysAgo(1),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── BF Agent ──
  {
    email: 'ousmane.ouedraogo@afribayit.bf',
    phone: '+226 70 00 00 10',
    name: 'Ousmane Ouédraogo',
    firstName: 'Ousmane',
    lastName: 'Ouédraogo',
    role: 'agent',
    country: 'BF',
    city: 'Ouagadougou',
    kycLevel: 2,
    score: 620,
    reputation: 'Acteur',
    bio: 'Agent immobilier à Ouagadougou, spécialiste des villas et terrains.',
    specialties: '["villa","terrain","appartement"]',
    verified: true,
    premiumTier: 'essentiel',
    premiumExpiry: daysFromNow(90),
    walletBalance: 120000,
    escrowHeld: 800000,
    pendingPayout: 30000,
    afriPoints: 1200,
    credibilityScore: 70,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── BF Buyer ──
  {
    email: 'aline.kabore@afribayit.bf',
    phone: '+226 70 00 00 20',
    name: 'Aline Kaboré',
    firstName: 'Aline',
    lastName: 'Kaboré',
    role: 'buyer',
    country: 'BF',
    city: 'Ouagadougou',
    kycLevel: 1,
    score: 200,
    reputation: 'Decouvreur',
    bio: 'Investisseuse cherchant des opportunités immobilières à Ouagadougou.',
    verified: true,
    walletBalance: 3000000,
    afriPoints: 300,
    credibilityScore: 40,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── BF Artisan ──
  {
    email: 'moussa.sawadogo@afribayit.bf',
    phone: '+226 70 00 00 30',
    name: 'Moussa Sawadogo',
    firstName: 'Moussa',
    lastName: 'Sawadogo',
    role: 'artisan',
    country: 'BF',
    city: 'Ouagadougou',
    kycLevel: 2,
    score: 380,
    reputation: 'Acteur',
    bio: 'Maçon qualifié avec 10 ans d\'expérience en construction à Ouagadougou.',
    specialties: '["maçonnerie","dallage","fondation"]',
    verified: true,
    premiumTier: 'starter',
    walletBalance: 60000,
    afriPoints: 600,
    credibilityScore: 58,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── BF Geometer ──
  {
    email: 'pascal.zoungrana@afribayit.bf',
    phone: '+226 70 00 00 40',
    name: 'Pascal Zoungrana',
    firstName: 'Pascal',
    lastName: 'Zoungrana',
    role: 'geometer',
    country: 'BF',
    city: 'Ouagadougou',
    kycLevel: 3,
    score: 590,
    reputation: 'Expert',
    bio: 'Géomètre expert certifié — topographie, bornage, certification foncière au Burkina Faso.',
    specialties: '["GEO_SURF","GEO_INSP","GEO_BORN","GEO_TOPO","GEO_CERT"]',
    verified: true,
    premiumTier: 'essentiel',
    premiumExpiry: daysFromNow(180),
    walletBalance: 250000,
    afriPoints: 1400,
    credibilityScore: 80,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── BF Notary ──
  {
    email: 'mariam.ouedraogo@afribayit.bf',
    phone: '+226 70 00 00 50',
    name: 'Mariam Ouedraogo',
    firstName: 'Mariam',
    lastName: 'Ouedraogo',
    role: 'notary',
    country: 'BF',
    city: 'Ouagadougou',
    kycLevel: 3,
    score: 720,
    reputation: 'Expert',
    bio: 'Notaire de profession — spécialiste droit foncier et successions au Burkina Faso.',
    verified: true,
    premiumTier: 'avance',
    premiumExpiry: daysFromNow(200),
    walletBalance: 120000,
    afriPoints: 1800,
    credibilityScore: 88,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── CI Notary ──
  {
    email: 'notaire.ci@afribayit.com',
    phone: '+225 07 00 00 50',
    name: 'Me Aimée Diallo',
    firstName: 'Aimée',
    lastName: 'Diallo',
    role: 'notary',
    country: 'CI',
    city: 'Abidjan',
    kycLevel: 3,
    score: 780,
    reputation: 'Expert',
    bio: 'Notaire — spécialiste droit foncier et transactions immobilières en Côte d\'Ivoire.',
    verified: true,
    premiumTier: 'avance',
    premiumExpiry: daysFromNow(250),
    walletBalance: 200000,
    afriPoints: 2000,
    credibilityScore: 90,
    isOnline: true,
    lastSeenAt: daysAgo(0),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },

  // ── TG Notary ──
  {
    email: 'notaire.tg@afribayit.com',
    phone: '+228 90 00 00 50',
    name: 'Me Kodjo Agbéko',
    firstName: 'Kodjo',
    lastName: 'Agbéko',
    role: 'notary',
    country: 'TG',
    city: 'Lomé',
    kycLevel: 3,
    score: 680,
    reputation: 'Acteur',
    bio: 'Notaire — spécialiste droit foncier au Togo. Expérience en transactions immobilières.',
    verified: true,
    premiumTier: 'essentiel',
    premiumExpiry: daysFromNow(150),
    walletBalance: 100000,
    afriPoints: 1200,
    credibilityScore: 78,
    isOnline: false,
    lastSeenAt: daysAgo(1),
    preferredLanguage: 'fr',
    currency: 'XOF',
  },
];

async function main() {
  console.log('🌱 Seeding AfriBayit database...\n');

  // ═══════════════════════════════════════════════════════════════════════
  // 1. USERS (upsert)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('→ Creating users...');
  const userIds: Record<string, string> = {};

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
    // Derive a key from role: admin1, admin2, agent_bj, agent_ci, agent_tg, buyer1, buyer2, artisan1, geometer1, notary1
    const key = u.email.split('@')[0].replace('.', '_');
    userIds[key] = user.id;
    console.log(`  ✓ ${u.name} (${u.role}) → ${user.id}`);
  }

  // Shortcuts
  const admin1 = userIds['admin'];
  const admin2 = userIds['admin2'];
  const agentBJ = userIds['agent_bj'];
  const agentCI = userIds['agent_ci'];
  const agentTG = userIds['agent_tg'];
  const buyer1 = userIds['buyer1'];
  const buyer2 = userIds['buyer2'];
  const artisanUser = userIds['artisan1'];
  const geometerUser = userIds['geometer1'];
  const notaryUser = userIds['notaire1'];
  // BF shortcuts
  const agentBF = userIds['ousmane_ouedraogo'];
  const buyerBF = userIds['aline_kabore'];
  const artisanBFUser = userIds['moussa_sawadogo'];
  const geometerBFUser = userIds['pascal_zoungrana'];
  const notaryBFUser = userIds['mariam_ouedraogo'];
  // CI/TG notary shortcuts
  const notaryCIUser = userIds['notaire_ci'];
  const notaryTGUser = userIds['notaire_tg'];

  // ═══════════════════════════════════════════════════════════════════════
  // 2. NOTARIES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating notaries...');

  const notary1 = await prisma.notary.create({
    data: {
      userId: notaryUser,
      licenseNumber: 'NOT-BJ-2024-001',
      chamberName: 'Chambre Nationale des Notaires du Bénin',
      specialty: 'droit_foncier',
      certificationLevel: 'expert',
      zone: 'Cotonou et environs',
      available: true,
      rating: 4.8,
      missions: 45,
      subscriptionTier: 'pro',
      subscriptionExpiry: daysFromNow(300),
      conventionSigned: true,
      conventionUrl: 'https://afribayit.com/conventions/notary-bj-001.pdf',
      country: 'BJ',
      certified: true,
      certifiedAt: daysAgo(180),
    },
  });
  console.log(`  ✓ Notary: ${notary1.licenseNumber}`);

  const notary2 = await prisma.notary.create({
    data: {
      userId: admin1, // reuse admin as second notary user reference
      licenseNumber: 'NOT-BJ-2024-002',
      chamberName: 'Chambre Nationale des Notaires du Bénin',
      specialty: 'succession',
      certificationLevel: 'standard',
      zone: 'Porto-Novo',
      available: true,
      rating: 4.2,
      missions: 22,
      country: 'BJ',
      subscriptionTier: 'gratuit',
      conventionSigned: false,
      certified: false,
    },
  });
  console.log(`  ✓ Notary: ${notary2.licenseNumber}`);

  // ── BF Notary ──
  const notaryBF = await prisma.notary.create({
    data: {
      userId: notaryBFUser,
      licenseNumber: 'NOT-BF-2024-001',
      chamberName: 'Ordre des Notaires du Burkina Faso',
      specialty: 'droit_foncier',
      certificationLevel: 'expert',
      zone: 'Ouagadougou et Centre',
      available: true,
      rating: 4.5,
      missions: 30,
      subscriptionTier: 'pro',
      subscriptionExpiry: daysFromNow(200),
      conventionSigned: true,
      conventionUrl: 'https://afribayit.com/conventions/notary-bf-001.pdf',
      country: 'BF',
      certified: true,
      certifiedAt: daysAgo(120),
    },
  });
  console.log(`  ✓ Notary: ${notaryBF.licenseNumber}`);

  // ── CI Notary ──
  const notaryCI = await prisma.notary.create({
    data: {
      userId: notaryCIUser,
      licenseNumber: 'NOT-CI-2024-001',
      chamberName: 'Chambre des Notaires de Côte d\'Ivoire',
      specialty: 'droit_foncier',
      certificationLevel: 'expert',
      zone: 'Abidjan et environs',
      available: true,
      rating: 4.6,
      missions: 38,
      subscriptionTier: 'pro',
      subscriptionExpiry: daysFromNow(250),
      conventionSigned: true,
      conventionUrl: 'https://afribayit.com/conventions/notary-ci-001.pdf',
      country: 'CI',
      certified: true,
      certifiedAt: daysAgo(150),
    },
  });
  console.log(`  ✓ Notary: ${notaryCI.licenseNumber}`);

  // ── TG Notary ──
  const notaryTG = await prisma.notary.create({
    data: {
      userId: notaryTGUser,
      licenseNumber: 'NOT-TG-2024-001',
      chamberName: 'Ordre des Notaires du Togo',
      specialty: 'droit_foncier',
      certificationLevel: 'standard',
      zone: 'Lomé et Maritime',
      available: true,
      rating: 4.0,
      missions: 18,
      subscriptionTier: 'essentiel',
      subscriptionExpiry: daysFromNow(150),
      conventionSigned: true,
      conventionUrl: 'https://afribayit.com/conventions/notary-tg-001.pdf',
      country: 'TG',
      certified: true,
      certifiedAt: daysAgo(90),
    },
  });
  console.log(`  ✓ Notary: ${notaryTG.licenseNumber}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 3. GEOMETERS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating geometers...');

  const geometer1 = await prisma.geometer.create({
    data: {
      id: geometerUser, // Must match userId for GeometerMission FK compatibility
      userId: geometerUser,
      licenseNumber: 'GEO-BJ-2024-001',
      specialities: '["GEO_SURF","GEO_INSP","GEO_BORN","GEO_TOPO","GEO_CERT"]',
      certificationLevel: 'expert',
      zone: 'Sud-Bénin',
      city: 'Cotonou',
      country: 'BJ',
      available: true,
      rating: 4.7,
      missions: 67,
      lat: 6.3703,
      lng: 2.3912,
      subscriptionTier: 'pro',
      certified: true,
      certifiedAt: daysAgo(200),
    },
  });
  console.log(`  ✓ Geometer: ${geometer1.licenseNumber}`);

  const geometer2 = await prisma.geometer.create({
    data: {
      id: admin2, // Must match userId for GeometerMission FK compatibility
      userId: admin2,
      licenseNumber: 'GEO-CI-2024-002',
      specialities: '["GEO_GPS","GEO_SURF","GEO_DRON","GEO_3D"]',
      certificationLevel: 'elite',
      zone: 'Abidjan et périphérie',
      city: 'Abidjan',
      country: 'CI',
      available: true,
      rating: 4.9,
      missions: 102,
      lat: 5.3600,
      lng: -4.0083,
      subscriptionTier: 'pro',
      certified: true,
      certifiedAt: daysAgo(300),
    },
  });
  console.log(`  ✓ Geometer: ${geometer2.licenseNumber}`);

  const geometer3 = await prisma.geometer.create({
    data: {
      id: agentTG, // Must match userId for GeometerMission FK compatibility
      userId: agentTG,
      licenseNumber: 'GEO-TG-2024-003',
      specialities: '["GEO_BORN","GEO_GPS","GEO_CERT"]',
      certificationLevel: 'standard',
      zone: 'Maritime Togo',
      city: 'Lomé',
      country: 'TG',
      available: true,
      rating: 4.1,
      missions: 28,
      lat: 6.1319,
      lng: 1.2228,
      subscriptionTier: 'gratuit',
      certified: false,
    },
  });
  console.log(`  ✓ Geometer: ${geometer3.licenseNumber}`);

  // ── BF Geometer ──
  const geometerBF = await prisma.geometer.create({
    data: {
      id: geometerBFUser, // Must match userId for GeometerMission FK compatibility
      userId: geometerBFUser,
      licenseNumber: 'GEO-BF-2024-004',
      specialities: '["GEO_SURF","GEO_INSP","GEO_BORN","GEO_TOPO","GEO_CERT"]',
      certificationLevel: 'expert',
      zone: 'Ouagadougou et Centre',
      city: 'Ouagadougou',
      country: 'BF',
      available: true,
      rating: 4.4,
      missions: 35,
      lat: 12.3714,
      lng: -1.5197,
      subscriptionTier: 'pro',
      certified: true,
      certifiedAt: daysAgo(120),
    },
  });
  console.log(`  ✓ Geometer: ${geometerBF.licenseNumber}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. ARTISANS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating artisans...');

  const artisanData = [
    {
      userKey: artisanUser,
      trade: 'Maçon',
      specialties: '["maçonnerie","dallage","fondation","hourdis"]',
      certified: true,
      kybValid: true,
      available: true,
      emergency: true,
      priceRange: '15000-35000',
      dailyRate: 25000,
      rating: 4.5,
      reviews: 18,
      zone: 'Cotonou',
      city: 'Cotonou',
      country: 'BJ',
      subscriptionTier: 'pro',
      responseTime: 30,
      completedMissions: 45,
    },
    {
      userKey: buyer1, // reuse buyer as artisan
      trade: 'Électricien',
      specialties: '["installation électrique","dépannage","domotique"]',
      certified: true,
      kybValid: false,
      available: true,
      emergency: true,
      priceRange: '10000-30000',
      dailyRate: 20000,
      rating: 4.3,
      reviews: 12,
      zone: 'Cotonou',
      city: 'Cotonou',
      country: 'BJ',
      subscriptionTier: 'gratuit',
      responseTime: 45,
      completedMissions: 32,
    },
    {
      userKey: buyer2, // reuse buyer as artisan
      trade: 'Plombier',
      specialties: '["plomberie","sanitaire","chauffe-eau"]',
      certified: false,
      kybValid: false,
      available: true,
      emergency: false,
      priceRange: '8000-25000',
      dailyRate: 18000,
      rating: 4.0,
      reviews: 8,
      zone: 'Abidjan',
      city: 'Abidjan',
      country: 'CI',
      subscriptionTier: 'gratuit',
      responseTime: 60,
      completedMissions: 19,
    },
    {
      userKey: agentTG, // reuse as artisan
      trade: 'Carreleur',
      specialties: '["carrelage","faïence","mosaïque"]',
      certified: true,
      kybValid: true,
      available: true,
      emergency: false,
      priceRange: '12000-40000',
      dailyRate: 22000,
      rating: 4.6,
      reviews: 22,
      zone: 'Lomé',
      city: 'Lomé',
      country: 'TG',
      subscriptionTier: 'pro',
      responseTime: 25,
      completedMissions: 38,
    },
    {
      userKey: admin2, // reuse as artisan
      trade: 'Peintre',
      specialties: '["peinture intérieure","peinture extérieure","décoration"]',
      certified: false,
      kybValid: false,
      available: true,
      emergency: false,
      priceRange: '8000-20000',
      dailyRate: 15000,
      rating: 3.8,
      reviews: 5,
      zone: 'Cotonou',
      city: 'Cotonou',
      country: 'BJ',
      subscriptionTier: 'gratuit',
      responseTime: 90,
      completedMissions: 12,
    },
    // ── BF Artisan ──
    {
      userKey: artisanBFUser,
      trade: 'Maçon',
      specialties: '["maçonnerie","dallage","fondation","hourdis"]',
      certified: true,
      kybValid: true,
      available: true,
      emergency: true,
      priceRange: '12000-30000',
      dailyRate: 20000,
      rating: 4.2,
      reviews: 10,
      zone: 'Ouagadougou',
      city: 'Ouagadougou',
      country: 'BF',
      subscriptionTier: 'pro',
      responseTime: 35,
      completedMissions: 28,
    },
  ];

  const artisanIds: string[] = [];
  for (const ad of artisanData) {
    const artisan = await prisma.artisan.create({
      data: {
        userId: ad.userKey,
        trade: ad.trade,
        specialties: ad.specialties,
        certified: ad.certified,
        kybValid: ad.kybValid,
        available: ad.available,
        emergency: ad.emergency,
        priceRange: ad.priceRange,
        dailyRate: ad.dailyRate,
        rating: ad.rating,
        reviews: ad.reviews,
        zone: ad.zone,
        city: ad.city,
        country: ad.country,
        subscriptionTier: ad.subscriptionTier,
        responseTime: ad.responseTime,
        completedMissions: ad.completedMissions,
        portfolio: '["https://afribayit.com/portfolio/sample1.jpg","https://afribayit.com/portfolio/sample2.jpg"]',
      },
    });
    artisanIds.push(artisan.id);
    console.log(`  ✓ Artisan: ${ad.trade} → ${artisan.id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating properties...');

  const propertyDefs = [
    // ── Cotonou (BJ) — Agent BJ ──
    {
      title: 'Villa Moderne Fidjrossè',
      slug: 'villa-moderne-fidjrosse-cotonou',
      type: 'villa',
      transaction: 'achat',
      price: 75000000,
      surface: 350,
      rooms: 7,
      bedrooms: 4,
      bathrooms: 3,
      city: 'Cotonou',
      country: 'BJ',
      quartier: 'Fidjrossè',
      address: 'Lot 45, Fidjrossè, Cotonou',
      description: 'Magnifique villa moderne avec vue sur la lagune, piscine, jardin paysager. Finitions haut de gamme, cuisine équipée, climatisation centralisée.',
      features: '["piscine","jardin","garage","climatisation","vue lagune"]',
      images: '["https://afribayit.com/img/prop/villa-fidjrosse-1.jpg","https://afribayit.com/img/prop/villa-fidjrosse-2.jpg","https://afribayit.com/img/prop/villa-fidjrosse-3.jpg"]',
      lat: 6.3556,
      lng: 2.3917,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'expert',
      premium: true,
      status: 'published',
      views: 1240,
      favorites: 35,
      agentId: agentBJ,
      investmentScore: 82,
      walkScore: 78,
      hasVR: true,
      hasDroneView: true,
      publishedAt: daysAgo(30),
    },
    {
      title: 'Appartement T3 Haie Vive',
      slug: 'appartement-t3-haie-vive-cotonou',
      type: 'appartement',
      transaction: 'location',
      price: 350000,
      surface: 95,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      city: 'Cotonou',
      country: 'BJ',
      quartier: 'Haie Vive',
      address: 'Immeuble Les Palmiers, Haie Vive',
      description: 'Appartement T3 lumineux au 2ème étage avec balcon. Proche du centre-ville et des commodités.',
      features: '["balcon","parking","gardien","eau courante"]',
      images: '["https://afribayit.com/img/prop/apt-haievive-1.jpg","https://afribayit.com/img/prop/apt-haievive-2.jpg"]',
      lat: 6.3680,
      lng: 2.3847,
      verified: true,
      geoTrust: false,
      premium: false,
      status: 'published',
      views: 890,
      favorites: 18,
      agentId: agentBJ,
      investmentScore: 65,
      walkScore: 85,
      hasVR: false,
      hasDroneView: false,
      publishedAt: daysAgo(15),
    },
    {
      title: 'Terrain 1000m² Akpakpa',
      slug: 'terrain-1000m2-akpakpa-cotonou',
      type: 'terrain',
      transaction: 'achat',
      price: 25000000,
      surface: 1000,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      city: 'Cotonou',
      country: 'BJ',
      quartier: 'Akpakpa',
      address: 'Parcelle B12, Akpakpa Dodomè',
      description: 'Terrain viabilisé de 1000m² avec titre foncier. Zone en plein développement, idéal investissement.',
      features: '["viabilisé","titre foncier","clôturé"]',
      images: '["https://afribayit.com/img/prop/terrain-akpakpa-1.jpg"]',
      lat: 6.3500,
      lng: 2.4200,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'standard',
      premium: false,
      status: 'published',
      views: 560,
      favorites: 22,
      agentId: agentBJ,
      investmentScore: 90,
      walkScore: 45,
      publishedAt: daysAgo(45),
    },
    {
      title: 'Villa 4 Chambres Cadjèhoun',
      slug: 'villa-4-chambres-cadjehoun-cotonou',
      type: 'villa',
      transaction: 'achat',
      price: 55000000,
      surface: 280,
      rooms: 6,
      bedrooms: 4,
      bathrooms: 2,
      city: 'Cotonou',
      country: 'BJ',
      quartier: 'Cadjèhoun',
      address: 'Rue 520, Cadjèhoun',
      description: 'Belle villa familiale dans quartier résidentiel calme. Grand séjour, cuisine américaine, dépendance.',
      features: '["garage double","jardin","dépendance","forage"]',
      images: '["https://afribayit.com/img/prop/villa-cadjehoun-1.jpg","https://afribayit.com/img/prop/villa-cadjehoun-2.jpg"]',
      lat: 6.3650,
      lng: 2.3800,
      verified: false,
      geoTrust: false,
      premium: false,
      status: 'draft',
      views: 0,
      favorites: 0,
      agentId: agentBJ,
    },
    {
      title: 'Terrain 500m² Godomey',
      slug: 'terrain-500m2-godomey-cotonou',
      type: 'terrain',
      transaction: 'achat',
      price: 12000000,
      surface: 500,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      city: 'Cotonou',
      country: 'BJ',
      quartier: 'Godomey',
      address: 'Lot C7, Godomey Togbin',
      description: 'Terrain 500m² avec ACD, zone résidentielle en expansion. Accès goudron.',
      features: '["acd","accès goudron","proche école"]',
      images: '["https://afribayit.com/img/prop/terrain-godomey-1.jpg"]',
      lat: 6.3800,
      lng: 2.3500,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'standard',
      premium: false,
      status: 'sold',
      views: 780,
      favorites: 30,
      agentId: agentBJ,
      investmentScore: 75,
      walkScore: 55,
      publishedAt: daysAgo(120),
    },

    // ── Abidjan (CI) — Agent CI ──
    {
      title: 'Appartement Standing Cocody',
      slug: 'appartement-standing-cocody-abidjan',
      type: 'appartement',
      transaction: 'achat',
      price: 120000000,
      surface: 180,
      rooms: 5,
      bedrooms: 3,
      bathrooms: 2,
      city: 'Abidjan',
      country: 'CI',
      quartier: 'Cocody',
      address: 'Résidence Les Bougainvilliers, Cocody Riviera',
      description: 'Appartement haut standing en dernier étage avec vue panoramique. Finitions luxe, domotique, piscine collective.',
      features: '["piscine","gym","domotique","vue panoramique","parking souterrain"]',
      images: '["https://afribayit.com/img/prop/apt-cocody-1.jpg","https://afribayit.com/img/prop/apt-cocody-2.jpg","https://afribayit.com/img/prop/apt-cocody-3.jpg"]',
      lat: 5.3500,
      lng: -3.9500,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'elite',
      premium: true,
      status: 'published',
      views: 2100,
      favorites: 52,
      agentId: agentCI,
      investmentScore: 88,
      walkScore: 80,
      hasVR: true,
      hasDroneView: true,
      publishedAt: daysAgo(20),
    },
    {
      title: 'Villa Prestige Plateau',
      slug: 'villa-prestige-plateau-abidjan',
      type: 'villa',
      transaction: 'achat',
      price: 200000000,
      surface: 500,
      rooms: 8,
      bedrooms: 5,
      bathrooms: 4,
      city: 'Abidjan',
      country: 'CI',
      quartier: 'Plateau',
      address: 'Boulevard de France, Plateau',
      description: 'Villa de prestige au cœur du Plateau. Architecture contemporaine, jardin tropical, piscine à débordement.',
      features: '["piscine","jardin tropical","garage 3 voitures","sécurité 24/7","climatisation"]',
      images: '["https://afribayit.com/img/prop/villa-plateau-1.jpg","https://afribayit.com/img/prop/villa-plateau-2.jpg"]',
      lat: 5.3200,
      lng: -4.0200,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'elite',
      premium: true,
      status: 'published',
      views: 3500,
      favorites: 89,
      agentId: agentCI,
      investmentScore: 95,
      walkScore: 92,
      hasVR: true,
      hasDroneView: true,
      publishedAt: daysAgo(10),
    },
    {
      title: 'Bureau Open Space Marcory',
      slug: 'bureau-open-space-marcory-abidjan',
      type: 'bureau',
      transaction: 'location',
      price: 800000,
      surface: 200,
      rooms: 4,
      bedrooms: 0,
      bathrooms: 2,
      city: 'Abidjan',
      country: 'CI',
      quartier: 'Marcory',
      address: 'Zone 4, Marcory',
      description: 'Bureau open space lumineux avec salle de réunion, cuisine partagée. Idéal startup ou PME.',
      features: '["fibre optique","climatisation","salle réunion","cuisine","parking"]',
      images: '["https://afribayit.com/img/prop/bureau-marcory-1.jpg"]',
      lat: 5.2900,
      lng: -3.9800,
      verified: true,
      geoTrust: false,
      premium: false,
      status: 'published',
      views: 430,
      favorites: 8,
      agentId: agentCI,
      investmentScore: 60,
      walkScore: 75,
      publishedAt: daysAgo(25),
    },
    {
      title: 'Terrain 2000m² Bingerville',
      slug: 'terrain-2000m2-bingerville-abidjan',
      type: 'terrain',
      transaction: 'investissement',
      price: 35000000,
      surface: 2000,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      city: 'Abidjan',
      country: 'CI',
      quartier: 'Bingerville',
      address: 'Route de Bingerville, PK 18',
      description: 'Grand terrain de 2000m² avec titre foncier. Zone résidentielle en développement rapide.',
      features: '["titre foncier","viabilisé","accès goudron","proche futur hôpital"]',
      images: '["https://afribayit.com/img/prop/terrain-bingerville-1.jpg"]',
      lat: 5.3500,
      lng: -3.8800,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'standard',
      premium: false,
      status: 'published',
      views: 670,
      favorites: 28,
      agentId: agentCI,
      investmentScore: 85,
      walkScore: 35,
      publishedAt: daysAgo(60),
    },
    {
      title: 'Commerce Yopougon',
      slug: 'commerce-yopougon-abidjan',
      type: 'commerce',
      transaction: 'location',
      price: 500000,
      surface: 120,
      rooms: 2,
      bedrooms: 0,
      bathrooms: 1,
      city: 'Abidjan',
      country: 'CI',
      quartier: 'Yopougon',
      address: 'Marché de Yopougon, Avenue Delafosse',
      description: 'Local commercial bien situé avec vitrine, idéal restaurant ou boutique.',
      features: '["vitrine","réserve","cour intérieure","accès livraison"]',
      images: '["https://afribayit.com/img/prop/commerce-yopougon-1.jpg"]',
      lat: 5.3300,
      lng: -4.0800,
      verified: false,
      geoTrust: false,
      premium: false,
      status: 'draft',
      views: 0,
      favorites: 0,
      agentId: agentCI,
    },

    // ── Lomé (TG) — Agent TG ──
    {
      title: 'Villa Bord de Mer Lomé',
      slug: 'villa-bord-de-mer-lome',
      type: 'villa',
      transaction: 'achat',
      price: 90000000,
      surface: 400,
      rooms: 7,
      bedrooms: 5,
      bathrooms: 3,
      city: 'Lomé',
      country: 'TG',
      quartier: 'Aflao Gakli',
      address: 'Boulevard du Mono, Aflao Gakli',
      description: 'Villa pieds dans l\'eau avec vue sur l\'océan Atlantique. Piscine, terrasse bois, jardin exotique.',
      features: '["piscine","vue mer","terrasse","jardin","garage"]',
      images: '["https://afribayit.com/img/prop/villa-lome-mer-1.jpg","https://afribayit.com/img/prop/villa-lome-mer-2.jpg"]',
      lat: 6.1250,
      lng: 1.2300,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'expert',
      premium: true,
      status: 'published',
      views: 1800,
      favorites: 65,
      agentId: agentTG,
      investmentScore: 91,
      walkScore: 70,
      hasVR: true,
      hasDroneView: false,
      publishedAt: daysAgo(18),
    },
    {
      title: 'Appartement T2 Tokoin',
      slug: 'appartement-t2-tokoin-lome',
      type: 'appartement',
      transaction: 'location_courte_duree',
      price: 250000,
      surface: 65,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      city: 'Lomé',
      country: 'TG',
      quartier: 'Tokoin',
      address: 'Rue du Commerce, Tokoin Wuiti',
      description: 'Appartement meublé idéal pour séjour court. Climatisation, WiFi, cuisine équipée.',
      features: '["meublé","climatisation","wifi","cuisine équipée"]',
      images: '["https://afribayit.com/img/prop/apt-tokoin-1.jpg"]',
      lat: 6.1378,
      lng: 1.2155,
      verified: true,
      geoTrust: false,
      premium: false,
      status: 'published',
      views: 340,
      favorites: 12,
      agentId: agentTG,
      investmentScore: 55,
      walkScore: 82,
      publishedAt: daysAgo(5),
    },
    {
      title: 'Terrain 800m² Kpogan',
      slug: 'terrain-800m2-kpogan-lome',
      type: 'terrain',
      transaction: 'achat',
      price: 18000000,
      surface: 800,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      city: 'Lomé',
      country: 'TG',
      quartier: 'Kpogan',
      address: 'Route de Kpogan, Lomé',
      description: 'Terrain plat de 800m² avec acte notarié. Quartier calme, proche du centre-ville.',
      features: '["acte notarié","terrain plat","proche centre"]',
      images: '["https://afribayit.com/img/prop/terrain-kpogan-1.jpg"]',
      lat: 6.1500,
      lng: 1.2500,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'standard',
      premium: false,
      status: 'published',
      views: 290,
      favorites: 14,
      agentId: agentTG,
      investmentScore: 72,
      walkScore: 60,
      publishedAt: daysAgo(35),
    },
    {
      title: 'Villa 3 Chambres Bè',
      slug: 'villa-3-chambres-be-lome',
      type: 'villa',
      transaction: 'location',
      price: 450000,
      surface: 200,
      rooms: 5,
      bedrooms: 3,
      bathrooms: 2,
      city: 'Lomé',
      country: 'TG',
      quartier: 'Bè',
      address: 'Quartier Bè Kpota, Lomé',
      description: 'Villa familiale avec jardin dans le quartier populaire de Bè. Idéal famille nombreuse.',
      features: '["jardin","garage","véranda","forage"]',
      images: '["https://afribayit.com/img/prop/villa-be-1.jpg"]',
      lat: 6.1550,
      lng: 1.2000,
      verified: false,
      geoTrust: false,
      premium: false,
      status: 'pending',
      views: 0,
      favorites: 0,
      agentId: agentTG,
    },
    {
      title: 'Appartement Studio Kodjoviakopé',
      slug: 'appartement-studio-kodjoviakope-lome',
      type: 'appartement',
      transaction: 'location',
      price: 150000,
      surface: 35,
      rooms: 1,
      bedrooms: 0,
      bathrooms: 1,
      city: 'Lomé',
      country: 'TG',
      quartier: 'Kodjoviakopé',
      address: 'Rue des Alliés, Kodjoviakopé',
      description: 'Studio meublé compact, idéal étudiant ou jeune professionnel.',
      features: '["meublé","climatisation","proche université"]',
      images: '["https://afribayit.com/img/prop/studio-kodjo-1.jpg"]',
      lat: 6.1300,
      lng: 1.2100,
      verified: true,
      geoTrust: false,
      premium: false,
      status: 'sold',
      views: 510,
      favorites: 8,
      agentId: agentTG,
      publishedAt: daysAgo(90),
    },

    // ── Ouagadougou (BF) — Agent BF ──
    {
      title: 'Villa F2 Ouaga 2000',
      slug: 'villa-f2-ouaga-2000-ouagadougou',
      type: 'villa',
      transaction: 'achat',
      price: 25000000,
      surface: 120,
      rooms: 3,
      bedrooms: 3,
      bathrooms: 2,
      city: 'Ouagadougou',
      country: 'BF',
      quartier: 'Ouaga 2000',
      address: 'Rue 28.15, Ouaga 2000',
      description: 'Villa F2 moderne dans le quartier résidentiel Ouaga 2000. Jardin, garage, finitions soignées.',
      features: '["jardin","garage","climatisation","forage"]',
      images: '["https://afribayit.com/img/prop/villa-ouaga2000-1.jpg","https://afribayit.com/img/prop/villa-ouaga2000-2.jpg"]',
      lat: 12.3518,
      lng: -1.4950,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'standard',
      premium: false,
      status: 'published',
      views: 320,
      favorites: 14,
      agentId: agentBF,
      investmentScore: 70,
      walkScore: 60,
      publishedAt: daysAgo(20),
    },
    {
      title: 'Terrain Koulouba',
      slug: 'terrain-koulouba-ouagadougou',
      type: 'terrain',
      transaction: 'achat',
      price: 15000000,
      surface: 500,
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      city: 'Ouagadougou',
      country: 'BF',
      quartier: 'Koulouba',
      address: 'Parcelle A8, Koulouba',
      description: 'Terrain viabilisé de 600m² avec titre foncier à Koulouba. Zone calme et résidentielle.',
      features: '["viabilisé","titre foncier","clôturé","accès goudron"]',
      images: '["https://afribayit.com/img/prop/terrain-koulouba-1.jpg"]',
      lat: 12.3600,
      lng: -1.5100,
      verified: true,
      geoTrust: true,
      geoTrustLevel: 'standard',
      premium: false,
      status: 'published',
      views: 180,
      favorites: 8,
      agentId: agentBF,
      investmentScore: 78,
      walkScore: 50,
      publishedAt: daysAgo(35),
    },
    {
      title: 'Appartement Zone Bois',
      slug: 'appartement-zone-bois-ouagadougou',
      type: 'appartement',
      transaction: 'location',
      price: 150000,
      surface: 85,
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      city: 'Ouagadougou',
      country: 'BF',
      quartier: 'Zone Bois',
      address: 'Immeuble Palmyre, Zone Bois',
      description: 'Appartement T2 climatisé dans la Zone Bois. Proche ambassades et commodités.',
      features: '["climatisation","parking","gardien","eau courante"]',
      images: '["https://afribayit.com/img/prop/apt-zonebois-1.jpg"]',
      lat: 12.3700,
      lng: -1.5200,
      verified: true,
      geoTrust: false,
      premium: false,
      status: 'published',
      views: 150,
      favorites: 6,
      agentId: agentBF,
      investmentScore: 55,
      walkScore: 70,
      publishedAt: daysAgo(10),
    },
    {
      title: 'Commerce Centre-Ville Ouaga',
      slug: 'commerce-centre-ville-ouagadougou',
      type: 'commerce',
      transaction: 'achat',
      price: 45000000,
      surface: 200,
      rooms: 2,
      bedrooms: 0,
      bathrooms: 1,
      city: 'Ouagadougou',
      country: 'BF',
      quartier: 'Centre-Ville',
      address: 'Avenue Kwame Nkrumah, Centre-Ville',
      description: 'Local commercial en plein centre-ville de Ouagadougou. Vitrine, réserve, haut potentiel.',
      features: '["vitrine","réserve","accès livraison","proche gare"]',
      images: '["https://afribayit.com/img/prop/commerce-ouaga-1.jpg"]',
      lat: 12.3728,
      lng: -1.5271,
      verified: false,
      geoTrust: false,
      premium: false,
      status: 'draft',
      views: 0,
      favorites: 0,
      agentId: agentBF,
    },
    {
      title: 'Bureau Ouaga 2000',
      slug: 'bureau-ouaga-2000-ouagadougou',
      type: 'bureau',
      transaction: 'location',
      price: 350000,
      surface: 150,
      rooms: 3,
      bedrooms: 0,
      bathrooms: 2,
      city: 'Ouagadougou',
      country: 'BF',
      quartier: 'Ouaga 2000',
      address: 'Immeuble Affaires, Ouaga 2000',
      description: 'Bureau moderne dans Ouaga 2000. Salle de réunion, fibre optique, climatisation.',
      features: '["fibre optique","climatisation","salle réunion","parking"]',
      images: '["https://afribayit.com/img/prop/bureau-ouaga-1.jpg"]',
      lat: 12.3500,
      lng: -1.4900,
      verified: true,
      geoTrust: false,
      premium: false,
      status: 'published',
      views: 90,
      favorites: 4,
      agentId: agentBF,
      investmentScore: 62,
      walkScore: 65,
      publishedAt: daysAgo(5),
    },
  ];

  const propertyIds: string[] = [];
  for (const pd of propertyDefs) {
    const property = await prisma.property.create({ data: pd });
    propertyIds.push(property.id);
  }
  console.log(`  ✓ Created ${propertyIds.length} properties`);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. TRANSACTIONS + ESCROW + LEDGER
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating transactions with escrow...');

  const txDefs = [
    {
      propertyId: propertyIds[0], // Villa Fidjrossè
      country: 'BJ',
      buyerId: buyer1,
      sellerId: agentBJ,
      amount: 75000000,
      commission: 2250000,
      status: 'FUNDED',
      escrowReference: 'ESC-2025-001',
      paymentProvider: 'mobile_money',
      paymentRef: 'MM-BJ-789012',
      notaryId: notary1.id,
      geometerId: geometer1.id,
      escrowFundedAt: daysAgo(7),
      notaryAssignedAt: daysAgo(5),
      commissionRate: 3.0,
      escrowStatus: 'FUNDED',
      escrowBalance: 75000000,
      escrowHeld: 75000000,
      escrowFundedAtDate: daysAgo(7),
      ledgerEntries: [
        { entryType: 'CREDIT', amount: 75000000, balanceAfter: 75000000, reference: 'FUND-001', providerRef: 'MM-BJ-789012' },
      ],
    },
    {
      propertyId: propertyIds[2], // Terrain Akpakpa
      country: 'BJ',
      buyerId: buyer2,
      sellerId: agentBJ,
      amount: 25000000,
      commission: 1000000,
      status: 'DEED_SIGNED',
      escrowReference: 'ESC-2025-002',
      paymentProvider: 'bank_transfer',
      paymentRef: 'BT-BJ-345678',
      notaryId: notary1.id,
      geometerId: geometer1.id,
      escrowFundedAt: daysAgo(30),
      notaryAssignedAt: daysAgo(25),
      deedSignedAt: daysAgo(5),
      commissionRate: 4.0,
      escrowStatus: 'FUNDED',
      escrowBalance: 25000000,
      escrowHeld: 25000000,
      escrowFundedAtDate: daysAgo(30),
      ledgerEntries: [
        { entryType: 'CREDIT', amount: 25000000, balanceAfter: 25000000, reference: 'FUND-002', providerRef: 'BT-BJ-345678' },
      ],
    },
    {
      propertyId: propertyIds[4], // Terrain Godomey (sold)
      country: 'BJ',
      buyerId: buyer1,
      sellerId: agentBJ,
      amount: 12000000,
      commission: 480000,
      status: 'RELEASED',
      escrowReference: 'ESC-2024-003',
      paymentProvider: 'mobile_money',
      paymentRef: 'MM-BJ-111222',
      notaryId: notary1.id,
      geometerId: geometer1.id,
      escrowFundedAt: daysAgo(120),
      notaryAssignedAt: daysAgo(110),
      deedSignedAt: daysAgo(90),
      escrowReleasedAt: daysAgo(85),
      commissionRate: 4.0,
      escrowStatus: 'FULL_RELEASE',
      escrowBalance: 0,
      escrowHeld: 0,
      escrowReleased: 11520000,
      escrowFundedAtDate: daysAgo(120),
      escrowReleasedAtDate: daysAgo(85),
      ledgerEntries: [
        { entryType: 'CREDIT', amount: 12000000, balanceAfter: 12000000, reference: 'FUND-003', providerRef: 'MM-BJ-111222' },
        { entryType: 'COMMISSION', amount: 480000, balanceAfter: 11520000, reference: 'COMM-003' },
        { entryType: 'RELEASE', amount: 11520000, balanceAfter: 0, reference: 'REL-003' },
      ],
    },
    {
      propertyId: propertyIds[5], // Appartement Cocody
      country: 'CI',
      buyerId: buyer1,
      sellerId: agentCI,
      amount: 120000000,
      commission: 3600000,
      status: 'NOTARY_ASSIGNED',
      escrowReference: 'ESC-2025-004',
      paymentProvider: 'bank_transfer',
      paymentRef: 'BT-CI-998877',
      notaryId: notary2.id,
      geometerId: geometer2.id,
      escrowFundedAt: daysAgo(3),
      notaryAssignedAt: daysAgo(1),
      commissionRate: 3.0,
      escrowStatus: 'FUNDED',
      escrowBalance: 120000000,
      escrowHeld: 120000000,
      escrowFundedAtDate: daysAgo(3),
      ledgerEntries: [
        { entryType: 'CREDIT', amount: 120000000, balanceAfter: 120000000, reference: 'FUND-004', providerRef: 'BT-CI-998877' },
      ],
    },
    {
      propertyId: propertyIds[10], // Villa Bord de Mer Lomé
      country: 'TG',
      buyerId: buyer2,
      sellerId: agentTG,
      amount: 90000000,
      commission: 1800000,
      status: 'CREATED',
      escrowReference: 'ESC-2025-005',
      commissionRate: 2.0,
      escrowStatus: 'EMPTY',
      escrowBalance: 0,
      escrowHeld: 0,
      ledgerEntries: [],
    },
    // ── BF Transactions (2) ──
    {
      propertyId: propertyIds[15], // Villa F2 Ouaga 2000
      country: 'BF',
      buyerId: buyerBF,
      sellerId: agentBF,
      amount: 25000000,
      commission: 750000,
      status: 'FUNDED',
      escrowReference: 'ESC-2025-006',
      paymentProvider: 'mobile_money',
      paymentRef: 'MM-BF-556677',
      notaryId: notaryBF.id,
      geometerId: geometerBF.id,
      escrowFundedAt: daysAgo(4),
      notaryAssignedAt: daysAgo(2),
      commissionRate: 3.0,
      escrowStatus: 'FUNDED',
      escrowBalance: 25000000,
      escrowHeld: 25000000,
      escrowFundedAtDate: daysAgo(4),
      ledgerEntries: [
        { entryType: 'CREDIT', amount: 25000000, balanceAfter: 25000000, reference: 'FUND-006', providerRef: 'MM-BF-556677' },
      ],
    },
    {
      propertyId: propertyIds[16], // Terrain Koulouba
      country: 'BF',
      buyerId: buyer1,
      sellerId: agentBF,
      amount: 15000000,
      commission: 600000,
      status: 'CREATED',
      escrowReference: 'ESC-2025-007',
      commissionRate: 4.0,
      escrowStatus: 'EMPTY',
      escrowBalance: 0,
      escrowHeld: 0,
      ledgerEntries: [],
    },
  ];

  for (const txd of txDefs) {
    const transaction = await prisma.transaction.create({
      data: {
        propertyId: txd.propertyId,
        buyerId: txd.buyerId,
        sellerId: txd.sellerId,
        amount: txd.amount,
        commission: txd.commission,
        currency: 'XOF',
        country: txd.country,
        status: txd.status,
        escrowReference: txd.escrowReference,
        paymentProvider: txd.paymentProvider,
        paymentRef: txd.paymentRef,
        notaryId: txd.notaryId,
        geometerId: txd.geometerId,
        escrowFundedAt: txd.escrowFundedAt,
        escrowReleasedAt: txd.escrowReleasedAt,
        notaryAssignedAt: txd.notaryAssignedAt,
        deedSignedAt: txd.deedSignedAt,
        commissionRate: txd.commissionRate,
      },
    });

    // Create escrow account
    const escrow = await prisma.escrowAccount.create({
      data: {
        transactionId: transaction.id,
        balance: txd.escrowBalance,
        heldAmount: txd.escrowHeld,
        releasedAmount: txd.escrowReleased ?? 0,
        currency: 'XOF',
        status: txd.escrowStatus,
        fundedAt: txd.escrowFundedAtDate,
        releasedAt: txd.escrowReleasedAtDate,
      },
    });

    // Create ledger entries
    for (const le of txd.ledgerEntries) {
      await prisma.escrowLedger.create({
        data: {
          escrowAccountId: escrow.id,
          entryType: le.entryType,
          amount: le.amount,
          balanceAfter: le.balanceAfter,
          currency: 'XOF',
          reference: le.reference,
          providerRef: le.providerRef,
        },
      });
    }

    // Create timeline events
    const timelineEvents: { from: string; to: string; desc: string }[] = [];
    if (txd.status === 'CREATED') {
      timelineEvents.push({ from: 'CREATED', to: 'CREATED', desc: 'Transaction créée, en attente de financement' });
    }
    if (txd.escrowFundedAt) {
      timelineEvents.push({ from: 'CREATED', to: 'FUNDED', desc: 'Fonds versés en escrow' });
    }
    if (txd.notoryAssignedAt) {
      timelineEvents.push({ from: 'FUNDED', to: 'NOTARY_ASSIGNED', desc: 'Notaire assigné à la transaction' });
    }
    if (txd.deedSignedAt) {
      timelineEvents.push({ from: 'NOTARY_ASSIGNED', to: 'DEED_SIGNED', desc: 'Acte signé par le notaire' });
    }
    if (txd.escrowReleasedAt) {
      timelineEvents.push({ from: 'DEED_SIGNED', to: 'RELEASED', desc: 'Fonds libérés au vendeur' });
    }

    for (const te of timelineEvents) {
      await prisma.transactionTimeline.create({
        data: {
          transactionId: transaction.id,
          fromStatus: te.from,
          toStatus: te.to,
          actorType: 'system',
          description: te.desc,
        },
      });
    }

    console.log(`  ✓ Transaction ${txd.escrowReference} (${txd.status})`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 7. HOTELS + ROOMS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating hotels...');

  const hotelDefs = [
    {
      name: 'Hôtel du Lac',
      slug: 'hotel-du-lac-cotonou',
      city: 'Cotonou',
      country: 'BJ',
      stars: 4,
      rating: 4.3,
      pricePerNight: 55000,
      amenities: '["piscine","restaurant","wifi","parking","salle conférence","spa"]',
      images: '["https://afribayit.com/img/hotel/lac-1.jpg","https://afribayit.com/img/hotel/lac-2.jpg"]',
      policies: '{"checkin":"14:00","checkout":"12:00","cancellation":"24h avant","pets":false}',
      available: true,
      connectionLevel: 2,
      lat: 6.3570,
      lng: 2.4100,
      status: 'active',
      subscriptionTier: 'pro',
      rooms: [
        { type: 'single', name: 'Chambre Standard', capacity: 1, basePriceXof: 45000, totalRooms: 20, amenities: '["wifi","climatisation","tv"]' },
        { type: 'double', name: 'Chambre Double', capacity: 2, basePriceXof: 55000, totalRooms: 30, amenities: '["wifi","climatisation","tv","minibar"]' },
        { type: 'suite', name: 'Suite Lac', capacity: 3, basePriceXof: 95000, totalRooms: 5, amenities: '["wifi","climatisation","tv","minibar","salon","vue lac"]' },
      ],
    },
    {
      name: 'Résidence Palm Beach',
      slug: 'residence-palm-beach-cotonou',
      city: 'Cotonou',
      country: 'BJ',
      stars: 3,
      rating: 3.8,
      pricePerNight: 35000,
      amenities: '["wifi","parking","restaurant","plage"]',
      images: '["https://afribayit.com/img/hotel/palmbeach-1.jpg"]',
      policies: '{"checkin":"14:00","checkout":"11:00","cancellation":"48h avant"}',
      available: true,
      connectionLevel: 1,
      lat: 6.3500,
      lng: 2.3950,
      status: 'active',
      subscriptionTier: 'starter',
      rooms: [
        { type: 'single', name: 'Chambre Économique', capacity: 1, basePriceXof: 25000, totalRooms: 15, amenities: '["wifi","climatisation"]' },
        { type: 'double', name: 'Chambre Confort', capacity: 2, basePriceXof: 35000, totalRooms: 20, amenities: '["wifi","climatisation","tv"]' },
      ],
    },
    {
      name: 'Hôtel Ivoire',
      slug: 'hotel-ivoire-abidjan',
      city: 'Abidjan',
      country: 'CI',
      stars: 5,
      rating: 4.7,
      pricePerNight: 120000,
      amenities: '["piscine","spa","gym","restaurant","wifi","parking","salle conférence","casino","helipad"]',
      images: '["https://afribayit.com/img/hotel/ivoire-1.jpg","https://afribayit.com/img/hotel/ivoire-2.jpg"]',
      policies: '{"checkin":"15:00","checkout":"12:00","cancellation":"48h avant","pets":true}',
      available: true,
      connectionLevel: 2,
      lat: 5.3400,
      lng: -4.0100,
      status: 'active',
      subscriptionTier: 'enterprise',
      rooms: [
        { type: 'deluxe', name: 'Chambre Deluxe', capacity: 2, basePriceXof: 120000, totalRooms: 40, amenities: '["wifi","climatisation","tv","minibar","coffrefort"]' },
        { type: 'suite', name: 'Suite Présidentielle', capacity: 4, basePriceXof: 350000, totalRooms: 3, amenities: '["wifi","climatisation","tv","minibar","salon","jacuzzi","vue panoramique"]' },
      ],
    },
    {
      name: 'Hôtel Onomo',
      slug: 'hotel-onomo-abidjan',
      city: 'Abidjan',
      country: 'CI',
      stars: 4,
      rating: 4.2,
      pricePerNight: 65000,
      amenities: '["piscine","restaurant","wifi","parking","gym"]',
      images: '["https://afribayit.com/img/hotel/onomo-1.jpg"]',
      policies: '{"checkin":"14:00","checkout":"12:00","cancellation":"24h avant"}',
      available: true,
      connectionLevel: 1,
      lat: 5.3100,
      lng: -3.9900,
      status: 'active',
      subscriptionTier: 'pro',
      rooms: [
        { type: 'single', name: 'Chambre Standard', capacity: 1, basePriceXof: 50000, totalRooms: 25, amenities: '["wifi","climatisation","tv"]' },
        { type: 'double', name: 'Chambre Supérieure', capacity: 2, basePriceXof: 65000, totalRooms: 35, amenities: '["wifi","climatisation","tv","minibar"]' },
        { type: 'family', name: 'Chambre Familiale', capacity: 4, basePriceXof: 95000, totalRooms: 10, amenities: '["wifi","climatisation","tv","minibar","coin salon"]' },
      ],
    },
    {
      name: 'Hôtel Sarakawa',
      slug: 'hotel-sarakawa-lome',
      city: 'Lomé',
      country: 'TG',
      stars: 4,
      rating: 4.1,
      pricePerNight: 50000,
      amenities: '["piscine","restaurant","wifi","parking","plage","tennis"]',
      images: '["https://afribayit.com/img/hotel/sarakawa-1.jpg"]',
      policies: '{"checkin":"14:00","checkout":"12:00","cancellation":"24h avant"}',
      available: true,
      connectionLevel: 2,
      lat: 6.1280,
      lng: 1.2350,
      status: 'active',
      subscriptionTier: 'pro',
      rooms: [
        { type: 'double', name: 'Chambre Vue Mer', capacity: 2, basePriceXof: 50000, totalRooms: 30, amenities: '["wifi","climatisation","tv","vue mer"]' },
        { type: 'suite', name: 'Suite Océane', capacity: 3, basePriceXof: 85000, totalRooms: 8, amenities: '["wifi","climatisation","tv","salon","vue mer","minibar"]' },
      ],
    },
    // ── BF Hotel ──
    {
      name: 'Hôtel Sily',
      slug: 'hotel-sily-ouagadougou',
      city: 'Ouagadougou',
      country: 'BF',
      stars: 3,
      rating: 3.9,
      pricePerNight: 35000,
      amenities: '["piscine","restaurant","wifi","parking","salle conférence"]',
      images: '["https://afribayit.com/img/hotel/sily-1.jpg"]',
      policies: '{"checkin":"14:00","checkout":"12:00","cancellation":"24h avant"}',
      available: true,
      connectionLevel: 1,
      lat: 12.3714,
      lng: -1.5197,
      status: 'active',
      subscriptionTier: 'starter',
      rooms: [
        { type: 'single', name: 'Chambre Standard', capacity: 1, basePriceXof: 25000, totalRooms: 15, amenities: '["wifi","climatisation","tv"]' },
        { type: 'double', name: 'Chambre Confort', capacity: 2, basePriceXof: 35000, totalRooms: 20, amenities: '["wifi","climatisation","tv","minibar"]' },
      ],
    },
  ];

  const hotelIds: string[] = [];
  const hotelRoomIds: string[] = [];
  for (const hd of hotelDefs) {
    const { rooms, ...hotelData } = hd;
    const hotel = await prisma.hotel.create({ data: hotelData as any });
    hotelIds.push(hotel.id);

    for (const rd of rooms) {
      const room = await prisma.hotelRoom.create({
        data: { hotelId: hotel.id, ...rd, currency: 'XOF' },
      });
      hotelRoomIds.push(room.id);
    }
    console.log(`  ✓ Hotel: ${hd.name} (${rooms.length} rooms)`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 8. GUESTHOUSES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating guesthouses...');

  const ghDefs = [
    {
      ownerId: agentBJ,
      name: 'Maison d\'Hôte Les Baobabs',
      slug: 'maison-hote-les-baobabs-cotonou',
      description: 'Charmante maison d\'hôte au cœur de Cotonou avec jardin tropical et petit-déjeuner inclus.',
      city: 'Cotonou',
      country: 'BJ',
      quartier: 'Ganhi',
      address: 'Rue 540, Ganhi, Cotonou',
      lat: 6.3620,
      lng: 2.3860,
      images: '["https://afribayit.com/img/gh/baobabs-1.jpg","https://afribayit.com/img/gh/baobabs-2.jpg"]',
      amenities: '["wifi","jardin","parking","cuisine partagée"]',
      rules: '{"noSmoking":true,"noParties":true,"quietHours":"22:00-07:00","petsAllowed":false}',
      certificationStatus: 'certified',
      overallRating: 4.4,
      reviewCount: 15,
      breakfastAvailable: true,
      breakfastPrice: 5000,
      hasStaff: true,
      rooms: [
        { name: 'Chambre Flamboyant', capacity: 2, basePrice: 20000, amenities: '["climatisation","wifi","moustiquaire"]' },
        { name: 'Chambre Baobab', capacity: 2, basePrice: 25000, amenities: '["climatisation","wifi","moustiquaire","salle bain privée"]' },
        { name: 'Suite Terrasse', capacity: 3, basePrice: 35000, amenities: '["climatisation","wifi","terrasse","salon"]' },
      ],
      meals: [
        { mealType: 'breakfast', price: 5000, includedInPrice: true, description: 'Petit-déjeuner continental avec fruits locaux' },
        { mealType: 'dinner', price: 8000, includedInPrice: false, description: 'Dîner béninois traditionnel (poisson braisé, pâte, sauce arachide)' },
      ],
      staff: [
        { name: 'Marie Dossou', role: 'receptionist', phone: '+229 97 11 11 11', accessLevel: 2 },
        { name: 'Kofi Adjovi', role: 'housekeeping', accessLevel: 1 },
        { name: 'Aïchatou Bakary', role: 'cook', accessLevel: 1 },
      ],
      pricingRules: [
        { name: 'Haute Saison', period: 'high_season', multiplier: 1.3, startDate: daysFromNow(60), endDate: daysFromNow(120), event_name: 'Fêtes de fin d\'année' },
        { name: 'Basse Saison', period: 'low_season', multiplier: 0.8, startDate: daysFromNow(180), endDate: daysFromNow(270) },
      ],
    },
    {
      ownerId: agentCI,
      name: 'Résidence Cocody',
      slug: 'residence-cocody-abidjan',
      description: 'Maison d\'hôte standing dans le quartier résidentiel de Cocody.',
      city: 'Abidjan',
      country: 'CI',
      quartier: 'Cocody Riviera',
      address: 'Rue des Jardins, Cocody',
      lat: 5.3550,
      lng: -3.9550,
      images: '["https://afribayit.com/img/gh/cocody-1.jpg"]',
      amenities: '["wifi","piscine","parking","gym"]',
      rules: '{"noSmoking":false,"noParties":true,"quietHours":"23:00-07:00"}',
      certificationStatus: 'pending',
      overallRating: 0,
      reviewCount: 0,
      breakfastAvailable: false,
      hasStaff: false,
      rooms: [
        { name: 'Studio Jardins', capacity: 2, basePrice: 30000, amenities: '["climatisation","wifi","cuisine","tv"]' },
        { name: 'Appartement Riviera', capacity: 4, basePrice: 55000, amenities: '["climatisation","wifi","cuisine","tv","salon","2 chambres"]' },
      ],
      meals: [],
      staff: [],
      pricingRules: [],
    },
    {
      ownerId: agentTG,
      name: 'Chez Maman Togo',
      slug: 'chez-maman-togo-lome',
      description: 'Ambiance authentique togolaise. Accueil chaleureux, cuisine maison, jardin tropical.',
      city: 'Lomé',
      country: 'TG',
      quartier: 'Tokoin',
      address: 'Avenue de la Libération, Tokoin',
      lat: 6.1380,
      lng: 1.2180,
      images: '["https://afribayit.com/img/gh/maman-togo-1.jpg"]',
      amenities: '["wifi","jardin","parking"]',
      rules: '{"noSmoking":true,"noParties":false,"quietHours":"22:00-06:00","petsAllowed":true}',
      certificationStatus: 'certified',
      overallRating: 4.6,
      reviewCount: 22,
      breakfastAvailable: true,
      breakfastPrice: 3500,
      hasStaff: true,
      rooms: [
        { name: 'Chambre Soleil', capacity: 2, basePrice: 15000, amenities: '["ventilateur","moustiquaire"]' },
        { name: 'Chambre Étoile', capacity: 2, basePrice: 18000, amenities: '["climatisation","wifi","moustiquaire"]' },
      ],
      meals: [
        { mealType: 'breakfast', price: 3500, includedInPrice: true, description: 'Café, pain, beurre, confiture, fruits' },
        { mealType: 'lunch', price: 5000, includedInPrice: false, description: 'Plat du jour togolais' },
      ],
      staff: [
        { name: 'Afi Mensah', role: 'cook', accessLevel: 1 },
        { name: 'Kossi Agbéko', role: 'security', accessLevel: 1 },
      ],
      pricingRules: [
        { name: 'Fêtes', period: 'holiday', multiplier: 1.5, startDate: daysFromNow(50), endDate: daysFromNow(58), event_name: 'Noël et Nouvel An' },
      ],
    },
    // ── BF Guesthouse ──
    {
      ownerId: agentBF,
      name: 'Maison d\'Hôte La Sahélienne',
      slug: 'maison-hote-la-sahelienne-ouagadougou',
      description: 'Maison d\'hôte chaleureuse à Ouagadougou avec jardin et petit-déjeuner burkinabè.',
      city: 'Ouagadougou',
      country: 'BF',
      quartier: 'Koulouba',
      address: 'Rue 28.42, Koulouba, Ouagadougou',
      lat: 12.3620,
      lng: -1.5120,
      images: '["https://afribayit.com/img/gh/sahelienne-1.jpg"]',
      amenities: '["wifi","jardin","parking","cuisine partagée"]',
      rules: '{"noSmoking":true,"noParties":true,"quietHours":"22:00-06:00","petsAllowed":false}',
      certificationStatus: 'pending',
      overallRating: 0,
      reviewCount: 0,
      breakfastAvailable: true,
      breakfastPrice: 4000,
      hasStaff: false,
      rooms: [
        { name: 'Chambre Karité', capacity: 2, basePrice: 18000, amenities: '["climatisation","wifi","moustiquaire"]' },
        { name: 'Chambre Baobab', capacity: 2, basePrice: 22000, amenities: '["climatisation","wifi","moustiquaire","salle bain privée"]' },
      ],
      meals: [
        { mealType: 'breakfast', price: 4000, includedInPrice: true, description: 'Petit-déjeuner burkinabè avec thé, pain, beurre, confiture' },
      ],
      staff: [],
      pricingRules: [],
    },
  ];

  const ghIds: string[] = [];
  for (const ghd of ghDefs) {
    const { rooms, meals, staff, pricingRules, ...ghData } = ghd;
    const gh = await prisma.guesthouse.create({ data: ghData as any });
    ghIds.push(gh.id);

    const ghRoomIds: string[] = [];
    for (const rd of rooms) {
      const room = await prisma.guesthouseRoom.create({
        data: { guesthouseId: gh.id, ...rd, currency: 'XOF' },
      });
      ghRoomIds.push(room.id);
    }

    for (const md of meals) {
      await prisma.guesthouseMeal.create({
        data: { guesthouseId: gh.id, ...md, currency: 'XOF' },
      });
    }

    for (const sd of staff) {
      await prisma.guesthouseStaff.create({
        data: { guesthouseId: gh.id, ...sd },
      });
    }

    for (const pr of pricingRules) {
      await prisma.guesthousePricingRule.create({
        data: { guesthouseId: gh.id, ...pr },
      });
    }

    console.log(`  ✓ Guesthouse: ${ghd.name} (${rooms.length} rooms)`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 9. ARTISAN SERVICES + QUOTES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating artisan services and quotes...');

  const artisanServices = [
    { artisanIdx: 0, services: [
      { serviceName: 'Maçonnerie gros œuvre', description: 'Construction murs, fondations, poteaux', basePrice: 8000, unit: 'm2', category: 'gros_oeuvre' },
      { serviceName: 'Dallage', description: 'Pose de carrelage et dallage intérieur/extérieur', basePrice: 5000, unit: 'm2', category: 'finition' },
      { serviceName: 'Fondation', description: 'Fouilles, semelles, radier', basePrice: 15000, unit: 'm2', category: 'gros_oeuvre' },
    ]},
    { artisanIdx: 1, services: [
      { serviceName: 'Installation électrique', description: 'Installation complète réseau électrique', basePrice: 6000, unit: 'm2', category: 'genie_technique' },
      { serviceName: 'Dépannage urgence', description: 'Intervention rapide pour pannes électriques', basePrice: 15000, unit: 'forfait', category: 'genie_technique' },
    ]},
    { artisanIdx: 2, services: [
      { serviceName: 'Plomberie sanitaire', description: 'Installation et réparation plomberie', basePrice: 10000, unit: 'forfait', category: 'genie_technique' },
    ]},
    { artisanIdx: 3, services: [
      { serviceName: 'Pose carrelage', description: 'Pose de carrelage sol et mur', basePrice: 4000, unit: 'm2', category: 'finition' },
      { serviceName: 'Faïence salle de bain', description: 'Pose faïence murale salle de bain', basePrice: 5500, unit: 'm2', category: 'finition' },
    ]},
    { artisanIdx: 4, services: [
      { serviceName: 'Peinture intérieure', description: 'Peinture murs et plafonds', basePrice: 2500, unit: 'm2', category: 'finition' },
      { serviceName: 'Peinture extérieure', description: 'Peinture façade et murs extérieurs', basePrice: 3500, unit: 'm2', category: 'exterieur' },
    ]},
    // ── BF Artisan services ──
    { artisanIdx: 5, services: [
      { serviceName: 'Maçonnerie gros œuvre', description: 'Construction murs, fondations, poteaux', basePrice: 7000, unit: 'm2', category: 'gros_oeuvre' },
      { serviceName: 'Dallage', description: 'Pose de carrelage et dallage intérieur/extérieur', basePrice: 4500, unit: 'm2', category: 'finition' },
      { serviceName: 'Fondation', description: 'Fouilles, semelles, radier', basePrice: 12000, unit: 'm2', category: 'gros_oeuvre' },
    ]},
  ];

  for (const as of artisanServices) {
    for (const svc of as.services) {
      await prisma.artisanService.create({
        data: { artisanId: artisanIds[as.artisanIdx], ...svc },
      });
    }
  }

  // Artisan quotes
  const artisanQuotes = [
    { artisanIdx: 0, userId: buyer1, propertyId: propertyIds[0], title: 'Rénovation villa Fidjrossè', description: 'Rénovation complète des murs et dallage de la villa', estimatedBudget: 5000000, status: 'accepted', artisanResponse: 'Devis établi pour travaux de rénovation', quotedPrice: 4500000, quotedDuration: '3 semaines' },
    { artisanIdx: 1, userId: buyer2, propertyId: propertyIds[5], title: 'Installation électrique appartement Cocody', description: 'Mise aux normes électriques de l\'appartement', estimatedBudget: 1500000, status: 'sent', artisanResponse: 'Visite technique programmée', quotedPrice: 1200000, quotedDuration: '1 semaine' },
    { artisanIdx: 3, userId: buyer1, propertyId: propertyIds[10], title: 'Carrelage villa Lomé', description: 'Pose de carrelage dans toute la villa', estimatedBudget: 2000000, status: 'requested' },
  ];

  for (const aq of artisanQuotes) {
    await prisma.artisanQuote.create({
      data: {
        artisanId: artisanIds[aq.artisanIdx],
        userId: aq.userId,
        propertyId: aq.propertyId,
        title: aq.title,
        description: aq.description,
        estimatedBudget: aq.estimatedBudget,
        status: aq.status,
        artisanResponse: aq.artisanResponse,
        quotedPrice: aq.quotedPrice,
        quotedDuration: aq.quotedDuration,
      },
    });
  }
  console.log(`  ✓ Created artisan services and quotes`);

  // ═══════════════════════════════════════════════════════════════════════
  // 10. GEOMETER MISSIONS + REPORTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating geometer missions...');

  const mission1 = await prisma.geometerMission.create({
    data: {
      propertyId: propertyIds[0], // Villa Fidjrossè
      geometerId: geometer1.id,
      serviceCode: 'GEO_SURF',
      status: 'completed',
      scheduledAt: daysAgo(20),
      completedAt: daysAgo(15),
      price: 150000,
      currency: 'XOF',
      reportUrl: 'https://afribayit.com/reports/geo-mission-001.pdf',
      result: 'VALIDATED',
      aiScore: 94.5,
      notes: 'Surface validée, pas de discordance avec le titre foncier.',
    },
  });

  await prisma.geometerReport.create({
    data: {
      missionId: mission1.id,
      pdfUrl: 'https://afribayit.com/reports/geo-mission-001.pdf',
      geojsonUrl: 'https://afribayit.com/reports/geo-mission-001.geojson',
      validationStatus: 'validated',
      aiScore: 94.5,
      blockchainHash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd',
    },
  });

  const mission2 = await prisma.geometerMission.create({
    data: {
      propertyId: propertyIds[2], // Terrain Akpakpa
      geometerId: geometer1.id,
      serviceCode: 'GEO_BORN',
      status: 'completed',
      scheduledAt: daysAgo(35),
      completedAt: daysAgo(28),
      price: 200000,
      currency: 'XOF',
      result: 'VALIDATED',
      aiScore: 89.2,
      notes: 'Bornage effectué, 4 bornes posées.',
    },
  });

  await prisma.geometerReport.create({
    data: {
      missionId: mission2.id,
      pdfUrl: 'https://afribayit.com/reports/geo-mission-002.pdf',
      validationStatus: 'validated',
      aiScore: 89.2,
    },
  });

  const mission3 = await prisma.geometerMission.create({
    data: {
      propertyId: propertyIds[5], // Appartement Cocody
      geometerId: geometer2.id,
      serviceCode: 'GEO_CERT',
      status: 'in_progress',
      scheduledAt: daysAgo(2),
      price: 250000,
      currency: 'XOF',
      notes: 'Certification foncière en cours.',
    },
  });

  await prisma.geometerReport.create({
    data: {
      missionId: mission3.id,
      validationStatus: 'pending',
    },
  });

  console.log(`  ✓ Created 3 geometer missions with reports`);

  // ═══════════════════════════════════════════════════════════════════════
  // 11. COURSES + ENROLLMENTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating courses...');

  const courseDefs = [
    {
      title: 'Investissement Immobilier en Afrique de l\'Ouest',
      slug: 'investissement-immobilier-afrique-ouest',
      category: 'investissement',
      country: 'BJ',
      instructorId: admin1,
      instructor: 'Aminata Dossou',
      description: 'Apprenez les bases de l\'investissement immobilier au Bénin, Côte d\'Ivoire et Togo. Analyse de marché, rendement locatif, fiscalité.',
      duration: '8 heures',
      price: 25000,
      level: 'debutant',
      certificate: true,
      rating: 4.6,
      students: 145,
      published: true,
      modules: '[{"title":"Introduction au marché immobilier","duration":"1h"},{"title":"Analyse de rendement","duration":"2h"},{"title":"Fiscalité immobilière","duration":"2h"},{"title":"Cas pratiques","duration":"3h"}]',
    },
    {
      title: 'Droit Foncier Béninois : Comprendre les Titres',
      slug: 'droit-foncier-benin-titres',
      category: 'droit_foncier',
      country: 'BJ',
      instructorId: notaryUser,
      instructor: 'Me Florent Agboka',
      description: 'Maîtrisez le droit foncier béninois : titre foncier, ACD, certificat ANDF, actes de vente. Essentiel pour tout investisseur.',
      duration: '12 heures',
      price: 40000,
      level: 'intermediaire',
      certificate: true,
      rating: 4.8,
      students: 89,
      published: true,
      modules: '[{"title":"Types de titres fonciers au Bénin","duration":"2h"},{"title":"Procédure d\'obtention","duration":"3h"},{"title":"Certificat ANDF","duration":"2h"},{"title":"Rédaction d\'actes","duration":"3h"},{"title":"Contentieux foncier","duration":"2h"}]',
    },
    {
      title: 'Construction Durable en Zone Tropicale',
      slug: 'construction-durable-zone-tropicale',
      category: 'construction',
      country: 'BJ',
      instructorId: artisanUser,
      instructor: 'Issifou Saka',
      description: 'Techniques de construction adaptées au climat tropical : matériaux locaux, ventilation naturelle, gestion des eaux.',
      duration: '6 heures',
      price: 15000,
      level: 'debutant',
      certificate: false,
      rating: 4.2,
      students: 67,
      published: true,
    },
    {
      title: 'Finance Immobilière et Levée de Fonds',
      slug: 'finance-immobiliere-levee-fonds',
      category: 'finance',
      country: 'CI',
      instructorId: admin2,
      instructor: 'Kouadio Yao',
      description: 'Comprendre le financement immobilier en Afrique : prêts bancaires, microfinance, investissement participatif.',
      duration: '10 heures',
      price: 35000,
      level: 'avance',
      certificate: true,
      rating: 4.4,
      students: 52,
      published: true,
    },
    {
      title: 'Devenir Agent Immobilier Certifié',
      slug: 'devenir-agent-immobilier-certifie',
      category: 'certification',
      country: 'TG',
      instructorId: agentBJ,
      instructor: 'Hervé Houénou',
      description: 'Formation complète pour obtenir la certification d\'agent immobilier sur la plateforme AfriBayit.',
      duration: '20 heures',
      price: 75000,
      level: 'debutant',
      certificate: true,
      rating: 4.9,
      students: 210,
      published: true,
      modules: '[{"title":"Cadre juridique","duration":"4h"},{"title":"Techniques de vente","duration":"4h"},{"title":"Outils numériques","duration":"4h"},{"title":"Éthique et déontologie","duration":"4h"},{"title":"Examen final","duration":"4h"}]',
    },
    // ── BF Course ──
    {
      title: 'Droit Foncier Burkinabè : Titres et Certification',
      slug: 'droit-foncier-burkina-titres-certification',
      category: 'droit_foncier',
      country: 'BF',
      instructorId: notaryBFUser,
      instructor: 'Mariam Ouedraogo',
      description: 'Maîtrisez le droit foncier burkinabè : titre foncier, acte de vente, certificat de propriété, régime foncier rural. Essentiel pour tout investisseur au Burkina Faso.',
      duration: '10 heures',
      price: 30000,
      level: 'intermediaire',
      certificate: true,
      rating: 4.5,
      students: 34,
      published: true,
      modules: '[{"title":"Types de titres fonciers au Burkina","duration":"2h"},{"title":"Procédure d\'obtention","duration":"2h"},{"title":"Régime foncier rural","duration":"2h"},{"title":"Contentieux foncier","duration":"2h"},{"title":"Cas pratiques","duration":"2h"}]',
    },
  ];

  const courseIds: string[] = [];
  for (const cd of courseDefs) {
    const course = await prisma.course.create({ data: cd as any });
    courseIds.push(course.id);
  }
  console.log(`  ✓ Created ${courseIds.length} courses`);

  // Enrollments
  const enrollmentDefs = [
    { userId: buyer1, courseId: courseIds[0], progress: 65.0, completed: false },
    { userId: buyer1, courseId: courseIds[1], progress: 100.0, completed: true, completedAt: daysAgo(10) },
    { userId: buyer2, courseId: courseIds[0], progress: 20.0, completed: false },
    { userId: buyer2, courseId: courseIds[4], progress: 45.0, completed: false },
    { userId: agentTG, courseId: courseIds[4], progress: 90.0, completed: false },
    { userId: artisanUser, courseId: courseIds[2], progress: 100.0, completed: true, completedAt: daysAgo(30), certificateUrl: 'https://afribayit.com/certs/cert-001.pdf' },
  ];

  for (const ed of enrollmentDefs) {
    await prisma.courseEnrollment.create({ data: ed });
  }
  console.log(`  ✓ Created ${enrollmentDefs.length} enrollments`);

  // ═══════════════════════════════════════════════════════════════════════
  // 12. COMMUNITY (Posts, Groups, Events)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating community data...');

  // Groups
  const groupDefs = [
    {
      name: 'Investisseurs Immobiliers Bénin',
      slug: 'investisseurs-immobiliers-benin',
      description: 'Groupe dédié aux investisseurs immobiliers au Bénin. Partagez opportunités et analyses de marché.',
      type: 'investisseurs',
      country: 'BJ',
      city: 'Cotonou',
      members: 156,
      isPrivate: false,
      coverImage: 'https://afribayit.com/img/groups/invest-bj.jpg',
    },
    {
      name: 'Agents Immobiliers Afrique de l\'Ouest',
      slug: 'agents-immobiliers-afrique-ouest',
      description: 'Réseau d\'agents immobiliers certifiés. Bonnes pratiques, formations, networking.',
      type: 'agents',
      country: 'BJ',
      members: 89,
      isPrivate: true,
      coverImage: 'https://afribayit.com/img/groups/agents-ao.jpg',
    },
    {
      name: 'Construction & Artisanat Cotonou',
      slug: 'construction-artisanat-cotonou',
      description: 'Échangez avec des artisans qualifiés pour vos projets de construction et rénovation à Cotonou.',
      type: 'artisans',
      country: 'BJ',
      city: 'Cotonou',
      members: 67,
      isPrivate: false,
    },
    {
      name: 'Investisseurs Lomé',
      slug: 'investisseurs-lome',
      description: 'Communauté d\'investisseurs immobiliers à Lomé et environs.',
      type: 'ville',
      country: 'TG',
      city: 'Lomé',
      members: 42,
      isPrivate: false,
    },
  ];

  const groupIds: string[] = [];
  for (const gd of groupDefs) {
    const group = await prisma.communityGroup.create({ data: gd });
    groupIds.push(group.id);
  }
  console.log(`  ✓ Created ${groupIds.length} community groups`);

  // Posts
  const postDefs = [
    { authorId: buyer1, title: 'Mon premier investissement à Cotonou : retour d\'expérience', content: 'Après 6 mois de recherche, j\'ai finalement acquis un terrain à Akpakpa. Voici ce que j\'ai appris...', category: 'success_story', country: 'BJ', replies: 8, views: 450, likes: 32, pinned: false, tags: '["investissement","cotonou","terrain"]' },
    { authorId: agentBJ, title: 'Tendance du marché immobilier Cotonou 2025', content: 'Analyse des prix au m² par quartier. Fidjrossè en hausse de 12%, Haie Vive stable...', category: 'market_analysis', country: 'BJ', replies: 15, views: 890, likes: 56, pinned: true, tags: '["marché","analyse","cotonou","prix"]' },
    { authorId: notaryUser, title: 'Comprendre le certificat ANDF : guide complet', content: 'Beaucoup de confusion existe sur le certificat de propriété ANDF. Voici un guide clair pour comprendre la différence avec le titre foncier...', category: 'legal', country: 'BJ', replies: 22, views: 1200, likes: 89, pinned: true, tags: '["droit foncier","ANDF","titre foncier","bénin"]' },
    { authorId: buyer2, title: 'Recherche appartement Cocody : conseils bienvenus', content: 'Je cherche un appartement T2 ou T3 dans le quartier de Cocody à Abidjan. Budget max 130M XOF. Quels conseils ?', category: 'question', country: 'CI', replies: 12, views: 340, likes: 8, tags: '["recherche","appartement","cocody","abidjan"]' },
    { authorId: agentCI, title: 'Le marché de l\'immobilier à Abidjan en 2025', content: 'Le Plateau reste le quartier le plus cher, mais Cocody Riviera gagne en popularité...', category: 'market_analysis', country: 'CI', replies: 9, views: 560, likes: 34, tags: '["marché","abidjan","analyse"]' },
    { authorId: geometerUser, title: 'Bornage et conflits fonciers : l\'importance du géomètre', content: 'J\'ai rencontré plusieurs cas de conflits fonciers cette année. Le bornage professionnel est essentiel...', category: 'discussion', country: 'BJ', replies: 18, views: 670, likes: 45, tags: '["géomètre","bornage","conflit foncier"]' },
    { authorId: artisanUser, title: 'Comment choisir un maçon qualifié au Bénin', content: 'Voici 10 critères pour évaluer un artisan maçon avant de lui confier votre chantier...', category: 'discussion', country: 'BJ', replies: 6, views: 230, likes: 15, tags: '["artisan","maçon","construction"]' },
    { authorId: agentTG, title: 'Opportunités immobilières à Lomé : mon analyse', content: 'Lomé offre des opportunités uniques, surtout dans les quartiers bord de mer. Les prix restent compétitifs...', category: 'investment', country: 'TG', replies: 7, views: 380, likes: 22, tags: '["investissement","lomé","opportunité"]' },
    { authorId: buyer1, title: 'Rendement locatif Cotonou vs Abidjan : comparatif', content: 'J\'ai analysé les rendements locatifs dans les deux villes. Voici mes conclusions...', category: 'market_analysis', country: 'BJ', replies: 14, views: 520, likes: 38, tags: '["rendement","comparatif","cotonou","abidjan"]' },
    { authorId: admin1, title: 'Bienvenue sur la communauté AfriBayit !', content: 'Cet espace est dédié à l\'entraide et au partage de connaissances immobilières en Afrique de l\'Ouest...', category: 'discussion', replies: 3, views: 1500, likes: 120, pinned: true, tags: '["bienvenue","communauté"]' },
    { authorId: agentBJ, title: 'Visite virtuelle 3D : révolution dans la vente immobilière', content: 'Les visites virtuelles changent la donne. Voici comment les intégrer dans votre stratégie...', category: 'discussion', country: 'BJ', replies: 5, views: 190, likes: 12, tags: '["visite virtuelle","3D","technologie"]' },
    { authorId: buyer2, title: 'Financement immobilier : quelles solutions en CI ?', content: 'Banques, microfinance, investissement participatif... Quelles sont les meilleures options ?', category: 'investment', country: 'CI', replies: 11, views: 430, likes: 28, tags: '["financement","investissement","côte ivoire"]' },
    // ── BF Community posts ──
    { authorId: buyerBF, title: 'Investir à Ouagadougou : mon retour d\'expérience', content: 'Après plusieurs mois de recherche, j\'ai acquis un terrain à Koulouba. Voici ce que j\'ai appris sur le marché immobilier burkinabè...', category: 'success_story', country: 'BF', replies: 5, views: 180, likes: 12, tags: '["investissement","ouagadougou","terrain","burkina"]' },
    { authorId: agentBF, title: 'Marché immobilier Ouagadougou 2025 : analyse et tendances', content: 'Ouaga 2000 reste le quartier le plus recherché. Les prix au m² ont augmenté de 8% cette année. Koulouba gagne en popularité...', category: 'market_analysis', country: 'BF', replies: 6, views: 220, likes: 18, tags: '["marché","ouagadougou","analyse","burkina","prix"]' },
  ];

  const postIds: string[] = [];
  for (const pd of postDefs) {
    const post = await prisma.communityPost.create({ data: pd as any });
    postIds.push(post.id);
  }
  console.log(`  ✓ Created ${postIds.length} community posts`);

  // Replies to a few posts
  const replyDefs = [
    { postId: postIds[0], authorId: agentBJ, content: 'Félicitations pour votre investissement ! Akpakpa est en effet une zone très prometteuse.', likes: 8 },
    { postId: postIds[0], authorId: geometerUser, content: 'N\'hésitez pas à faire un bornage si ce n\'est pas déjà fait. C\'est crucial pour sécuriser votre terrain.', likes: 12 },
    { postId: postIds[3], authorId: agentCI, content: 'Je peux vous proposer plusieurs options à Cocody. Contactez-moi en MP pour les détails.', likes: 5 },
    { postId: postIds[5], authorId: notaryUser, content: 'Excellente initiative de sensibilisation. Le bornage devrait être obligatoire avant toute transaction.', likes: 15 },
    { postId: postIds[9], authorId: buyer1, content: 'Merci pour cette plateforme ! C\'est exactement ce dont on avait besoin.', likes: 25 },
  ];

  for (const rd of replyDefs) {
    await prisma.communityReply.create({ data: rd });
  }
  console.log(`  ✓ Created ${replyDefs.length} community replies`);

  // Group memberships
  const membershipDefs = [
    { groupId: groupIds[0], userId: buyer1, role: 'admin' },
    { groupId: groupIds[0], userId: agentBJ, role: 'moderator' },
    { groupId: groupIds[0], userId: buyer2, role: 'member' },
    { groupId: groupIds[1], userId: agentBJ, role: 'admin' },
    { groupId: groupIds[1], userId: agentCI, role: 'member' },
    { groupId: groupIds[1], userId: agentTG, role: 'member' },
    { groupId: groupIds[2], userId: artisanUser, role: 'admin' },
    { groupId: groupIds[2], userId: agentBJ, role: 'member' },
    { groupId: groupIds[3], userId: agentTG, role: 'admin' },
    { groupId: groupIds[3], userId: buyer1, role: 'member' },
  ];

  for (const md of membershipDefs) {
    await prisma.groupMembership.create({ data: md });
  }
  console.log(`  ✓ Created ${membershipDefs.length} group memberships`);

  // Events
  const eventDefs = [
    {
      title: 'Meetup Investisseurs Cotonou',
      description: 'Rencontre mensuelle des investisseurs immobiliers de Cotonou. Networking et partage d\'expériences.',
      organizerId: agentBJ,
      groupId: groupIds[0],
      eventType: 'meetup',
      country: 'BJ',
      city: 'Cotonou',
      venue: 'Hôtel du Lac, Salle Conférence',
      eventDate: daysFromNow(14),
      endDate: daysFromNow(14),
      maxAttendees: 50,
      attendees: 28,
      image: 'https://afribayit.com/img/events/meetup-ctn.jpg',
    },
    {
      title: 'Webinar : Droit Foncier Béninois',
      description: 'Webinaire animé par Me Agboka sur les dernières réformes du droit foncier au Bénin.',
      organizerId: notaryUser,
      eventType: 'webinar',
      country: 'BJ',
      eventDate: daysFromNow(7),
      endDate: daysFromNow(7),
      isVirtual: true,
      meetingUrl: 'https://meet.afribayit.com/webinar-droit-foncier',
      maxAttendees: 200,
      attendees: 87,
    },
    {
      title: 'Visite de Terrain Akpakpa',
      description: 'Visite guidée des terrains disponibles à Akpakpa avec l\'agent Hervé Houénou.',
      organizerId: agentBJ,
      groupId: groupIds[0],
      eventType: 'visite',
      country: 'BJ',
      city: 'Cotonou',
      venue: 'Rond-point Akpakpa',
      eventDate: daysFromNow(21),
      maxAttendees: 15,
      attendees: 8,
    },
  ];

  for (const ed of eventDefs) {
    await prisma.communityEvent.create({ data: ed });
  }
  console.log(`  ✓ Created ${eventDefs.length} community events`);

  // ═══════════════════════════════════════════════════════════════════════
  // 13. NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating notifications...');

  const notifDefs = [
    { userId: buyer1, type: 'transaction', category: 'transactions', country: 'BJ', title: 'Transaction mise à jour', message: 'Votre transaction ESC-2025-001 a été mise à jour : fonds reçus en escrow.', actionUrl: '/transactions/ESC-2025-001', channels: '["push","email"]', sentVia: '["push"]' },
    { userId: buyer1, type: 'community', category: 'community', country: 'BJ', title: 'Nouvelle réponse à votre post', message: 'Hervé Houénou a répondu à votre post "Mon premier investissement".', actorId: agentBJ, actorName: 'Hervé Houénou', channels: '["push"]' },
    { userId: buyer2, type: 'alert', category: 'market_alerts', country: 'CI', title: 'Nouveau bien correspondant', message: 'Un appartement T2 à Tokoin correspond à vos critères de recherche.', actionUrl: '/properties/appartement-t2-tokoin-lome', channels: '["push","email","whatsapp"]', sentVia: '["push","email"]' },
    { userId: agentBJ, type: 'message', category: 'rebecca', country: 'BJ', title: 'Rebecca IA', message: 'Vous avez 3 nouvelles demandes de visite pour la Villa Fidjrossè.', channels: '["push"]', sentVia: '["push"]' },
    { userId: agentBJ, type: 'system', category: 'annonces', country: 'BJ', title: 'Propriété approuvée', message: 'Votre propriété "Villa Moderne Fidjrossè" a été approuvée et publiée.', actionUrl: '/properties/villa-moderne-fidjrosse-cotonou' },
    { userId: agentCI, type: 'transaction', category: 'transactions', country: 'CI', title: 'Nouvelle transaction', message: 'Nouvelle transaction créée pour l\'appartement Standing Cocody.', actionUrl: '/transactions' },
    { userId: artisanUser, type: 'certification', category: 'certification', country: 'BJ', title: 'Certification approuvée', message: 'Votre certification artisan Maçon a été validée. Félicitations !', channels: '["push","email","sms"]', sentVia: '["push","email"]' },
    { userId: geometerUser, type: 'system', category: 'transactions', country: 'BJ', title: 'Nouvelle mission assignée', message: 'Une mission de bornage vous a été assignée pour le terrain d\'Akpakpa.', actionUrl: '/missions' },
    { userId: buyer1, type: 'promotion', category: 'premium', country: 'BJ', title: 'Offre Premium', message: 'Passez au plan Elite et bénéficiez de 2 mois gratuits !', actionUrl: '/premium', channels: '["push","email"]' },
    { userId: buyer2, type: 'security', category: 'security', country: 'CI', title: 'Vérification KYC requise', message: 'Veuillez compléter votre vérification KYC pour débloquer toutes les fonctionnalités.', actionUrl: '/kyc', channels: '["push","email","sms"]' },
    { userId: agentTG, type: 'community', category: 'community', country: 'TG', title: 'Nouveau membre dans votre groupe', message: 'Pierre Agossou a rejoint le groupe "Investisseurs Lomé".', actorId: buyer1, actorName: 'Pierre Agossou' },
    { userId: notaryUser, type: 'transaction', category: 'transactions', country: 'BJ', title: 'Acte à signer', message: 'L\'acte de vente pour la transaction ESC-2025-002 est prêt pour signature.', actionUrl: '/transactions/ESC-2025-002' },
  ];

  for (const nd of notifDefs) {
    await prisma.notification.create({ data: nd as any });
  }
  console.log(`  ✓ Created ${notifDefs.length} notifications`);

  // ═══════════════════════════════════════════════════════════════════════
  // 14. REVIEWS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating reviews...');

  const reviewDefs = [
    { reviewerId: buyer1, targetId: agentBJ, targetType: 'agent', country: 'BJ', rating: 5, comment: 'Hervé est un agent exceptionnel. Professionnel, réactif et à l\'écoute. Je recommande vivement !', verified: true },
    { reviewerId: buyer2, targetId: agentCI, targetType: 'agent', country: 'CI', rating: 4, comment: 'Bonne agent, bien qu\'un peu lente à répondre parfois. Mais le résultat est au rendez-vous.', verified: true },
    { reviewerId: buyer1, targetId: propertyIds[0], targetType: 'property', country: 'BJ', rating: 5, comment: 'Villa magnifique, conforme à la description. Le quartier est calme et sécurisé.', verified: true },
    { reviewerId: buyer2, targetId: propertyIds[2], targetType: 'property', country: 'BJ', rating: 4, comment: 'Bon terrain, bien situé. Cependant, l\'accès pourrait être meilleur.', verified: true },
    { reviewerId: buyer1, targetId: artisanIds[0], targetType: 'artisan', country: 'BJ', rating: 5, comment: 'Issifou est un maçon de talent. Travail soigné et dans les délais.', verified: true },
    { reviewerId: buyer2, targetId: artisanIds[1], targetType: 'artisan', country: 'BJ', rating: 3, comment: 'Travail correct mais délais non respectés. Communication à améliorer.', verified: false },
    { reviewerId: buyer1, targetId: geometer1.id, targetType: 'geometer', country: 'BJ', rating: 5, comment: 'Géomètre très professionnel. Rapport détaillé et rapide.', verified: true },
    { reviewerId: buyer2, targetId: hotelIds[0], targetType: 'hotel', country: 'BJ', rating: 4, comment: 'Bon hôtel, personnel accueillant. La piscine est un plus.', verified: true, subRatings: '{"cleanliness":4,"comfort":4,"location":5,"value":3,"service":4}' },
    { reviewerId: buyer1, targetId: hotelIds[2], targetType: 'hotel', country: 'CI', rating: 5, comment: 'L\'Hôtel Ivoire est exceptionnel. Service irréprochable, vue magnifique.', verified: true, subRatings: '{"cleanliness":5,"comfort":5,"location":5,"value":4,"service":5}' },
    { reviewerId: buyer2, targetId: courseIds[0], targetType: 'course', country: 'BJ', rating: 4, comment: 'Formation très instructive. J\'aurais aimé plus de cas pratiques cependant.', verified: true },
    { reviewerId: buyer1, targetId: notary1.id, targetType: 'notary', country: 'BJ', rating: 5, comment: 'Me Agboka est un notaire exemplaire. Experte en droit foncier, disponible et rigoureux.', verified: true },
  ];

  for (const rd of reviewDefs) {
    await prisma.review.create({ data: rd as any });
  }
  console.log(`  ✓ Created ${reviewDefs.length} reviews`);

  // ═══════════════════════════════════════════════════════════════════════
  // 15. SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating subscriptions...');

  const subDefs = [
    { userId: agentBJ, planType: 'agent_grow', priceXof: 15000, country: 'BJ', status: 'active', startDate: daysAgo(60), endDate: daysFromNow(305), autoRenew: true, paymentRef: 'PAY-SUB-001' },
    { userId: agentCI, planType: 'agent_lead', priceXof: 35000, country: 'CI', status: 'active', startDate: daysAgo(30), endDate: daysFromNow(335), autoRenew: true, paymentRef: 'PAY-SUB-002' },
    { userId: agentTG, planType: 'agent_seed', priceXof: 5000, country: 'TG', status: 'active', startDate: daysAgo(15), endDate: daysFromNow(350), autoRenew: false, paymentRef: 'PAY-SUB-003' },
    { userId: artisanUser, planType: 'artisan_pro', priceXof: 10000, country: 'BJ', status: 'active', startDate: daysAgo(45), endDate: daysFromNow(320), autoRenew: true, paymentRef: 'PAY-SUB-004' },
    { userId: geometerUser, planType: 'geometer_pro', priceXof: 12000, country: 'BJ', status: 'active', startDate: daysAgo(90), endDate: daysFromNow(275), autoRenew: true, paymentRef: 'PAY-SUB-005' },
    { userId: buyer1, planType: 'academy_pro', priceXof: 20000, country: 'BJ', status: 'cancelled', startDate: daysAgo(180), endDate: daysAgo(5), autoRenew: false, paymentRef: 'PAY-SUB-006' },
    { userId: notaryUser, planType: 'notary_pro', priceXof: 15000, country: 'BJ', status: 'active', startDate: daysAgo(30), endDate: daysFromNow(335), autoRenew: true, paymentRef: 'PAY-SUB-007' },
    // ── BF Subscription ──
    { userId: agentBF, planType: 'agent_seed', priceXof: 5000, country: 'BF', status: 'active', startDate: daysAgo(20), endDate: daysFromNow(345), autoRenew: false, paymentRef: 'PAY-SUB-008' },
  ];

  for (const sd of subDefs) {
    await prisma.subscription.create({ data: sd });
  }
  console.log(`  ✓ Created ${subDefs.length} subscriptions`);

  // ═══════════════════════════════════════════════════════════════════════
  // 16. PROFESSIONAL PROFILES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating professional profiles...');

  const profDefs = [
    {
      userId: agentBJ,
      headline: 'Agent Immobilier Certifié — Spécialiste Cotonou',
      country: 'BJ',
      bio: 'Avec 8 ans d\'expérience dans l\'immobilier béninois, j\'accompagne mes clients dans tous leurs projets d\'acquisition et de vente.',
      specialities: '["Vente villa","Terrain","Appartement","Investissement"]',
      languages: '[{"lang":"Français","level":"Natif"},{"lang":"Fon","level":"Natif"},{"lang":"Anglais","level":"Intermédiaire"}]',
      availability: 'available',
      credibilityScore: 88,
      completenessPct: 95,
      isPublic: true,
      slug: 'herve-houenou',
      experience: '[{"title":"Agent Immobilier Senior","company":"AfriBayit","period":"2021-présent"},{"title":"Agent Junior","company":"ImmoBénin","period":"2017-2021"}]',
      education: '[{"degree":"Licence en Gestion Immobilière","school":"Université d\'Abomey-Calavi","year":2017}]',
      certifications: '[{"name":"Agent Certifié AfriBayit","year":2021},{"name":"GEOTRUST Standard","year":2023}]',
      zone: 'Cotonou et environs',
      agencyName: 'Houénou Immobilier',
    },
    {
      userId: agentCI,
      headline: 'Directrice — Agence Koné & Fils',
      country: 'CI',
      bio: 'Héritière d\'une tradition familiale dans l\'immobilier ivoirien. Spécialiste des quartiers haut de gamme d\'Abidjan.',
      specialities: '["Appartement standing","Villa prestige","Bureau","Investissement"]',
      languages: '[{"lang":"Français","level":"Natif"},{"lang":"Dioula","level":"Courant"}]',
      availability: 'available',
      credibilityScore: 82,
      completenessPct: 90,
      isPublic: true,
      slug: 'fatou-kone',
      experience: '[{"title":"Directrice","company":"Koné & Fils Immobilier","period":"2015-présent"}]',
      zone: 'Abidjan — Cocody, Plateau, Marcory',
      agencyName: 'Koné & Fils Immobilier',
    },
    {
      userId: artisanUser,
      headline: 'Maçon Qualifié — 12 ans d\'expérience',
      country: 'BJ',
      bio: 'Spécialiste de la construction moderne au Bénin. Fondations, maçonnerie, dallage. Certifié AfriBayit.',
      specialities: '["Maçonnerie","Dallage","Fondation","Hourdis"]',
      languages: '[{"lang":"Français","level":"Courant"},{"lang":"Fon","level":"Natif"}]',
      availability: 'available',
      credibilityScore: 65,
      completenessPct: 75,
      isPublic: true,
      slug: 'issifou-saka',
      experience: '[{"title":"Maçon Chef","company":"Indépendant","period":"2018-présent"},{"title":"Apprenti Maçon","company":"BTP Bénin","period":"2012-2018"}]',
      certifications: '[{"name":"Artisan Certifié AfriBayit","year":2023}]',
      zone: 'Cotonou',
    },
    {
      userId: geometerUser,
      headline: 'Géomètre Expert — Topographie & Certification Foncière',
      country: 'BJ',
      bio: 'Géomètre expert avec 15 ans d\'expérience. Spécialiste du bornage, de la topographie et de la certification foncière au Bénin.',
      specialities: '["Topographie","Bornage","Certification foncière","GPS","Drone"]',
      languages: '[{"lang":"Français","level":"Natif"},{"lang":"Fon","level":"Natif"},{"lang":"Anglais","level":"Technique"}]',
      availability: 'available',
      credibilityScore: 85,
      completenessPct: 92,
      isPublic: true,
      slug: 'rachidou-bello',
      experience: '[{"title":"Géomètre Expert","company":"Cabinet Bello Géomètre","period":"2015-présent"}]',
      certifications: '[{"name":"Géomètre Expert Certifié","year":2015},{"name":"GEOTRUST Elite","year":2024}]',
      zone: 'Sud-Bénin',
    },
    {
      userId: notaryUser,
      headline: 'Notaire — Spécialiste Droit Foncier',
      country: 'BJ',
      bio: 'Notaire de profession avec expertise en droit foncier et successions. Membre de la Chambre Nationale des Notaires du Bénin.',
      specialities: '["Droit foncier","Succession","Baux","Actes de vente"]',
      languages: '[{"lang":"Français","level":"Natif"},{"lang":"Fon","level":"Courant"}]',
      availability: 'available',
      credibilityScore: 92,
      completenessPct: 98,
      isPublic: true,
      slug: 'me-florent-agboka',
      experience: '[{"title":"Notaire","company":"Office Notarial Agboka","period":"2010-présent"}]',
      certifications: '[{"name":"Notaire Certifié","year":2010}]',
      zone: 'Cotonou et environs',
    },
  ];

  const profileIds: string[] = [];
  for (const pd of profDefs) {
    const profile = await prisma.professionalProfile.create({ data: pd as any });
    profileIds.push(profile.id);
  }
  console.log(`  ✓ Created ${profileIds.length} professional profiles`);

  // Skill endorsements
  const endorsementDefs = [
    { profileId: profileIds[0], endorserId: buyer1, skill: 'Vente villa' },
    { profileId: profileIds[0], endorserId: buyer2, skill: 'Vente villa' },
    { profileId: profileIds[0], endorserId: geometerUser, skill: 'Investissement' },
    { profileId: profileIds[3], endorserId: buyer1, skill: 'Topographie' },
    { profileId: profileIds[3], endorserId: agentBJ, skill: 'Bornage' },
    { profileId: profileIds[4], endorserId: buyer1, skill: 'Droit foncier' },
    { profileId: profileIds[4], endorserId: agentBJ, skill: 'Droit foncier' },
    { profileId: profileIds[2], endorserId: buyer1, skill: 'Maçonnerie' },
  ];

  for (const ed of endorsementDefs) {
    await prisma.skillEndorsement.create({ data: ed });
  }
  console.log(`  ✓ Created ${endorsementDefs.length} skill endorsements`);

  // ═══════════════════════════════════════════════════════════════════════
  // 17. WALLET TRANSACTIONS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating wallet transactions...');

  const walletTxDefs = [
    { userId: buyer1, type: 'deposit', amount: 5000000, balanceAfter: 5000000, status: 'completed', reference: 'WAL-DEP-001', providerRef: 'MM-BJ-111000', metadata: '{"source":"Mobile Money","provider":"MTN"}' },
    { userId: buyer1, type: 'escrow_fund', amount: 75000000, balanceAfter: 0, status: 'completed', reference: 'WAL-ESC-001', providerRef: 'ESC-2025-001' },
    { userId: buyer1, type: 'deposit', amount: 2000000, balanceAfter: 2000000, status: 'completed', reference: 'WAL-DEP-002', providerRef: 'BT-BJ-222000' },
    { userId: buyer1, type: 'academy_payment', amount: 25000, balanceAfter: 1975000, status: 'completed', reference: 'WAL-ACA-001' },
    { userId: buyer2, type: 'deposit', amount: 2000000, balanceAfter: 2000000, status: 'completed', reference: 'WAL-DEP-003', providerRef: 'MM-CI-333000' },
    { userId: buyer2, type: 'escrow_fund', amount: 25000000, balanceAfter: 0, status: 'completed', reference: 'WAL-ESC-002', providerRef: 'ESC-2025-002' },
    { userId: agentBJ, type: 'commission', amount: 480000, balanceAfter: 250480, status: 'completed', reference: 'WAL-COM-001', metadata: '{"transactionRef":"ESC-2024-003"}' },
    { userId: agentBJ, type: 'deposit', amount: 250000, balanceAfter: 500480, status: 'completed', reference: 'WAL-DEP-004' },
    { userId: artisanUser, type: 'deposit', amount: 75000, balanceAfter: 75000, status: 'completed', reference: 'WAL-DEP-005' },
    { userId: artisanUser, type: 'subscription', amount: 10000, balanceAfter: 65000, status: 'completed', reference: 'WAL-SUB-001', metadata: '{"planType":"artisan_pro"}' },
    { userId: geometerUser, type: 'deposit', amount: 320000, balanceAfter: 320000, status: 'completed', reference: 'WAL-DEP-006' },
    { userId: notaryUser, type: 'commission', amount: 225000, balanceAfter: 375000, status: 'pending', reference: 'WAL-COM-002', metadata: '{"transactionRef":"ESC-2025-001"}' },
  ];

  for (const wd of walletTxDefs) {
    await prisma.walletTransaction.create({ data: wd as any });
  }
  console.log(`  ✓ Created ${walletTxDefs.length} wallet transactions`);

  // ═══════════════════════════════════════════════════════════════════════
  // 18. KYC DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating KYC documents...');

  const kycDefs = [
    { userId: buyer1, docType: 'id_card', docUrl: 'https://afribayit.com/kyc/buyer1-id-card.jpg', ocrValid: true, aiScore: 92.5, status: 'human_validated', country: 'BJ' },
    { userId: buyer1, docType: 'selfie', docUrl: 'https://afribayit.com/kyc/buyer1-selfie.jpg', ocrValid: true, aiScore: 88.0, status: 'ai_validated', country: 'BJ' },
    { userId: buyer1, docType: 'proof_address', docUrl: 'https://afribayit.com/kyc/buyer1-address.pdf', ocrValid: false, aiScore: 65.0, status: 'pending', country: 'BJ' },
    { userId: buyer2, docType: 'passport', docUrl: 'https://afribayit.com/kyc/buyer2-passport.jpg', ocrValid: true, aiScore: 95.0, status: 'human_validated', country: 'CI' },
    { userId: buyer2, docType: 'selfie', docUrl: 'https://afribayit.com/kyc/buyer2-selfie.jpg', ocrValid: false, aiScore: 42.0, status: 'rejected', rejectionReason: 'Photo floue, veuillez soumettre une nouvelle photo.', country: 'CI' },
    { userId: agentBJ, docType: 'agent_license', docUrl: 'https://afribayit.com/kyc/agent-bj-license.pdf', ocrValid: true, aiScore: 97.0, status: 'human_validated', country: 'BJ' },
    { userId: geometerUser, docType: 'geometer_license', docUrl: 'https://afribayit.com/kyc/geometer-license.pdf', ocrValid: true, aiScore: 96.5, status: 'human_validated', country: 'BJ' },
    { userId: notaryUser, docType: 'notary_license', docUrl: 'https://afribayit.com/kyc/notary-license.pdf', ocrValid: true, aiScore: 98.0, status: 'human_validated', country: 'BJ' },
  ];

  for (const kd of kycDefs) {
    await prisma.kycDocument.create({ data: kd });
  }
  console.log(`  ✓ Created ${kycDefs.length} KYC documents`);

  // ═══════════════════════════════════════════════════════════════════════
  // 19. AGENT LISTINGS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating agent listings...');

  const listingDefs = [
    { agentId: agentBJ, propertyId: propertyIds[0], status: 'active', boostLevel: 2.5, views: 1240, contacts: 35 },
    { agentId: agentBJ, propertyId: propertyIds[1], status: 'active', boostLevel: 1.5, views: 890, contacts: 18 },
    { agentId: agentBJ, propertyId: propertyIds[2], status: 'active', boostLevel: 1.0, views: 560, contacts: 22 },
    { agentId: agentCI, propertyId: propertyIds[5], status: 'active', boostLevel: 4.0, views: 2100, contacts: 52 },
    { agentId: agentCI, propertyId: propertyIds[6], status: 'active', boostLevel: 4.0, views: 3500, contacts: 89 },
    { agentId: agentTG, propertyId: propertyIds[10], status: 'active', boostLevel: 2.5, views: 1800, contacts: 65 },
    { agentId: agentTG, propertyId: propertyIds[11], status: 'active', boostLevel: 1.0, views: 340, contacts: 12 },
  ];

  for (const ld of listingDefs) {
    await prisma.agentListing.create({ data: ld as any });
  }
  console.log(`  ✓ Created ${listingDefs.length} agent listings`);

  // ═══════════════════════════════════════════════════════════════════════
  // 20. FAVORITES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating favorites...');

  const favDefs = [
    { userId: buyer1, propertyId: propertyIds[0] },
    { userId: buyer1, propertyId: propertyIds[5] },
    { userId: buyer1, propertyId: propertyIds[10] },
    { userId: buyer2, propertyId: propertyIds[0] },
    { userId: buyer2, propertyId: propertyIds[5] },
    { userId: buyer2, propertyId: propertyIds[11] },
  ];

  for (const fd of favDefs) {
    await prisma.favorite.create({ data: fd });
  }
  console.log(`  ✓ Created ${favDefs.length} favorites`);

  // ═══════════════════════════════════════════════════════════════════════
  // 21. CONVERSATIONS + MESSAGES
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n→ Creating conversations and messages...');

  const conv1 = await prisma.conversation.create({
    data: {
      type: 'rebecca',
      status: 'active',
      metadata: '{"context":"property_search","propertyType":"appartement","city":"Cotonou"}',
    },
  });

  await prisma.conversationParticipant.create({ data: { conversationId: conv1.id, userId: buyer1, role: 'admin' } });

  await prisma.chatMessage.create({ data: { conversationId: conv1.id, senderId: buyer1, content: 'Bonjour Rebecca, je cherche un appartement T3 à Cotonou, budget 80M XOF.', messageType: 'text' } });
  await prisma.chatMessage.create({ data: { conversationId: conv1.id, senderId: admin1, content: 'Bonjour ! J\'ai trouvé 3 appartements correspondant à vos critères à Cotonou. Laissez-moi vous les présenter.', messageType: 'text', isRead: true } });
  await prisma.chatMessage.create({ data: { conversationId: conv1.id, senderId: admin1, content: 'Appartement T3 Haie Vive — 35M XOF/location', messageType: 'property_card', metadata: `{"propertyId":"${propertyIds[1]}","price":350000,"type":"appartement"}`, isRead: true } });

  const conv2 = await prisma.conversation.create({
    data: {
      type: 'user_to_user',
      status: 'active',
    },
  });

  await prisma.conversationParticipant.create({ data: { conversationId: conv2.id, userId: buyer2, role: 'participant' } });
  await prisma.conversationParticipant.create({ data: { conversationId: conv2.id, userId: agentCI, role: 'participant' } });

  await prisma.chatMessage.create({ data: { conversationId: conv2.id, senderId: buyer2, content: 'Bonjour, je suis intéressée par l\'appartement Standing Cocody. Est-il toujours disponible ?' } });
  await prisma.chatMessage.create({ data: { conversationId: conv2.id, senderId: agentCI, content: 'Bonjour Marie ! Oui, l\'appartement est toujours disponible. Quand souhaitez-vous le visiter ?', isRead: true } });

  console.log(`  ✓ Created 2 conversations with messages`);

  // ═══════════════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  Users:          ${USERS.length}`);
  console.log(`  Notaries:       5`); // 2 BJ + 1 BF + 1 CI + 1 TG
  console.log(`  Geometers:      4`); // 3 (BJ, CI, TG) + 1 BF
  console.log(`  Artisans:       ${artisanIds.length}`);
  console.log(`  Properties:     ${propertyIds.length}`);
  console.log(`  Transactions:   ${txDefs.length}`);
  console.log(`  Hotels:         ${hotelIds.length}`);
  console.log(`  Guesthouses:    ${ghIds.length}`);
  console.log(`  Courses:        ${courseIds.length}`);
  console.log(`  Posts:          ${postIds.length}`);
  console.log(`  Groups:         ${groupIds.length}`);
  console.log(`  Events:         ${eventDefs.length}`);
  console.log(`  Notifications:  ${notifDefs.length}`);
  console.log(`  Reviews:        ${reviewDefs.length}`);
  console.log(`  Subscriptions:  ${subDefs.length}`);
  console.log(`  Prof. Profiles: ${profileIds.length}`);
  console.log(`  Wallet Txns:    ${walletTxDefs.length}`);
  console.log(`  KYC Docs:       ${kycDefs.length}`);
  console.log(`  Agent Listings: ${listingDefs.length}`);
  console.log(`  Favorites:      ${favDefs.length}`);
  console.log(`  Conversations:  2`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
