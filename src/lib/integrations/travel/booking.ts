import { travelConfig } from './config'
import type { NormalizedHotel, TravelHotelSearchParams } from './types'

export async function searchBookingHotels(params: TravelHotelSearchParams): Promise<NormalizedHotel[]> {
  const query = new URLSearchParams()
  if (params.city) query.set('city', params.city)
  if (params.countryCode) query.set('countryCode', params.countryCode)
  if (params.checkIn) query.set('checkin', params.checkIn)
  if (params.checkOut) query.set('checkout', params.checkOut)
  if (params.adults) query.set('adults_number', String(params.adults))
  query.set('rows', String(params.limit || 20))

  const response = await fetch(`${travelConfig.booking.baseUrl}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${travelConfig.booking.apiKey}`,
      'X-Affiliate-Id': travelConfig.booking.affiliateId
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Booking search failed: ${text}`)
  }

  const payload = (await response.json()) as { hotels?: any[]; result?: any[] }
  const hotels = payload.hotels || payload.result || []

  return hotels.map((item) => ({
    provider: 'booking',
    providerHotelId: String(item.hotel_id || item.id),
    name: item.hotel_name || item.name || 'Unknown hotel',
    city: item.city || params.city,
    country: item.countrycode || params.countryCode,
    stars: item.class ? Number(item.class) : null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    minPrice: item.min_total_price ?? item.price ?? null,
    currency: item.currencycode || item.currency || null,
    imageUrl: item.max_photo_url || item.photo_url || null,
    raw: item
  }))
}
