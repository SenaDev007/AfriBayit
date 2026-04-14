import { NextRequest, NextResponse } from 'next/server'
import { aggregateTravelHotels } from '@/lib/integrations/travel/aggregator'
import { snapshotLiveHotels } from '@/lib/integrations/travel/snapshot'
import { checkRateLimit, getClientIpFromHeaders } from '@/lib/server/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers)
    const limiter = checkRateLimit({
      key: `live-hotels:${ip}`,
      maxRequests: parseInt(process.env.TRAVEL_RATE_LIMIT_MAX || '30'),
      windowMs: parseInt(process.env.TRAVEL_RATE_LIMIT_WINDOW_MS || '60000')
    })
    if (!limiter.allowed) {
      return NextResponse.json(
        { message: 'Rate limit dépassé pour les fournisseurs live' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city') || undefined
    const countryCode = searchParams.get('countryCode') || undefined
    const checkIn = searchParams.get('checkIn') || undefined
    const checkOut = searchParams.get('checkOut') || undefined
    const adults = parseInt(searchParams.get('adults') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const { hotels, providerHealth } = await aggregateTravelHotels({
      city,
      countryCode,
      checkIn,
      checkOut,
      adults: Number.isNaN(adults) ? 1 : adults,
      limit: Number.isNaN(limit) ? 20 : limit
    })
    const persist = searchParams.get('persist') === 'true'
    if (persist && hotels.length > 0) {
      await snapshotLiveHotels(hotels)
    }

    return NextResponse.json({
      hotels,
      providerHealth,
      total: hotels.length,
      persisted: persist
    })
  } catch (error) {
    console.error('Live travel aggregation error:', error)
    return NextResponse.json(
      { message: 'Erreur lors de l’agrégation des fournisseurs travel' },
      { status: 500 }
    )
  }
}
