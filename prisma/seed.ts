import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌍 AfriBayit — Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@2025!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@afribayit.com" },
    update: {},
    create: {
      email: "admin@afribayit.com",
      name: "Admin AfriBayit",
      firstName: "Admin",
      lastName: "AfriBayit",
      password: adminPassword,
      userType: "ADMIN",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      isPremium: true,
      country: "BJ",
      city: "Cotonou",
    },
  });

  // Create sample seller
  const sellerPassword = await bcrypt.hash("Seller@2025!", 12);
  const seller = await prisma.user.upsert({
    where: { email: "stevens.akpovi@example.com" },
    update: {},
    create: {
      email: "stevens.akpovi@example.com",
      name: "Stevens T. AKPOVI",
      firstName: "Stevens",
      lastName: "AKPOVI",
      password: sellerPassword,
      userType: "SELLER",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      isPremium: true,
      country: "BJ",
      city: "Cotonou",
    },
  });

  // Create sample properties
  const properties = [
    {
      title: "Villa moderne 4 chambres avec piscine — Cocody, Abidjan",
      description: "Superbe villa contemporaine de 320m² dans le quartier résidentiel de Cocody. Architecture moderne avec grandes baies vitrées, piscine à débordement et jardin paysagé.",
      slug: "villa-moderne-4ch-cocody-abidjan",
      type: "VILLA" as const,
      listingType: "SALE" as const,
      status: "ACTIVE" as const,
      price: 75000000,
      currency: "XOF" as const,
      country: "CI" as const,
      city: "Abidjan",
      district: "Cocody",
      surface: 320,
      bedrooms: 4,
      bathrooms: 3,
      yearBuilt: 2021,
      hasPool: true,
      hasGarage: true,
      hasGarden: true,
      hasAC: true,
      hasSecurity: true,
      hasGenerator: true,
      hasWifi: true,
      investmentScore: 87,
      ownerId: seller.id,
    },
    {
      title: "Appartement T3 meublé — Haie Vive, Cotonou",
      description: "Appartement entièrement meublé de 90m² dans le quartier prisé de Haie Vive. Idéal pour familles ou professionnels.",
      slug: "appartement-t3-haie-vive-cotonou",
      type: "APARTMENT" as const,
      listingType: "LONG_TERM_RENTAL" as const,
      status: "ACTIVE" as const,
      price: 350000,
      currency: "XOF" as const,
      country: "BJ" as const,
      city: "Cotonou",
      district: "Haie Vive",
      surface: 90,
      bedrooms: 3,
      bathrooms: 2,
      hasAC: true,
      hasWifi: true,
      investmentScore: 72,
      ownerId: seller.id,
    },
    {
      title: "Terrain viabilisé 600m² — Secteur 27, Ouagadougou",
      description: "Terrain plat et viabilisé dans le secteur résidentiel 27. Documents fonciers certifiés OHADA. Idéal pour construction villa ou immeuble.",
      slug: "terrain-600m2-secteur27-ouagadougou",
      type: "LAND" as const,
      listingType: "SALE" as const,
      status: "ACTIVE" as const,
      price: 12000000,
      currency: "XOF" as const,
      country: "BF" as const,
      city: "Ouagadougou",
      district: "Secteur 27",
      surface: 600,
      investmentScore: 65,
      ownerId: seller.id,
    },
    {
      title: "Studio cosy vue mer — Lomé Plage",
      description: "Studio moderne de 35m² à 50m de la plage. Parfait pour courtes durées ou séjours d'affaires. Climatisé, wifi haut débit.",
      slug: "studio-vue-mer-lome-plage",
      type: "STUDIO" as const,
      listingType: "SHORT_TERM_RENTAL" as const,
      status: "ACTIVE" as const,
      price: 25000,
      currency: "XOF" as const,
      country: "TG" as const,
      city: "Lomé",
      district: "Quartier Plage",
      surface: 35,
      bedrooms: 1,
      bathrooms: 1,
      hasAC: true,
      hasWifi: true,
      ownerId: seller.id,
    },
  ];

  for (const prop of properties) {
    await prisma.property.upsert({
      where: { slug: prop.slug },
      update: {},
      create: {
        ...prop,
        publishedAt: new Date(),
      },
    });
  }

  // Create sample artisan
  const artisanUser = await prisma.user.upsert({
    where: { email: "kouame.artisan@example.com" },
    update: {},
    create: {
      email: "kouame.artisan@example.com",
      name: "Jean-Baptiste Kouamé",
      firstName: "Jean-Baptiste",
      lastName: "Kouamé",
      password: await bcrypt.hash("Artisan@2025!", 12),
      userType: "ARTISAN",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      country: "CI",
      city: "Abidjan",
    },
  });

  await prisma.artisan.upsert({
    where: { userId: artisanUser.id },
    update: {},
    create: {
      userId: artisanUser.id,
      businessName: "Kouamé Construction",
      category: "GROS_OEUVRE",
      specialty: ["Maçonnerie", "Coffrage", "Béton armé", "Terrassement"],
      description: "Maçon professionnel avec 15 ans d'expérience en Côte d'Ivoire. Spécialisé dans les villas et immeubles résidentiels.",
      country: "CI",
      city: "Abidjan",
      serviceArea: ["Cocody", "Plateau", "Marcory", "Yopougon"],
      yearsExp: 15,
      isCertified: true,
      certifiedAt: new Date("2024-06-15"),
      avgRating: 4.9,
      totalReviews: 87,
      dailyRate: 45000,
      currency: "XOF",
      completedJobs: 145,
    },
  });

  // Create sample guesthouse
  const ghOwner = await prisma.user.upsert({
    where: { email: "aminata.guesthouse@example.com" },
    update: {},
    create: {
      email: "aminata.guesthouse@example.com",
      name: "Aminata Diallo",
      firstName: "Aminata",
      lastName: "Diallo",
      password: await bcrypt.hash("Owner@2025!", 12),
      userType: "GUESTHOUSE_OWNER",
      status: "ACTIVE",
      kycStatus: "VERIFIED",
      country: "CI",
      city: "Abidjan",
    },
  });

  const guesthouse = await prisma.guesthouse.upsert({
    where: { slug: "palmeraie-cocody-abidjan" },
    update: {},
    create: {
      name: "La Palmeraie de Cocody",
      slug: "palmeraie-cocody-abidjan",
      description: "Guesthouse certifiée dans le cœur de Cocody. 6 chambres climatisées, petit-déjeuner inclus, parking sécurisé.",
      country: "CI",
      city: "Abidjan",
      district: "Cocody",
      address: "Rue des Jardins N°45",
      hasBreakfast: true,
      hasParking: true,
      hasWifi: true,
      hasAC: true,
      isCertified: true,
      certifiedAt: new Date("2024-09-01"),
      certScore: 92,
      avgRating: 4.8,
      totalReviews: 127,
      ownerId: ghOwner.id,
    },
  });

  // Create rooms for the guesthouse
  const rooms = [
    {
      name: "Chambre Deluxe Double",
      description: "Grande chambre avec lit king size et salle de bain privée",
      capacity: 2,
      bedType: "King Size",
      basePrice: 45000,
      amenities: { wifi: true, ac: true, tv: true, minibar: false },
    },
    {
      name: "Chambre Standard",
      description: "Chambre confortable avec lit double",
      capacity: 2,
      bedType: "Double",
      basePrice: 35000,
      amenities: { wifi: true, ac: true, tv: true },
    },
    {
      name: "Suite Junior",
      description: "Suite avec espace salon séparé",
      capacity: 3,
      bedType: "King Size",
      basePrice: 65000,
      amenities: { wifi: true, ac: true, tv: true, balcony: true },
    },
  ];

  for (const room of rooms) {
    await prisma.guesthouseRoom.create({
      data: {
        guesthouseId: guesthouse.id,
        ...room,
        currency: "XOF",
      },
    });
  }

  console.log("✅ Seeding completed!");
  console.log("📧 Admin: admin@afribayit.com / Admin@2025!");
  console.log("📧 Seller: stevens.akpovi@example.com / Seller@2025!");
  console.log("📧 Artisan: kouame.artisan@example.com / Artisan@2025!");
  console.log("📧 Guesthouse owner: aminata.guesthouse@example.com / Owner@2025!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
