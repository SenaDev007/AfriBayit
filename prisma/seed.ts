import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create countries data
  const countries = [
    { code: 'CI', name: 'Côte d\'Ivoire', currency: 'XOF' },
    { code: 'SN', name: 'Sénégal', currency: 'XOF' },
    { code: 'ML', name: 'Mali', currency: 'XOF' },
    { code: 'BF', name: 'Burkina Faso', currency: 'XOF' },
    { code: 'NE', name: 'Niger', currency: 'XOF' },
    { code: 'TG', name: 'Togo', currency: 'XOF' },
    { code: 'BJ', name: 'Bénin', currency: 'XOF' },
    { code: 'CM', name: 'Cameroun', currency: 'XAF' },
    { code: 'GA', name: 'Gabon', currency: 'XAF' },
    { code: 'CG', name: 'Congo', currency: 'XAF' },
  ]

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country
    })
  }

  console.log('✅ Countries created')

  // Create forum categories
  const forumCategories = [
    { name: 'Général', description: 'Discussions générales sur l\'immobilier' },
    { name: 'Acheteurs', description: 'Conseils et expériences pour les acheteurs' },
    { name: 'Vendeurs', description: 'Stratégies et conseils pour les vendeurs' },
    { name: 'Investisseurs', description: 'Opportunités d\'investissement et analyses' },
    { name: 'Questions Techniques', description: 'Support technique et questions sur la plateforme' }
  ]

  for (const category of forumCategories) {
    await prisma.forumCategory.create({
      data: category
    })
  }

  console.log('✅ Forum categories created')

  // Create only essential admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@afribayit.com' },
    update: {},
    create: {
      email: 'admin@afribayit.com',
      firstName: 'Admin',
      lastName: 'AfriBayit',
      passwordHash: hashedPassword,
      profileType: 'ADMIN',
      isVerified: true,
      isPremium: true,
      reputationScore: 1000,
      profile: {
        create: {
          bio: 'Administrateur principal de la plateforme AfriBayit',
          investmentBudgetMin: 0,
          investmentBudgetMax: 1000000000,
          preferredLocations: ['Abidjan'],
          propertyTypes: ['VILLA', 'APARTMENT'],
          onboardingCompleted: true,
        }
      }
    }
  })

  console.log('✅ Admin user created')
  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })