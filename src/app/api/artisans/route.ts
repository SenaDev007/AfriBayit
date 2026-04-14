import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = { isAvailable: true }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (category) {
      where.category = category
    }

    const [rows, total] = await Promise.all([
      prisma.artisan.findMany({
        where,
        include: {
          services: {
            take: 2
          },
          images: {
            orderBy: { order: 'asc' },
            take: 1
          }
        },
        orderBy: { avgRating: 'desc' },
        skip,
        take: limit
      }),
      prisma.artisan.count({ where })
    ])

    const artisans = rows.map((row) => ({
      id: row.id,
      fullName: row.businessName || row.fullName,
      specialty: row.category,
      city: row.city,
      rating: row.avgRating || 0,
      verified: row.isCertified,
      imageUrl: row.images[0]?.url || null,
      services: row.services.map((service) => service.name)
    }))

    return NextResponse.json({
      artisans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })
  } catch (error) {
    console.error('Artisans fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des artisans' },
      { status: 500 }
    )
  }
}
