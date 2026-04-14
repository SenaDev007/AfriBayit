import { searchAmadeusHotels } from './amadeus'
import { searchBookingHotels } from './booking'
import { getProviderStatus, travelConfig } from './config'
import { searchExpediaHotels } from './expedia'
import { getCache, setCache } from '@/lib/server/cache'
import type { NormalizedHotel, ProviderHealth, TravelHotelSearchParams } from './types'

function dedupeHotels(hotels: NormalizedHotel[]) {
  const seen = new Set<string>()
  return hotels.filter((hotel) => {
    const key = `${hotel.provider}:${hotel.providerHotelId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function aggregateTravelHotels(params: TravelHotelSearchParams): Promise<{
  hotels: NormalizedHotel[]
  providerHealth: ProviderHealth[]
}> {
  const cacheTtlMs = parseInt(process.env.TRAVEL_CACHE_TTL_MS || '300000')
  const cacheKey = `travel:${JSON.stringify(params)}`
  const cached = getCache<{ hotels: NormalizedHotel[]; providerHealth: ProviderHealth[] }>(cacheKey)
  if (cached) return cached

  const status = getProviderStatus()
  const providerHealth: ProviderHealth[] = []
  const buckets: NormalizedHotel[][] = []

  if (travelConfig.amadeus.enabled) {
    if (!status.amadeus.configured) {
      providerHealth.push({
        provider: 'amadeus',
        enabled: true,
        configured: false,
        ok: false,
        message: 'Credentials manquants'
      })
    } else {
      try {
        buckets.push(await searchAmadeusHotels(params))
        providerHealth.push({ provider: 'amadeus', enabled: true, configured: true, ok: true })
      } catch (error) {
        providerHealth.push({
          provider: 'amadeus',
          enabled: true,
          configured: true,
          ok: false,
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }
  }

  if (travelConfig.expedia.enabled) {
    if (!status.expedia.configured) {
      providerHealth.push({
        provider: 'expedia',
        enabled: true,
        configured: false,
        ok: false,
        message: 'Credentials manquants'
      })
    } else {
      try {
        buckets.push(await searchExpediaHotels(params))
        providerHealth.push({ provider: 'expedia', enabled: true, configured: true, ok: true })
      } catch (error) {
        providerHealth.push({
          provider: 'expedia',
          enabled: true,
          configured: true,
          ok: false,
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }
  }

  if (travelConfig.booking.enabled) {
    if (!status.booking.configured) {
      providerHealth.push({
        provider: 'booking',
        enabled: true,
        configured: false,
        ok: false,
        message: 'Credentials manquants'
      })
    } else {
      try {
        buckets.push(await searchBookingHotels(params))
        providerHealth.push({ provider: 'booking', enabled: true, configured: true, ok: true })
      } catch (error) {
        providerHealth.push({
          provider: 'booking',
          enabled: true,
          configured: true,
          ok: false,
          message: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    }
  }

  const result = {
    hotels: dedupeHotels(buckets.flat()),
    providerHealth
  }
  setCache(cacheKey, result, cacheTtlMs)
  return result
}
