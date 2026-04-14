export type TravelHotelSearchParams = {
  city?: string
  countryCode?: string
  checkIn?: string
  checkOut?: string
  adults?: number
  limit?: number
}

export type NormalizedHotel = {
  provider: 'amadeus' | 'expedia' | 'booking'
  providerHotelId: string
  name: string
  city?: string
  country?: string
  stars?: number | null
  latitude?: number | null
  longitude?: number | null
  minPrice?: number | null
  currency?: string | null
  imageUrl?: string | null
  raw?: unknown
}

export type ProviderHealth = {
  provider: 'amadeus' | 'expedia' | 'booking'
  enabled: boolean
  configured: boolean
  ok: boolean
  message?: string
}
