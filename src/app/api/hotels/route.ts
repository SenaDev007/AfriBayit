import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const minRating = searchParams.get('minRating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { isActive: true }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive'
      }
    }

    if (country) {
      where.country = {
        contains: country,
        mode: 'insensitive'
      }
    }

    if (minRating) {
      where.stars = {
        gte: parseInt(minRating)
      }
    }

    // Get hotels with pagination
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({
        where,
        include: {
          rooms: {
            where: { isAvailable: true },
            take: 3,
            orderBy: { basePrice: 'asc' }
          },
          _count: {
            select: {
              bookings: true,
              rooms: true
            }
          }
        },
        orderBy: { stars: 'desc' },
        skip,
        take: limit
      }),
      prisma.hotel.count({ where })
    ])

    const normalizedHotels = hotels.map((hotel) => ({
      ...hotel,
      starRating: hotel.stars,
      rooms: hotel.rooms,
      _count: {
        bookings: hotel._count.bookings,
        rooms: hotel._count.rooms
      }
    }))

    return NextResponse.json({
      hotels: normalizedHotels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    })

  } catch (error) {
    console.error('Hotels fetch error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des hôtels' },
      { status: 500 }
    )
  }
}
