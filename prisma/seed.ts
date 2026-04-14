import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const countries = ['BJ', 'CI', 'BF', 'TG'] as const
const cities = ['Cotonou', 'Abidjan', 'Ouagadougou', 'Lome'] as const

async function upsertUser(params: {
  email: string
  firstName: string
  lastName: string
  userType: 'ADMIN' | 'SELLER' | 'BUYER' | 'ARTISAN' | 'AGENCY'
  city: string
  country: 'BJ' | 'CI' | 'BF' | 'TG'
}) {
  const password = await bcrypt.hash('Seed@2026!', 10)
  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      firstName: params.firstName,
      lastName: params.lastName,
      name: `${params.firstName} ${params.lastName}`,
      city: params.city,
      country: params.country,
      status: 'ACTIVE',
      kycStatus: 'VERIFIED'
    },
    create: {
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      name: `${params.firstName} ${params.lastName}`,
      password,
      userType: params.userType,
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      country: params.country,
      city: params.city,
      isPremium: true
    }
  })
}

async function main() {
  console.log('🌱 Seed AfriBayit: démarrage...')

  const admin = await upsertUser({
    email: 'admin@afribayit.com',
    firstName: 'Admin',
    lastName: 'AfriBayit',
    userType: 'ADMIN',
    city: 'Cotonou',
    country: 'BJ'
  })

  const seller = await upsertUser({
    email: 'seller@afribayit.com',
    firstName: 'Stevens',
    lastName: 'Akpovi',
    userType: 'SELLER',
    city: 'Abidjan',
    country: 'CI'
  })

  await upsertUser({
    email: 'buyer@afribayit.com',
    firstName: 'Aicha',
    lastName: 'Diallo',
    userType: 'BUYER',
    city: 'Lome',
    country: 'TG'
  })

  const propertyTypes = ['VILLA', 'APARTMENT', 'LAND', 'HOUSE', 'COMMERCIAL'] as const
  for (let i = 1; i <= 12; i++) {
    const city = cities[(i - 1) % cities.length]
    const country = countries[(i - 1) % countries.length]
    const type = propertyTypes[(i - 1) % propertyTypes.length]
    const listingType = i % 3 === 0 ? 'SHORT_TERM_RENTAL' : i % 2 === 0 ? 'LONG_TERM_RENTAL' : 'SALE'
    const property = await prisma.property.upsert({
      where: { slug: `seed-property-${i}` },
      update: {
        title: `Bien premium ${i} - ${city}`,
        city,
        country,
        type,
        listingType,
        status: 'ACTIVE',
        investmentScore: 60 + i,
        publishedAt: new Date()
      },
      create: {
        title: `Bien premium ${i} - ${city}`,
        description: `Annonce immobilière ${i} conforme CDC, avec informations vérifiées et parcours sécurisé.`,
        slug: `seed-property-${i}`,
        type,
        listingType,
        status: 'ACTIVE',
        price: 18000000 + i * 2750000,
        currency: 'XOF',
        country,
        city,
        district: `Quartier ${i}`,
        address: `Rue ${i}, ${city}`,
        surface: 90 + i * 14,
        bedrooms: (i % 5) + 1,
        bathrooms: (i % 3) + 1,
        hasGarage: i % 2 === 0,
        hasPool: i % 3 === 0,
        hasGarden: i % 2 === 1,
        hasSecurity: true,
        hasGenerator: i % 4 === 0,
        hasWifi: true,
        hasAC: i % 2 === 0,
        legalDocStatus: 'VERIFIED',
        investmentScore: 60 + i,
        ownerId: seller.id,
        publishedAt: new Date()
      }
    })

    await prisma.propertyImage.deleteMany({ where: { propertyId: property.id } })
    await prisma.propertyImage.create({
      data: {
        propertyId: property.id,
        url: `https://picsum.photos/seed/afribayit-property-${i}/1200/800`,
        alt: `Photo propriété ${i}`,
        order: 1,
        isPrimary: true
      }
    })
  }

  for (let i = 1; i <= 10; i++) {
    const city = cities[(i - 1) % cities.length]
    const country = countries[(i - 1) % countries.length]
    const hotel = await prisma.hotel.upsert({
      where: { slug: `seed-hotel-${i}` },
      update: {
        name: `Hôtel Signature ${i}`,
        city,
        country,
        isActive: true,
        isVerified: true
      },
      create: {
        name: `Hôtel Signature ${i}`,
        description: `Hôtel partenaire ${i} avec standards premium et réservation sécurisée.`,
        slug: `seed-hotel-${i}`,
        networkType: i % 2 === 0 ? 'DIRECT' : 'OTA',
        country,
        city,
        district: `Centre ${city}`,
        stars: ((i % 3) + 3),
        category: 'hotel',
        hasPool: i % 2 === 0,
        hasRestaurant: true,
        hasSpa: i % 3 === 0,
        hasGym: i % 2 === 1,
        hasConference: i % 4 === 0,
        hasParking: true,
        hasWifi: true,
        hasAC: true,
        avgRating: 4.1 + i * 0.05,
        totalReviews: 20 + i * 8,
        isActive: true,
        isVerified: true
      }
    })

    await prisma.hotelRoom.deleteMany({ where: { hotelId: hotel.id } })
    await prisma.hotelRoom.create({
      data: {
        hotelId: hotel.id,
        name: 'Chambre Deluxe',
        description: 'Chambre premium avec services hôteliers complets.',
        roomCode: `DLX-${i}`,
        capacity: 2,
        bedType: 'Queen',
        basePrice: 45000 + i * 3000,
        currency: 'XOF',
        isAvailable: true
      }
    })
  }

  const artisanCategories = ['GROS_OEUVRE', 'SECOND_OEUVRE', 'FINITION_DECORATION', 'GENIE_TECHNIQUE'] as const
  for (let i = 1; i <= 10; i++) {
    const city = cities[(i - 1) % cities.length]
    const country = countries[(i - 1) % countries.length]
    const artisanUser = await upsertUser({
      email: `artisan${i}@afribayit.com`,
      firstName: `Artisan${i}`,
      lastName: 'Pro',
      userType: 'ARTISAN',
      city,
      country
    })

    const artisan = await prisma.artisan.upsert({
      where: { userId: artisanUser.id },
      update: {
        businessName: `Atelier BTP ${i}`,
        city,
        country,
        isAvailable: true,
        isCertified: true,
        avgRating: 4 + i * 0.06
      },
      create: {
        userId: artisanUser.id,
        businessName: `Atelier BTP ${i}`,
        category: artisanCategories[(i - 1) % artisanCategories.length],
        specialty: ['Rénovation', 'Finition', 'Maintenance'],
        description: `Prestataire BTP ${i} référencé et contrôlé.`,
        country,
        city,
        serviceArea: [city],
        yearsExp: 4 + i,
        isCertified: true,
        certifiedAt: new Date(),
        avgRating: 4 + i * 0.06,
        totalReviews: 8 + i * 2,
        dailyRate: 25000 + i * 1800,
        currency: 'XOF',
        completedJobs: 6 + i * 3,
        isAvailable: true
      }
    })

    await prisma.artisanService.deleteMany({ where: { artisanId: artisan.id } })
    await prisma.artisanImage.deleteMany({ where: { artisanId: artisan.id } })
    await prisma.artisanService.create({
      data: {
        artisanId: artisan.id,
        name: `Service principal ${i}`,
        description: 'Prestation standardisée ProMatch',
        basePrice: 50000 + i * 2000,
        currency: 'XOF',
        duration: '2 jours'
      }
    })
    await prisma.artisanImage.create({
      data: {
        artisanId: artisan.id,
        url: `https://picsum.photos/seed/afribayit-artisan-${i}/800/600`,
        caption: `Portfolio artisan ${i}`,
        order: 1
      }
    })
  }

  const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'] as const
  for (let i = 1; i <= 10; i++) {
    const course = await prisma.course.upsert({
      where: { slug: `seed-course-${i}` },
      update: {
        title: `Formation immobilière ${i}`,
        isPublished: true,
        isCertified: true
      },
      create: {
        title: `Formation immobilière ${i}`,
        description: `Parcours académique ${i} pour professionnaliser les acteurs immobiliers.`,
        slug: `seed-course-${i}`,
        level: levels[(i - 1) % levels.length],
        category: i % 2 === 0 ? 'investissement' : 'legal',
        language: 'fr',
        price: i % 3 === 0 ? 0 : 12000 + i * 1800,
        currency: 'XOF',
        duration: 75 + i * 10,
        isPublished: true,
        isCertified: true
      }
    })

    await prisma.courseModule.deleteMany({ where: { courseId: course.id } })
    await prisma.courseModule.createMany({
      data: [
        { courseId: course.id, title: 'Module 1 - Fondamentaux', order: 1, duration: 30 },
        { courseId: course.id, title: 'Module 2 - Cas pratiques', order: 2, duration: 35 },
        { courseId: course.id, title: 'Module 3 - Évaluation', order: 3, duration: 25 }
      ]
    })
  }

  const forumAuthors = [
    await upsertUser({
      email: 'forum1@afribayit.com',
      firstName: 'Mariam',
      lastName: 'Kone',
      userType: 'INVESTOR',
      city: 'Abidjan',
      country: 'CI'
    }),
    await upsertUser({
      email: 'forum2@afribayit.com',
      firstName: 'Ibrahim',
      lastName: 'Traore',
      userType: 'INVESTOR',
      city: 'Ouagadougou',
      country: 'BF'
    })
  ]
  const categories = ['INVESTISSEMENT', 'JURIDIQUE', 'CONSEILS', 'FINANCE', 'GENERAL'] as const
  for (let i = 1; i <= 12; i++) {
    const author = forumAuthors[(i - 1) % forumAuthors.length]
    await prisma.forumPost.upsert({
      where: { id: `seed_forum_${String(i).padStart(2, '0')}` },
      update: {
        title: `Discussion CDC ${i}`,
        body: `Post communautaire ${i} sur le marché immobilier local.`,
        category: categories[(i - 1) % categories.length],
        isPinned: i <= 2,
        viewCount: 50 + i * 15
      },
      create: {
        id: `seed_forum_${String(i).padStart(2, '0')}`,
        authorId: author.id,
        title: `Discussion CDC ${i}`,
        body: `Post communautaire ${i} sur le marché immobilier local.`,
        category: categories[(i - 1) % categories.length],
        isPinned: i <= 2,
        isLocked: false,
        viewCount: 50 + i * 15
      }
    })
  }

  const [propertyCount, hotelCount, artisanCount, courseCount, forumCount] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.hotel.count({ where: { isActive: true } }),
    prisma.artisan.count({ where: { isAvailable: true } }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.forumPost.count()
  ])

  console.log('✅ Seed terminé')
  console.log(`🏠 Propriétés actives: ${propertyCount}`)
  console.log(`🏨 Hôtels actifs: ${hotelCount}`)
  console.log(`🛠️ Artisans actifs: ${artisanCount}`)
  console.log(`🎓 Cours publiés: ${courseCount}`)
  console.log(`💬 Posts forum: ${forumCount}`)
  console.log(`👤 Admin seed: ${admin.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
