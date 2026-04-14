import { travelConfig } from './config'
import type { NormalizedHotel, TravelHotelSearchParams } from './types'

let amadeusTokenCache: { token: string; expiresAt: number } | null = null

async function getAmadeusAccessToken() {
  if (amadeusTokenCache && amadeusTokenCache.expiresAt > Date.now() + 30_000) {
    return amadeusTokenCache.token
  }

  const body = new URLSearchParams()
  body.set('grant_type', 'client_credentials')
  body.set('client_id', travelConfig.amadeus.clientId)
  body.set('client_secret', travelConfig.amadeus.clientSecret)

  const response = await fetch(`${travelConfig.amadeus.baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Amadeus auth failed: ${text}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  amadeusTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000
  }
  return data.access_token
}

export async function searchAmadeusHotels(params: TravelHotelSearchParams): Promise<NormalizedHotel[]> {
  if (!params.city && !params.countryCode) return []

  const token = await getAmadeusAccessToken()
  const search = new URLSearchParams()
  if (params.city) search.set('keyword', params.city)
  if (params.countryCode) search.set('countryCode', params.countryCode)
  search.set('max', String(params.limit || 20))

  const response = await fetch(`${travelConfig.amadeus.baseUrl}/v1/reference-data/locations/hotels/by-city?${search.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Amadeus hotel search failed: ${text}`)
  }

  const payload = (await response.json()) as { data?: any[] }
  return (payload.data || []).map((item) => ({
    provider: 'amadeus',
    providerHotelId: String(item.hotelId || item.id),
    name: item.name || 'Unknown hotel',
    city: item.address?.cityName || params.city,
    country: item.address?.countryCode || params.countryCode,
    latitude: item.geoCode?.latitude ?? null,
    longitude: item.geoCode?.longitude ?? null,
    stars: item.rating ? Number(item.rating) : null,
    minPrice: null,
    currency: null,
    imageUrl: null,
    raw: item
  }))
}
