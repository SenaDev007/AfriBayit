// AfriBayit — Production Seed Script
// Seeds ALL modules with comprehensive test data for Neon PostgreSQL
// Usage: npx tsx scripts/seed-production.ts

// Ensure DATABASE_URL is set for PostgreSQL
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_VPlSR7Z9UiYD@ep-polished-glitter-agic460a-pooler.c-2.eu-central-1.aws.neon.tech/AfriBayit?sslmode=require';
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

async function main() {
  console.log('🌱 AfriBayit Production Seed — Starting...\n');

  // ─── Get existing users ───────────────────────────────
  const users = await prisma.user.findMany();
  const agents = users.filter(u => u.role === 'agent');
  const buyers = users.filter(u => u.role === 'buyer');
  const admins = users.filter(u => u.role === 'admin');

  console.log(`Found ${users.length} users, ${agents.length} agents, ${buyers.length} buyers, ${admins.length} admins`);

  // ─── 1. SHORT-TERM RENTALS ────────────────────────────
  console.log('\n🏠 Seeding Short-Term Rentals...');
  const existingSTR = await prisma.shortTermRental.count();
  if (existingSTR === 0) {
    const strData = [
      { title: 'Appartement moderne Haie Vive', type: 'appartement', city: 'Cotonou', country: 'BJ', quartier: 'Haie Vive', description: 'Bel appartement meublé 2 chambres avec climatisation et WiFi. Vue sur jardin, parking sécurisé.', pricePerNight: 25000, surface: 75, rooms: 3, bedrooms: 2, bathrooms: 1, lat: 6.3703, lng: 2.3912, maxGuests: 4, checkInTime: '14:00', checkOutTime: '11:00', amenities: '["WiFi","Climatisation","Parking","Cuisine équipée","TV"]', houseRules: '["Non-fumeur","Pas d\'animaux","Pas de fête"]', agentId: agents[0]?.id || '', country_code: 'BJ', rating: 4.8, reviewCount: 12, status: 'published' },
      { title: 'Studio Cocody Riviera', type: 'studio', city: 'Abidjan', country: 'CI', quartier: 'Cocody Riviera', description: 'Studio entièrement meublé dans le quartier résidentiel de Cocody. Proche des commerces et restaurants.', pricePerNight: 20000, surface: 35, rooms: 1, bedrooms: 1, bathrooms: 1, lat: 5.3600, lng: -3.9400, maxGuests: 2, checkInTime: '15:00', checkOutTime: '12:00', amenities: '["WiFi","Piscine","Climatisation","Kitchenette"]', houseRules: '["Non-fumeur","Pas de bruit après 22h"]', agentId: agents[1]?.id || '', country_code: 'CI', rating: 4.6, reviewCount: 8, status: 'published' },
      { title: 'Villa plage Lomé', type: 'villa', city: 'Lomé', country: 'TG', quartier: 'Avenou', description: 'Magnifique villa face à la mer avec jardin tropical. 3 chambres, grande terrasse, cuisine extérieure.', pricePerNight: 45000, surface: 180, rooms: 5, bedrooms: 3, bathrooms: 2, lat: 6.1319, lng: 1.2228, maxGuests: 8, checkInTime: '14:00', checkOutTime: '11:00', amenities: '["WiFi","Vue mer","Jardin","Parking","Climatisation","Cuisine équipée","Barbecue"]', houseRules: '["Animaux acceptés","Fêtes autorisées avec modération"]', agentId: agents[2]?.id || '', country_code: 'TG', rating: 4.9, reviewCount: 15, status: 'published' },
      { title: 'Chambre Ouaga 2000', type: 'chambre', city: 'Ouagadougou', country: 'BF', quartier: 'Ouaga 2000', description: 'Chambre climatisée dans quartier calme et sécurisé. Petit-déjeuner inclus.', pricePerNight: 10000, surface: 20, rooms: 1, bedrooms: 1, bathrooms: 1, lat: 12.3316, lng: -1.5168, maxGuests: 2, checkInTime: '12:00', checkOutTime: '10:00', amenities: '["WiFi","Climatisation","Petit-déjeuner","Cuisine commune"]', houseRules: '["Non-fumeur"]', agentId: agents.find(a => a.country === 'BF')?.id || agents[0]?.id || '', country_code: 'BF', rating: 4.3, reviewCount: 5, status: 'published' },
      { title: 'Appartement Fidjrossè plage', type: 'appartement', city: 'Cotonou', country: 'BJ', quartier: 'Fidjrossè', description: 'Appartement 3 pièces à 100m de la plage de Fidjrossè. Terrasse avec vue.', pricePerNight: 30000, surface: 90, rooms: 3, bedrooms: 2, bathrooms: 1, lat: 6.3444, lng: 2.4083, maxGuests: 5, checkInTime: '14:00', checkOutTime: '11:00', amenities: '["WiFi","Vue mer","Climatisation","Parking","Cuisine"]', houseRules: '["Non-fumeur","Pas d\'animaux"]', agentId: agents[0]?.id || '', country_code: 'BJ', rating: 4.7, reviewCount: 10, status: 'published' },
      { title: 'Penthouse Plateau Abidjan', type: 'appartement', city: 'Abidjan', country: 'CI', quartier: 'Le Plateau', description: 'Penthouse luxueux au cœur du quartier des affaires. Vue panoramique, finitions haut de gamme.', pricePerNight: 75000, surface: 150, rooms: 4, bedrooms: 3, bathrooms: 2, lat: 5.3364, lng: -4.0267, maxGuests: 6, checkInTime: '15:00', checkOutTime: '12:00', amenities: '["WiFi","Vue panoramique","Conciergerie","Piscine","Gym","Climatisation","Parking"]', houseRules: '["Non-fumeur","Pas de fête","Silence après 22h"]', agentId: agents[1]?.id || '', country_code: 'CI', rating: 4.9, reviewCount: 6, status: 'published' },
    ];

    for (const s of strData) {
      try {
        const rental = await prisma.shortTermRental.create({ data: s as any });
        for (let d = 0; d < 90; d += 3) {
          await prisma.shortTermRentalAvailability.create({
            data: {
              rentalId: rental.id,
              date: daysFromNow(d),
              isAvailable: Math.random() > 0.2,
              priceOverride: d > 60 ? Math.round(s.pricePerNight * 0.8) : null,
            } as any,
          });
        }
        await prisma.shortTermRentalPricingRule.create({
          data: { rentalId: rental.id, name: 'Haute saison (Décembre-Janvier)', factor: 1.3, startDate: daysFromNow(180), endDate: daysFromNow(240) } as any,
        });
        await prisma.shortTermRentalPricingRule.create({
          data: { rentalId: rental.id, name: 'Long séjour (7+ nuits)', factor: 0.85, minNights: 7 } as any,
        });
      } catch (e: any) {
        console.log(`  ⚠️ STR "${s.title}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${strData.length} short-term rentals with availability & pricing`);
  } else {
    console.log(`  ℹ️ Already have ${existingSTR} short-term rentals, skipping`);
  }

  // ─── 2. ARTISANS & SERVICES ───────────────────────────
  console.log('\n🔨 Seeding Artisans & Services...');
  const existingArtisans = await prisma.artisan.count();
  if (existingArtisans === 0) {
    const artisanDefs = [
      { trade: 'Maçonnerie', city: 'Cotonou', country: 'BJ', specialities: '["Maçonnerie","Béton armé","Construction villa"]', experienceYears: 12, dailyRate: 15000, available: true, emergencyAvailable: true, rating: 4.8, reviewCount: 23, missionsCompleted: 45, verified: true, certified: true, certificationLevel: 'expert', zone: 'Cotonou et environs', lat: 6.3703, lng: 2.3912, description: 'Maçon expert avec 12 ans d\'expérience. Spécialiste construction de villas.' },
      { trade: 'Électricité', city: 'Abidjan', country: 'CI', specialities: '["Électricité bâtiment","Domotique","Installation solaire"]', experienceYears: 8, dailyRate: 18000, available: true, emergencyAvailable: true, rating: 4.6, reviewCount: 15, missionsCompleted: 30, verified: true, certified: true, certificationLevel: 'standard', zone: 'Abidjan et banlieue', lat: 5.3600, lng: -3.9400, description: 'Électricien qualifié, installation neuve et rénovation.' },
      { trade: 'Plomberie', city: 'Ouagadougou', country: 'BF', specialities: '["Plomberie","Sanitaire","Installation eau"]', experienceYears: 10, dailyRate: 12000, available: true, emergencyAvailable: true, rating: 4.5, reviewCount: 18, missionsCompleted: 35, verified: true, certified: true, certificationLevel: 'standard', zone: 'Ouagadougou', lat: 12.3316, lng: -1.5168, description: 'Plombier professionnel, installation et réparation.' },
      { trade: 'Carrelage', city: 'Cotonou', country: 'BJ', specialities: '["Carrelage","Faïence","Mosaïque"]', experienceYears: 7, dailyRate: 14000, available: true, emergencyAvailable: false, rating: 4.7, reviewCount: 20, missionsCompleted: 40, verified: true, certified: true, certificationLevel: 'expert', zone: 'Cotonou, Porto-Novo', lat: 6.3703, lng: 2.3912, description: 'Carreleur expert, pose de carrelage intérieur et extérieur.' },
      { trade: 'Peinture', city: 'Lomé', country: 'TG', specialities: '["Peinture intérieure","Peinture extérieure","Décoration murale"]', experienceYears: 9, dailyRate: 10000, available: true, emergencyAvailable: false, rating: 4.4, reviewCount: 12, missionsCompleted: 25, verified: true, certified: true, certificationLevel: 'standard', zone: 'Lomé et maritime', lat: 6.1319, lng: 1.2228, description: 'Peintre professionnel, finitions soignées.' },
      { trade: 'Menuiserie', city: 'Abidjan', country: 'CI', specialities: '["Menuiserie bois","Placards","Cuisines sur mesure"]', experienceYears: 15, dailyRate: 20000, available: true, emergencyAvailable: false, rating: 4.9, reviewCount: 30, missionsCompleted: 60, verified: true, certified: true, certificationLevel: 'elite', zone: 'Abidjan et Bingerville', lat: 5.3600, lng: -3.9400, description: 'Menuisier artisan d\'excellence, cuisines et placards sur mesure.' },
      { trade: 'Climatisation', city: 'Cotonou', country: 'BJ', specialities: '["Climatisation","Ventilation","Maintenance HVAC"]', experienceYears: 6, dailyRate: 16000, available: true, emergencyAvailable: true, rating: 4.6, reviewCount: 14, missionsCompleted: 28, verified: true, certified: true, certificationLevel: 'standard', zone: 'Cotonou', lat: 6.3703, lng: 2.3912, description: 'Climaticien certifié, installation et maintenance.' },
      { trade: 'Paysagisme', city: 'Abidjan', country: 'CI', specialities: '["Paysagisme","Jardin","Éclairage extérieur"]', experienceYears: 11, dailyRate: 22000, available: true, emergencyAvailable: false, rating: 4.8, reviewCount: 16, missionsCompleted: 32, verified: true, certified: true, certificationLevel: 'expert', zone: 'Abidjan, Bassam', lat: 5.3600, lng: -3.9400, description: 'Paysagiste créatif, jardins tropicaux, aménagement extérieur.' },
    ];

    const artisanIds: string[] = [];
    for (const ad of artisanDefs) {
      // Find existing artisan user or create one
      let userId = users.find(u => u.role === 'artisan' && u.country === ad.country)?.id;
      if (!userId) {
        const newUser = await prisma.user.create({
          data: {
            email: `${ad.trade.toLowerCase().replace(/[^a-z]/g, '')}.${ad.country.toLowerCase()}@afribayit.com`,
            name: `${ad.trade} Expert ${ad.city}`,
            firstName: ad.trade,
            lastName: 'Expert',
            role: 'artisan',
            country: ad.country,
            city: ad.city,
            kycLevel: 1,
            score: 300,
            reputation: 'Expert',
            verified: true,
            afriPoints: 500,
            credibilityScore: 75,
            preferredLanguage: 'fr',
            currency: 'XOF',
          },
        });
        userId = newUser.id;
      }
      try {
        const artisan = await prisma.artisan.create({
          data: { ...ad, userId, kybStatus: 'approved' } as any,
        });
        artisanIds.push(artisan.id);
        const serviceNames = JSON.parse(ad.specialities || '[]') as string[];
        for (const sn of serviceNames) {
          await prisma.artisanService.create({
            data: { artisanId: artisan.id, name: sn, description: `Service professionnel de ${sn.toLowerCase()}.`, category: ad.trade, priceEstimate: ad.dailyRate * 5, unit: 'forfait' } as any,
          });
        }
      } catch (e: any) {
        console.log(`  ⚠️ Artisan "${ad.trade} ${ad.city}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${artisanIds.length} artisans with services`);
  } else {
    console.log(`  ℹ️ Already have ${existingArtisans} artisans, skipping`);
  }

  // ─── 3. NOTARIES ──────────────────────────────────────
  console.log('\n⚖️ Seeding Notaries...');
  const existingNotaries = await prisma.notary.count();
  if (existingNotaries === 0) {
    const notaryDefs = [
      { licenseNumber: 'NOT-BJ-2025-001', chamberName: 'Chambre Nationale des Notaires du Bénin', specialty: 'Vente immobilière', certificationLevel: 'expert', zone: 'Cotonou', country: 'BJ', available: true, rating: 4.9, reviewCount: 25, missions: 48, subscriptionTier: 'elite', conventionSigned: true, certified: true, certifiedAt: daysAgo(180) },
      { licenseNumber: 'NOT-CI-2025-001', chamberName: 'Chambre Nationale des Notaires de Côte d\'Ivoire', specialty: 'Succession', certificationLevel: 'expert', zone: 'Abidjan', country: 'CI', available: true, rating: 4.7, reviewCount: 18, missions: 35, subscriptionTier: 'avance', conventionSigned: true, certified: true, certifiedAt: daysAgo(120) },
      { licenseNumber: 'NOT-TG-2025-001', chamberName: 'Ordre des Notaires du Togo', specialty: 'Bail commercial', certificationLevel: 'standard', zone: 'Lomé', country: 'TG', available: true, rating: 4.5, reviewCount: 10, missions: 15, subscriptionTier: 'essentiel', conventionSigned: true, certified: true, certifiedAt: daysAgo(90) },
      { licenseNumber: 'NOT-BF-2025-001', chamberName: 'Chambre des Notaires du Burkina', specialty: 'Foncier rural', certificationLevel: 'standard', zone: 'Ouagadougou', country: 'BF', available: true, rating: 4.3, reviewCount: 8, missions: 12, subscriptionTier: 'essentiel', conventionSigned: true, certified: true, certifiedAt: daysAgo(60) },
      { licenseNumber: 'NOT-BJ-2025-002', chamberName: 'Chambre Nationale des Notaires du Bénin', specialty: 'Donation', certificationLevel: 'senior', zone: 'Porto-Novo', country: 'BJ', available: true, rating: 4.6, reviewCount: 14, missions: 22, subscriptionTier: 'avance', conventionSigned: true, certified: true, certifiedAt: daysAgo(150) },
    ];

    for (const nd of notaryDefs) {
      let notaryUser = users.find(u => u.role === 'notary' && u.country === nd.country);
      if (!notaryUser) {
        notaryUser = await prisma.user.create({
          data: { email: `notaire.${nd.country.toLowerCase()}@afribayit.com`, name: `Me. Notaire ${nd.zone}`, firstName: 'Me.', lastName: 'Notaire', role: 'notary', country: nd.country, city: nd.zone, kycLevel: 2, score: 500, reputation: 'Expert', verified: true, afriPoints: 800, credibilityScore: 85, preferredLanguage: 'fr', currency: 'XOF' },
        });
      }
      try {
        await prisma.notary.create({ data: { ...nd, userId: notaryUser.id } as any });
      } catch (e: any) {
        console.log(`  ⚠️ Notary "${nd.licenseNumber}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${notaryDefs.length} notaries`);
  } else {
    console.log(`  ℹ️ Already have ${existingNotaries} notaries, skipping`);
  }

  // ─── 4. GEOMETERS (GeoTrust) ──────────────────────────
  console.log('\n📐 Seeding Geometers...');
  const existingGeometers = await prisma.geometer.count();
  if (existingGeometers === 0) {
    const geometerDefs = [
      { licenseNumber: 'GEO-BJ-2025-001', specialities: '["Bornage","Topographie","GPS"]', certificationLevel: 'expert', zone: 'Cotonou et environs', city: 'Cotonou', country: 'BJ', available: true, rating: 4.9, reviewCount: 20, missions: 35, lat: 6.3703, lng: 2.3912, certified: true, certifiedAt: daysAgo(200) },
      { licenseNumber: 'GEO-CI-2025-001', specialities: '["Drone","3D","Inspection"]', certificationLevel: 'elite', zone: 'Abidjan', city: 'Abidjan', country: 'CI', available: true, rating: 4.8, reviewCount: 15, missions: 28, lat: 5.3600, lng: -3.9400, certified: true, certifiedAt: daysAgo(180) },
      { licenseNumber: 'GEO-TG-2025-001', specialities: '["Bornage","Superficie","GPS"]', certificationLevel: 'standard', zone: 'Lomé et maritime', city: 'Lomé', country: 'TG', available: true, rating: 4.5, reviewCount: 8, missions: 12, lat: 6.1319, lng: 1.2228, certified: true, certifiedAt: daysAgo(90) },
      { licenseNumber: 'GEO-BF-2025-001', specialities: '["Topographie","Cadastre"]', certificationLevel: 'standard', zone: 'Ouagadougou', city: 'Ouagadougou', country: 'BF', available: true, rating: 4.4, reviewCount: 6, missions: 10, lat: 12.3316, lng: -1.5168, certified: true, certifiedAt: daysAgo(60) },
    ];

    for (const gd of geometerDefs) {
      let geoUser = users.find(u => u.role === 'geometer' && u.country === gd.country);
      if (!geoUser) {
        geoUser = await prisma.user.create({
          data: { email: `geometre.${gd.country.toLowerCase()}@afribayit.com`, name: `Géomètre ${gd.city}`, firstName: 'Géomètre', lastName: gd.city, role: 'geometer', country: gd.country, city: gd.city, kycLevel: 2, score: 400, reputation: 'Acteur', verified: true, afriPoints: 600, credibilityScore: 80, preferredLanguage: 'fr', currency: 'XOF' },
        });
      }
      try {
        await prisma.geometer.create({ data: { ...gd, userId: geoUser.id } as any });
      } catch (e: any) {
        console.log(`  ⚠️ Geometer "${gd.licenseNumber}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${geometerDefs.length} geometers`);
  } else {
    console.log(`  ℹ️ Already have ${existingGeometers} geometers, skipping`);
  }

  // ─── 5. COURSES (Academy) ─────────────────────────────
  console.log('\n🎓 Seeding Academy Courses...');
  const existingCourses = await prisma.course.count();
  if (existingCourses < 5) {
    const courseDefs = [
      { title: 'Investissement Immobilier en Afrique de l\'Ouest', description: 'Apprenez à évaluer la rentabilité d\'un investissement immobilier. Calcul ROI, fiscalité, financement bancaire.', category: 'Investissement', level: 'Intermédiaire', durationHours: 12, priceXof: 45000, instructorName: 'Dr. Kofi Mensah', country: 'BJ', language: 'fr', published: true, enrollmentCount: 156, rating: 4.8, reviewCount: 42 },
      { title: 'Droit Foncier Béninois — Code 2023', description: 'Maîtrisez la réforme foncière béninoise de 2023. Titres fonciers, ACD, procédures ANDF.', category: 'Droit foncier', level: 'Avancé', durationHours: 8, priceXof: 35000, instructorName: 'Me. Florent Agboka', country: 'BJ', language: 'fr', published: true, enrollmentCount: 89, rating: 4.9, reviewCount: 28 },
      { title: 'Devenir Agent Immobilier Certifié', description: 'Formation complète pour la certification AfriBayit. Prospection, négociation, éthique.', category: 'Techniques de vente', level: 'Débutant', durationHours: 16, priceXof: 25000, instructorName: 'Fatou Koné', country: 'CI', language: 'fr', published: true, enrollmentCount: 234, rating: 4.7, reviewCount: 56 },
      { title: 'Gérer une Guesthouse en Afrique', description: 'De la certification à la gestion quotidienne. Tarification, personnel, qualité, fidélisation.', category: 'Gestion locative', level: 'Intermédiaire', durationHours: 10, priceXof: 30000, instructorName: 'Aminata Traoré', country: 'TG', language: 'fr', published: true, enrollmentCount: 67, rating: 4.6, reviewCount: 18 },
      { title: 'BTP & Rénovation — Guide du Propriétaire', description: 'Comprendre les travaux. Choisir un artisan, lire des plans, estimer un budget. Gratuit.', category: 'BTP & Rénovation', level: 'Débutant', durationHours: 6, priceXof: 0, instructorName: 'AfriBayit Academy', country: 'BJ', language: 'fr', published: true, enrollmentCount: 312, rating: 4.5, reviewCount: 78 },
      { title: 'Négociation Immobilière Avancée', description: 'Techniques de négociation avancées. Psychologie de l\'acheteur, closing.', category: 'Techniques de vente', level: 'Avancé', durationHours: 8, priceXof: 55000, instructorName: 'Hervé Houénou', country: 'BJ', language: 'fr', published: true, enrollmentCount: 45, rating: 4.8, reviewCount: 12 },
      { title: 'Droit Foncier Ivoirien — Réformes 2025', description: 'Lettre d\'attribution, ACD, certificat de propriété. Les réformes récentes expliquées.', category: 'Droit foncier', level: 'Avancé', durationHours: 8, priceXof: 35000, instructorName: 'Me. Aimée Diallo', country: 'CI', language: 'fr', published: true, enrollmentCount: 56, rating: 4.7, reviewCount: 15 },
      { title: 'Introduction à l\'Immobilier Africain', description: 'Découvrez l\'écosystème immobilier en Afrique de l\'Ouest. Cours gratuit.', category: 'Découverte', level: 'Débutant', durationHours: 3, priceXof: 0, instructorName: 'AfriBayit Academy', country: 'BJ', language: 'fr', published: true, enrollmentCount: 520, rating: 4.4, reviewCount: 98 },
    ];

    for (const cd of courseDefs) {
      const instructor = agents.find(a => a.country === cd.country) || agents[0];
      try {
        const course = await prisma.course.create({
          data: { ...cd, instructorId: instructor?.id || '', modules: cd.durationHours > 6 ? 4 : 2 } as any,
        });
        await prisma.quiz.create({
          data: {
            courseId: course.id,
            title: `Quiz : ${cd.title}`,
            questions: JSON.stringify([
              { question: 'Quelle est la principale caractéristique du marché immobilier africain ?', options: ['Forte volatilité', 'Croissance rapide', 'Stagnation', 'Déclin'], correct: 1 },
              { question: 'Quel document est obligatoire pour une vente immobilière au Bénin ?', options: ['Permis de construire', 'Titre foncier ou ACD', 'Certificat de conformité', 'Attestation de vente'], correct: 1 },
              { question: 'Quel est le rôle du notaire dans une transaction ?', options: ['Conseiller fiscal', 'Authentifier l\'acte de vente', 'Évaluer le bien', 'Financer l\'achat'], correct: 1 },
            ]),
            passingScore: 60,
            timeLimitMinutes: 15,
          } as any,
        });
        for (let i = 0; i < Math.min(5, buyers.length); i++) {
          try {
            await prisma.courseEnrollment.create({
              data: { courseId: course.id, userId: buyers[i]?.id || '', progress: Math.round(Math.random() * 100), status: Math.random() > 0.5 ? 'completed' : 'in_progress' } as any,
            });
          } catch {}
        }
      } catch (e: any) {
        console.log(`  ⚠️ Course "${cd.title}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${courseDefs.length} courses with quizzes and enrollments`);
  } else {
    console.log(`  ℹ️ Already have ${existingCourses} courses, skipping`);
  }

  // ─── 6. COMMUNITY ─────────────────────────────────────
  console.log('\n👥 Seeding Community...');
  const existingPosts = await prisma.communityPost.count();
  if (existingPosts === 0) {
    const postData = [
      { title: 'Meilleur quartier pour investir à Cotonou en 2025 ?', content: 'Je cherche des conseils pour un premier investissement immobilier à Cotonou. Budget 30-50M FCFA.', category: 'Investissement', country: 'BJ', city: 'Cotonou', views: 234, replies: 8 },
      { title: 'Réforme foncière Bénin : impact sur les transactions', content: 'La réforme foncière de 2023 change la donne. Le notaire devient obligatoire.', category: 'Juridique', country: 'BJ', city: 'Cotonou', views: 456, replies: 15 },
      { title: 'Retour d\'expérience achat villa Abidjan Cocody', content: 'Je viens d\'acheter une villa 4 chambres à Cocody via AfriBayit. Processus escrow très sécurisé.', category: 'Témoignage', country: 'CI', city: 'Abidjan', views: 189, replies: 12 },
      { title: 'Comment choisir un artisan BTP fiable ?', content: 'Les arnaques sont fréquentes dans le BTP. Comment vérifier les compétences d\'un artisan ?', category: 'BTP', country: 'BJ', city: 'Cotonou', views: 567, replies: 22 },
      { title: 'Marché immobilier Lomé : tendances 2025', content: 'Analyse du marché immobilier à Lomé. Les prix montent dans le quartier administratif.', category: 'Marché', country: 'TG', city: 'Lomé', views: 123, replies: 6 },
      { title: 'Location courte durée vs location classique à Ouaga', content: 'Comparatif entre location courte durée et location classique à Ouagadougou.', category: 'Location', country: 'BF', city: 'Ouagadougou', views: 98, replies: 5 },
    ];

    for (const pd of postData) {
      const author = users.find(u => u.country === pd.country && u.role !== 'admin') || users[0];
      try {
        await prisma.communityPost.create({ data: { ...pd, authorId: author?.id || '', pinned: false, locked: false } as any });
      } catch (e: any) {
        console.log(`  ⚠️ Post "${pd.title}": ${e.message?.substring(0, 80)}`);
      }
    }

    const groupData = [
      { name: 'Investisseurs Cotonou', description: 'Réseau d\'investisseurs immobiliers actifs au Bénin', category: 'Investissement', country: 'BJ', city: 'Cotonou', privacy: 'public', memberCount: 142 },
      { name: 'Club Immobilier Abidjan', description: 'Échanges et opportunités en Côte d\'Ivoire', category: 'Investissement', country: 'CI', city: 'Abidjan', privacy: 'private', memberCount: 89 },
      { name: 'Femmes & Immobilier Afrique', description: 'Réseau dédié aux femmes investisseurs', category: 'Networking', country: 'BJ', city: 'Cotonou', privacy: 'public', memberCount: 67 },
      { name: 'Agents Certifiés AfriBayit', description: 'Espace d\'entraide entre agents certifiés', category: 'Professionnel', country: 'BJ', city: 'Cotonou', privacy: 'private', memberCount: 45 },
    ];

    for (const gd of groupData) {
      const creator = users.find(u => u.country === gd.country && u.role === 'agent') || users[0];
      try {
        await prisma.communityGroup.create({ data: { ...gd, creatorId: creator?.id || '' } as any });
      } catch (e: any) {
        console.log(`  ⚠️ Group "${gd.name}": ${e.message?.substring(0, 80)}`);
      }
    }

    const eventData = [
      { title: 'AfriBayit Summit Bénin — Juin 2025', description: 'Webinaire mensuel : analyse du marché immobilier béninois.', type: 'summit', format: 'online', country: 'BJ', city: 'Cotonou', startDate: daysFromNow(15), endDate: daysFromNow(15), maxAttendees: 200, currentAttendees: 87, isFree: true },
      { title: 'Networking Immobilier Abidjan', description: 'Rencontre physique trimestrielle. Hôtel Azalai.', type: 'networking', format: 'in_person', country: 'CI', city: 'Abidjan', startDate: daysFromNow(30), endDate: daysFromNow(30), maxAttendees: 100, currentAttendees: 45, isFree: false, priceXof: 5000 },
      { title: 'Journée Portes Ouvertes Virtuelles', description: 'Visite virtuelle simultanée de 10 biens AfriBayit.', type: 'portes_ouvertes', format: 'online', country: 'BJ', city: 'Cotonou', startDate: daysFromNow(7), endDate: daysFromNow(7), maxAttendees: 500, currentAttendees: 156, isFree: true },
      { title: 'Formation : Droit Foncier au Togo', description: 'Webinaire gratuit. Code foncier 2018, réformes 2025.', type: 'formation', format: 'online', country: 'TG', city: 'Lomé', startDate: daysFromNow(20), endDate: daysFromNow(20), maxAttendees: 300, currentAttendees: 67, isFree: true },
    ];

    for (const ed of eventData) {
      const organizer = users.find(u => u.country === ed.country && u.role === 'admin') || admins[0];
      try {
        await prisma.communityEvent.create({ data: { ...ed, organizerId: organizer?.id || '' } as any });
      } catch (e: any) {
        console.log(`  ⚠️ Event "${ed.title}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${postData.length} posts, ${groupData.length} groups, ${eventData.length} events`);
  } else {
    console.log(`  ℹ️ Already have ${existingPosts} community posts, skipping`);
  }

  // ─── 7. PROFESSIONAL PROFILES ─────────────────────────
  console.log('\n👔 Seeding Professional Profiles...');
  const existingProfiles = await prisma.professionalProfile.count();
  if (existingProfiles === 0) {
    const proUsers = users.filter(u => u.role === 'agent' || u.role === 'artisan' || u.role === 'notary' || u.role === 'geometer');
    for (const user of proUsers.slice(0, 10)) {
      try {
        await prisma.professionalProfile.create({
          data: {
            userId: user.id,
            slug: user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            headline: `${user.role === 'agent' ? 'Agent immobilier certifié' : user.role === 'artisan' ? 'Artisan BTP certifié' : user.role === 'notary' ? 'Notaire certifié' : 'Géomètre certifié'} — ${user.city}`,
            bio: user.bio || `Professionnel certifié AfriBayit basé à ${user.city}, ${user.country}.`,
            specialities: user.specialties || '[]',
            languages: '["Français"]',
            availability: 'available',
            credibilityScore: user.credibilityScore || 75,
            completenessPct: 80,
            experience: '[]',
            education: '[]',
            certifications: '[]',
            portfolio: '[]',
            country: user.country || 'BJ',
            zone: user.city || 'Cotonou',
            isPublic: true,
          } as any,
        });
      } catch (e: any) {
        console.log(`  ⚠️ Profile for "${user.name}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created professional profiles`);
  } else {
    console.log(`  ℹ️ Already have ${existingProfiles} profiles, skipping`);
  }

  // ─── 8. HOTELS ────────────────────────────────────────
  console.log('\n🏨 Seeding Hotels...');
  const existingHotels = await prisma.hotel.count();
  if (existingHotels < 3) {
    const hotelDefs = [
      { name: 'Hôtel du Lac Cotonou', starRating: 4, city: 'Cotonou', country: 'BJ', quartier: 'Ganhi', description: 'Hôtel 4 étoiles au bord du lac Nokoué.', address: 'Boulevard de la Marina', lat: 6.3556, lng: 2.4306, phone: '+229 21 30 00 00', email: 'info@hoteldulac.bj', checkinTime: '14:00', checkoutTime: '12:00', cancellationPolicy: 'flexible', amenities: '["Piscine","Restaurant","WiFi","Parking"]', level: 'direct', rating: 4.5, reviewCount: 128, totalRooms: 85, status: 'published' },
      { name: 'Azalai Hôtel Abidjan', starRating: 4, city: 'Abidjan', country: 'CI', quartier: 'Le Plateau', description: 'Hôtel de référence à Abidjan. Vue sur la lagune.', address: 'Avenue Franchet d\'Espérey', lat: 5.3256, lng: -4.0200, phone: '+225 20 20 00 00', email: 'info@azalai.ci', checkinTime: '15:00', checkoutTime: '12:00', cancellationPolicy: 'moderate', amenities: '["Piscine","Restaurant","WiFi","Gym","Spa"]', level: 'ota', otaRefs: '{"booking_com": "123456"}', rating: 4.6, reviewCount: 256, totalRooms: 120, status: 'published' },
      { name: 'Hôtel Sarakawa Lomé', starRating: 3, city: 'Lomé', country: 'TG', quartier: 'Centre-ville', description: 'Hôtel emblématique de Lomé face à l\'océan.', address: 'Boulevard du Mono', lat: 6.1319, lng: 1.2228, phone: '+228 22 21 00 00', email: 'info@sarakawa.tg', checkinTime: '14:00', checkoutTime: '11:00', cancellationPolicy: 'flexible', amenities: '["Piscine","Restaurant","WiFi","Plage"]', level: 'direct', rating: 4.2, reviewCount: 85, totalRooms: 50, status: 'published' },
    ];

    for (const hd of hotelDefs) {
      const owner = users.find(u => u.country === hd.country && u.role === 'admin') || admins[0];
      try {
        await prisma.hotel.create({ data: { ...hd, ownerId: owner?.id || '' } as any });
      } catch (e: any) {
        console.log(`  ⚠️ Hotel "${hd.name}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created ${hotelDefs.length} hotels`);
  } else {
    console.log(`  ℹ️ Already have ${existingHotels} hotels, skipping`);
  }

  // ─── 9. TRANSACTIONS & ESCROW ─────────────────────────
  console.log('\n💰 Seeding Transactions & Escrow...');
  const existingTxns = await prisma.transaction.count();
  if (existingTxns === 0) {
    const properties = await prisma.property.findMany({ take: 5 });
    for (const prop of properties) {
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      if (!buyer) continue;
      try {
        const txn = await prisma.transaction.create({
          data: { propertyId: prop.id, buyerId: buyer.id, sellerId: prop.agentId, amount: prop.price, currency: 'XOF', status: 'FUNDED', type: prop.transaction === 'location' ? 'rental' : 'sale', commissionRate: 0.03, commissionAmount: Math.round(prop.price * 0.03) } as any,
        });
        await prisma.escrowAccount.create({
          data: { transactionId: txn.id, balance: prop.price, currency: 'XOF', status: 'FUNDED' } as any,
        });
      } catch (e: any) {
        console.log(`  ⚠️ Transaction for "${prop.title}": ${e.message?.substring(0, 80)}`);
      }
    }
    console.log(`  ✅ Created transactions & escrow accounts`);
  } else {
    console.log(`  ℹ️ Already have ${existingTxns} transactions, skipping`);
  }

  // ─── SUMMARY ──────────────────────────────────────────
  console.log('\n📊 Seed Summary:');
  const counts = {
    users: await prisma.user.count(),
    properties: await prisma.property.count(),
    shortTermRentals: await prisma.shortTermRental.count(),
    artisans: await prisma.artisan.count(),
    artisanServices: await prisma.artisanService.count(),
    notaries: await prisma.notary.count(),
    geometers: await prisma.geometer.count(),
    courses: await prisma.course.count(),
    quizzes: await prisma.quiz.count(),
    communityPosts: await prisma.communityPost.count(),
    communityGroups: await prisma.communityGroup.count(),
    communityEvents: await prisma.communityEvent.count(),
    hotels: await prisma.hotel.count(),
    transactions: await prisma.transaction.count(),
    professionalProfiles: await prisma.professionalProfile.count(),
  };
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\n✅ Production seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
