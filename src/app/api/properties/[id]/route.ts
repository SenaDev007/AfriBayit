import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const row = await prisma.properties.findUnique({
      where: { id: context.params.id },
      include: {
        property_images: {
          orderBy: { order: 'asc' }
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            image: true,
            reputationScore: true
          }
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    })

    if (!row) {
      return NextResponse.json({ message: 'Propriete introuvable' }, { status: 404 })
    }

    const property = {
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
        email: row.users.email,
        phone: row.users.phone,
        avatarUrl: row.users.image,
        reputationScore: row.users.reputationScore
      },
      reviews: row.reviews,
      _count: row._count
    }

    return NextResponse.json({ property })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isDbConnectionError =
      errorMessage.includes('PrismaClientInitializationError') ||
      errorMessage.includes('Authentication failed against database server') ||
      errorMessage.includes('Can not reach database server')

    if (isDbConnectionError) {
      return NextResponse.json(
        { message: 'Base de donnees indisponible en local.' },
        { status: 503 }
      )
    }

    console.error('Property detail fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la recuperation de la propriete' },
      { status: 500 }
    )
  }
}
