import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')

  try {
    const propertyType = searchParams.get('type')
    const city = searchParams.get('city')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const bedrooms = searchParams.get('bedrooms')
    const bathrooms = searchParams.get('bathrooms')
    const featured = searchParams.get('featured')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'ACTIVE'
    }

    if (propertyType) {
      where.type = propertyType
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseInt(minPrice)
      if (maxPrice) where.price.lte = parseInt(maxPrice)
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms)
    }

    if (bathrooms) {
      where.bathrooms = parseInt(bathrooms)
    }

    if (featured === 'true') {
      where.investmentScore = { not: null }
    }

    // Get properties with pagination
    const [rows, total] = await Promise.all([
      prisma.properties.findMany({
        where,
        include: {
          property_images: {
            orderBy: { order: 'asc' },
            take: 1
          },
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              image: true,
              reputationScore: true
            }
          },
          _count: {
            select: {
              favorites: true,
              reviews: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.properties.count({ where })
    ])

    const properties = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      propertyType: row.type,
      status: row.status,
      price: row.price,
      currency: row.currency,
      surfaceArea: row.surface,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      parkingSpaces: row.hasGarage ? 1 : 0,
      features: row.features,
      viewsCount: row.viewCount,
      favoritesCount: row.favoriteCount,
      isPremium: row.investmentScore !== null,
      isVerified: row.legalDocStatus === 'VERIFIED',
      createdAt: row.createdAt,
      location: {
        city: row.city,
        country: row.country,
        address: row.address
      },
      images: row.property_images.map((img) => ({
        imageUrl: img.url,
        altText: img.alt,
        isPrimary: img.isPrimary,
        orderIndex: img.order
      })),
      owner: {
        id: row.users.id,
        firstName: row.users.firstName,
        lastName: row.users.lastName,
        avatarUrl: row.users.image,
        reputationScore: row.users.reputationScore
      },
      _count: row._count
    }))

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isDbConnectionError =
      errorMessage.includes('PrismaClientInitializationError') ||
      errorMessage.includes('Authentication failed against database server') ||
      errorMessage.includes('Can not reach database server')

    if (isDbConnectionError) {
      console.warn(
        'Properties fetch warning: database unavailable in local environment.'
      )
      return NextResponse.json({
        properties: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasMore: false
        },
        warning: 'Base de donnees indisponible en local. Verifie DATABASE_URL et le service Postgres.'
      })
    }

    console.error('Properties fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des propriétés' },
      { status: 500 }
    )
  }
}
