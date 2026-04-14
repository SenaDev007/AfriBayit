import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        console.log('Starting test data reset...')

        // Clear all existing data in correct order (respecting foreign key constraints)
        console.log('Clearing notifications...')
        await prisma.notification.deleteMany()

        console.log('Clearing price history...')
        await prisma.priceHistory.deleteMany()

        console.log('Clearing forum posts...')
        await prisma.forumPost.deleteMany()

        console.log('Clearing courses...')
        await prisma.course.deleteMany()

        console.log('Clearing hotels...')
        await prisma.hotel.deleteMany()

        console.log('Clearing properties...')
        await prisma.property.deleteMany()

        console.log('Clearing user profiles...')
        await prisma.userProfile.deleteMany()

        console.log('Clearing sessions...')
        await prisma.session.deleteMany()

        console.log('Clearing users...')
        await prisma.user.deleteMany()

        console.log('Clearing forum categories...')
        await prisma.forumCategory.deleteMany()

        console.log('Clearing countries...')
        await prisma.country.deleteMany()

        // Create countries and cities data
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

        // Create sample users
        const hashedPassword = await bcrypt.hash('password123', 12)

        const users = await Promise.all([
            prisma.user.upsert({
                where: { email: 'admin@afribayit.com' },
                update: {},
                create: {
                    email: 'admin@afribayit.com',
                    firstName: 'Admin',
                    lastName: 'AfriBayit',
                    passwordHash: hashedPassword,
                    profileType: 'AGENT',
                    isVerified: true,
                    isPremium: true,
                    reputationScore: 1000,
                    profile: {
                        create: {
                            bio: 'Administrateur principal de la plateforme AfriBayit',
                            investmentBudgetMin: 0,
                            investmentBudgetMax: 1000000000,
                            preferredLocations: ['Abidjan', 'Dakar', 'Bamako'],
                            propertyTypes: ['VILLA', 'APARTMENT', 'COMMERCIAL'],
                            onboardingCompleted: true,
                        }
                    }
                }
            }),
            prisma.user.upsert({
                where: { email: 'agent@afribayit.com' },
                update: {},
                create: {
                    email: 'agent@afribayit.com',
                    firstName: 'Marie',
                    lastName: 'Koné',
                    passwordHash: hashedPassword,
                    profileType: 'AGENT',
                    isVerified: true,
                    isPremium: true,
                    reputationScore: 850,
                    profile: {
                        create: {
                            bio: 'Agent immobilier spécialisée dans les propriétés de luxe à Abidjan',
                            investmentBudgetMin: 50000000,
                            investmentBudgetMax: 500000000,
                            preferredLocations: ['Abidjan', 'Yamoussoukro'],
                            propertyTypes: ['VILLA', 'APARTMENT'],
                            onboardingCompleted: true,
                        }
                    }
                }
            }),
            prisma.user.upsert({
                where: { email: 'client@afribayit.com' },
                update: {},
                create: {
                    email: 'client@afribayit.com',
                    firstName: 'Jean',
                    lastName: 'Dupont',
                    passwordHash: hashedPassword,
                    profileType: 'BUYER',
                    isVerified: true,
                    isPremium: false,
                    reputationScore: 120,
                    profile: {
                        create: {
                            bio: 'Je cherche une maison familiale dans un quartier calme',
                            investmentBudgetMin: 25000000,
                            investmentBudgetMax: 80000000,
                            preferredLocations: ['Abidjan', 'Cocody', 'Riviera'],
                            propertyTypes: ['VILLA', 'APARTMENT'],
                            onboardingCompleted: true,
                        }
                    }
                }
            }),
            prisma.user.upsert({
                where: { email: 'tourist@afribayit.com' },
                update: {},
                create: {
                    email: 'tourist@afribayit.com',
                    firstName: 'Sarah',
                    lastName: 'Johnson',
                    passwordHash: hashedPassword,
                    profileType: 'TOURIST',
                    isVerified: true,
                    isPremium: false,
                    reputationScore: 80,
                    profile: {
                        create: {
                            bio: 'Touriste passionnée par l\'Afrique et ses cultures',
                            investmentBudgetMin: 50000,
                            investmentBudgetMax: 500000,
                            preferredLocations: ['Abidjan', 'Dakar', 'Bamako'],
                            propertyTypes: ['APARTMENT', 'HOTEL'],
                            onboardingCompleted: true,
                        }
                    }
                }
            })
        ])

        // Create sample properties
        const properties = await Promise.all([
            prisma.property.create({
                data: {
                    title: 'Villa moderne à Cocody',
                    description: 'Magnifique villa de 4 chambres avec piscine et jardin paysager',
                    price: 45000000,
                    currency: 'XOF',
                    propertyType: 'VILLA',
                    bedrooms: 4,
                    bathrooms: 3,
                    area: 250,
                    location: 'Cocody, Abidjan',
                    latitude: 5.3600,
                    longitude: -4.0083,
                    isAvailable: true,
                    isFeatured: true,
                    images: ['/images/villa1.jpg', '/images/villa2.jpg'],
                    features: ['Piscine', 'Jardin', 'Garage', 'Climatisation'],
                    agentId: users[1].id,
                    ownerId: users[1].id
                }
            }),
            prisma.property.create({
                data: {
                    title: 'Appartement de luxe à la Riviera',
                    description: 'Appartement haut de gamme avec vue sur mer',
                    price: 35000000,
                    currency: 'XOF',
                    propertyType: 'APARTMENT',
                    bedrooms: 3,
                    bathrooms: 2,
                    area: 120,
                    location: 'Riviera, Abidjan',
                    latitude: 5.3500,
                    longitude: -4.0200,
                    isAvailable: true,
                    isFeatured: true,
                    images: ['/images/apt1.jpg', '/images/apt2.jpg'],
                    features: ['Vue mer', 'Balcon', 'Ascenseur', 'Sécurité'],
                    agentId: users[1].id,
                    ownerId: users[1].id
                }
            }),
            prisma.property.create({
                data: {
                    title: 'Bureau commercial à Plateau',
                    description: 'Espace de bureau moderne au cœur du quartier des affaires',
                    price: 15000000,
                    currency: 'XOF',
                    propertyType: 'COMMERCIAL',
                    bedrooms: 0,
                    bathrooms: 2,
                    area: 80,
                    location: 'Plateau, Abidjan',
                    latitude: 5.3200,
                    longitude: -4.0300,
                    isAvailable: true,
                    isFeatured: false,
                    images: ['/images/office1.jpg'],
                    features: ['Climatisation', 'Parking', 'Sécurité', 'Internet'],
                    agentId: users[0].id,
                    ownerId: users[0].id
                }
            })
        ])

        // Create sample hotels
        const hotels = await Promise.all([
            prisma.hotel.create({
                data: {
                    name: 'Hôtel Pullman Abidjan',
                    description: 'Hôtel 5 étoiles au cœur d\'Abidjan',
                    address: 'Avenue Franchet d\'Esperey, Abidjan',
                    city: 'Abidjan',
                    country: 'Côte d\'Ivoire',
                    latitude: 5.3200,
                    longitude: -4.0300,
                    rating: 5,
                    pricePerNight: 85000,
                    currency: 'XOF',
                    amenities: ['WiFi', 'Piscine', 'Spa', 'Restaurant', 'Gym'],
                    images: ['/images/hotel1.jpg', '/images/hotel2.jpg'],
                    isAvailable: true
                }
            }),
            prisma.hotel.create({
                data: {
                    name: 'Radisson Blu Hotel',
                    description: 'Hôtel moderne avec vue sur la lagune',
                    address: 'Boulevard de la République, Abidjan',
                    city: 'Abidjan',
                    country: 'Côte d\'Ivoire',
                    latitude: 5.3300,
                    longitude: -4.0250,
                    rating: 4,
                    pricePerNight: 65000,
                    currency: 'XOF',
                    amenities: ['WiFi', 'Piscine', 'Restaurant', 'Bar'],
                    images: ['/images/hotel3.jpg'],
                    isAvailable: true
                }
            })
        ])

        // Create sample courses
        const courses = await Promise.all([
            prisma.course.create({
                data: {
                    title: 'Introduction à l\'investissement immobilier',
                    description: 'Apprenez les bases de l\'investissement immobilier en Afrique',
                    instructor: 'Marie Koné',
                    duration: 120,
                    level: 'BEGINNER',
                    price: 50000,
                    currency: 'XOF',
                    isPublished: true,
                    thumbnail: '/images/course1.jpg',
                    tags: ['Investissement', 'Immobilier', 'Débutant']
                }
            }),
            prisma.course.create({
                data: {
                    title: 'Marketing immobilier digital',
                    description: 'Maîtrisez les outils digitaux pour vendre vos propriétés',
                    instructor: 'Admin AfriBayit',
                    duration: 180,
                    level: 'INTERMEDIATE',
                    price: 75000,
                    currency: 'XOF',
                    isPublished: true,
                    thumbnail: '/images/course2.jpg',
                    tags: ['Marketing', 'Digital', 'Vente']
                }
            })
        ])

        // Create forum posts
        const forumPosts = await Promise.all([
            prisma.forumPost.create({
                data: {
                    title: 'Quel est le meilleur quartier pour investir à Abidjan ?',
                    content: 'Je cherche des conseils sur les meilleurs quartiers pour investir dans l\'immobilier à Abidjan. Quels sont vos retours d\'expérience ?',
                    authorId: users[2].id,
                    categoryId: 1,
                    isPinned: false,
                    tags: ['Investissement', 'Abidjan', 'Conseils']
                }
            }),
            prisma.forumPost.create({
                data: {
                    title: 'Comment bien préparer la vente de sa propriété ?',
                    content: 'Je vends ma maison et j\'aimerais avoir des conseils pour bien la préparer et la mettre en valeur.',
                    authorId: users[1].id,
                    categoryId: 2,
                    isPinned: true,
                    tags: ['Vente', 'Conseils', 'Préparation']
                }
            })
        ])

        // Create price history for properties
        for (const property of properties) {
            await prisma.priceHistory.create({
                data: {
                    propertyId: property.id,
                    price: property.price,
                    currency: property.currency,
                    date: new Date(),
                    changeType: 'INITIAL'
                }
            })
        }

        // Create sample notifications
        await prisma.notification.createMany({
            data: [
                {
                    userId: users[2].id,
                    title: 'Bienvenue sur AfriBayit !',
                    message: 'Découvrez nos propriétés et commencez votre recherche.',
                    type: 'WELCOME',
                    isRead: false
                },
                {
                    userId: users[2].id,
                    title: 'Nouvelle propriété correspondant à vos critères',
                    message: 'Une villa à Cocody pourrait vous intéresser.',
                    type: 'PROPERTY_MATCH',
                    isRead: false
                }
            ]
        })

        console.log('Test data reset completed successfully!')

        return NextResponse.json({
            success: true,
            message: 'Données de test réinitialisées avec succès',
            data: {
                users: users.length,
                properties: properties.length,
                hotels: hotels.length,
                courses: courses.length,
                forumPosts: forumPosts.length
            }
        })

    } catch (error) {
        console.error('Reset test data error:', error)
        console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        })

        return NextResponse.json(
            {
                success: false,
                message: 'Erreur lors de la réinitialisation des données de test',
                error: error instanceof Error ? error.message : 'Unknown error',
                details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
            },
            { status: 500 }
        )
    }
}
