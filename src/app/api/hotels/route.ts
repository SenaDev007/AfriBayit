import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { aggregateTravelHotels } from '@/lib/integrations/travel/aggregator'
import { snapshotLiveHotels } from '@/lib/integrations/travel/snapshot'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/server/rateLimit'

export const dynamic = 'force-dynamic'

function normalizeDbHotelToLiveLike(hotel: any) {
  return {
    provider: 'booking' as const,
    providerHotelId: hotel.id,
    name: hotel.name,
    city: hotel.city,
    country: hotel.country,
    stars: hotel.stars,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
    minPrice: hotel.rooms?.[0]?.basePrice ?? null,
    currency: hotel.rooms?.[0]?.currency ?? null,
    imageUrl: null,
    _count: {
      bookings: hotel._count.bookings,
      rooms: hotel._count.rooms
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'db'
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const minRating = searchParams.get('minRating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const persistLiveSnapshot = searchParams.get('persist') === 'true'

    if (source === 'live' || source === 'hybrid') {
      const ip = getClientIpFromHeaders(request.headers)
      const limiter = checkRateLimit({
        key: `hotels:${source}:${ip}`,
        maxRequests: parseInt(process.env.TRAVEL_RATE_LIMIT_MAX || '30'),
        windowMs: parseInt(process.env.TRAVEL_RATE_LIMIT_WINDOW_MS || '60000')
      })
      if (!limiter.allowed) {
        return NextResponse.json(
          { message: 'Rate limit dépassé sur la recherche hôtels' },
          { status: 429 }
        )
      }
    }

    if (source === 'live' || source === 'hybrid') {
      const { hotels: liveHotels, providerHealth } = await aggregateTravelHotels({
        city: city || undefined,
        countryCode: country || undefined,
        checkIn: searchParams.get('checkIn') || undefined,
        checkOut: searchParams.get('checkOut') || undefined,
        adults: parseInt(searchParams.get('adults') || '1'),
        limit
      })
      if (persistLiveSnapshot && liveHotels.length > 0) {
        await snapshotLiveHotels(liveHotels)
      }

      if (source === 'live') {
        return NextResponse.json({
          hotels: liveHotels,
          providerHealth,
          pagination: {
            page: 1,
            limit,
            total: liveHotels.length,
            pages: 1,
            hasMore: false
          }
        })
      }
    }

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

    if (source === 'hybrid') {
      const { hotels: liveHotels, providerHealth } = await aggregateTravelHotels({
        city: city || undefined,
        countryCode: country || undefined,
        checkIn: searchParams.get('checkIn') || undefined,
        checkOut: searchParams.get('checkOut') || undefined,
        adults: parseInt(searchParams.get('adults') || '1'),
        limit
      })
      if (persistLiveSnapshot && liveHotels.length > 0) {
        await snapshotLiveHotels(liveHotels)
      }
      const dbHotelsAsNormalized = normalizedHotels.map(normalizeDbHotelToLiveLike)
      const merged = [...dbHotelsAsNormalized, ...liveHotels]
      const deduped = merged.filter((hotel, index) => {
        const key = `${hotel.name}-${hotel.city || ''}`.toLowerCase()
        return (
          merged.findIndex((candidate) => `${candidate.name}-${candidate.city || ''}`.toLowerCase() === key) === index
        )
      })
      return NextResponse.json({
        hotels: deduped.slice(0, limit),
        providerHealth,
        pagination: {
          page: 1,
          limit,
          total: deduped.length,
          pages: 1,
          hasMore: false
        },
        source: 'hybrid'
      })
    }

    return NextResponse.json({
      hotels: normalizedHotels,
      providerHealth: [],
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
