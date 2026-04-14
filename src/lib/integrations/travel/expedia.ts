import { travelConfig } from './config'
import type { NormalizedHotel, TravelHotelSearchParams } from './types'

export async function searchExpediaHotels(params: TravelHotelSearchParams): Promise<NormalizedHotel[]> {
  const query = new URLSearchParams()
  if (params.city) query.set('city', params.city)
  if (params.countryCode) query.set('countryCode', params.countryCode)
  if (params.checkIn) query.set('checkIn', params.checkIn)
  if (params.checkOut) query.set('checkOut', params.checkOut)
  if (params.adults) query.set('adults', String(params.adults))
  query.set('limit', String(params.limit || 20))

  const response = await fetch(`${travelConfig.expedia.baseUrl}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${travelConfig.expedia.apiKey}`,
      'X-Expedia-Account-Id': travelConfig.expedia.accountId
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Expedia search failed: ${text}`)
  }

  const payload = (await response.json()) as { hotels?: any[]; data?: any[] }
  const hotels = payload.hotels || payload.data || []

  return hotels.map((item) => ({
    provider: 'expedia',
    providerHotelId: String(item.id || item.hotelId),
    name: item.name || 'Unknown hotel',
    city: item.city || item.location?.city || params.city,
    country: item.country || item.location?.country || params.countryCode,
    stars: item.starRating ? Number(item.starRating) : null,
    latitude: item.coordinates?.lat ?? null,
    longitude: item.coordinates?.lng ?? null,
    minPrice: item.pricing?.amount ?? item.minPrice ?? null,
    currency: item.pricing?.currency || item.currency || null,
    imageUrl: item.imageUrl || item.thumbnail || null,
    raw: item
  }))
}
