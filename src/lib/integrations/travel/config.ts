type ProviderConfig = {
  enabled: boolean
  configured: boolean
}

function parseBool(value: string | undefined, defaultValue = false) {
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

export const travelConfig = {
  amadeus: {
    enabled: parseBool(process.env.AMADEUS_ENABLED, false),
    baseUrl: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com',
    clientId: process.env.AMADEUS_CLIENT_ID || '',
    clientSecret: process.env.AMADEUS_CLIENT_SECRET || ''
  },
  expedia: {
    enabled: parseBool(process.env.EXPEDIA_ENABLED, false),
    baseUrl: process.env.EXPEDIA_BASE_URL || '',
    apiKey: process.env.EXPEDIA_API_KEY || '',
    accountId: process.env.EXPEDIA_ACCOUNT_ID || ''
  },
  booking: {
    enabled: parseBool(process.env.BOOKING_ENABLED, false),
    baseUrl: process.env.BOOKING_BASE_URL || '',
    apiKey: process.env.BOOKING_API_KEY || '',
    affiliateId: process.env.BOOKING_AFFILIATE_ID || ''
  }
}

export function getProviderStatus(): Record<'amadeus' | 'expedia' | 'booking', ProviderConfig> {
  return {
    amadeus: {
      enabled: travelConfig.amadeus.enabled,
      configured: Boolean(travelConfig.amadeus.clientId && travelConfig.amadeus.clientSecret)
    },
    expedia: {
      enabled: travelConfig.expedia.enabled,
      configured: Boolean(travelConfig.expedia.baseUrl && travelConfig.expedia.apiKey)
    },
    booking: {
      enabled: travelConfig.booking.enabled,
      configured: Boolean(travelConfig.booking.baseUrl && travelConfig.booking.apiKey)
    }
  }
}
