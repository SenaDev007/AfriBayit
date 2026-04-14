import { prisma } from '@/lib/db'
import type { NormalizedHotel } from './types'

function toCountryCode(country?: string | null) {
  const normalized = (country || '').toUpperCase()
  if (['BJ', 'CI', 'BF', 'TG', 'SN', 'GH', 'NG', 'CM', 'ML', 'NE'].includes(normalized)) {
    return normalized as
      | 'BJ'
      | 'CI'
      | 'BF'
      | 'TG'
      | 'SN'
      | 'GH'
      | 'NG'
      | 'CM'
      | 'ML'
      | 'NE'
  }
  return 'OTHER' as const
}

export async function snapshotLiveHotels(hotels: NormalizedHotel[]) {
  const top = hotels.slice(0, 30)

  await Promise.all(
    top.map(async (hotel, index) => {
      const slug = `${hotel.provider}-${hotel.providerHotelId}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      await prisma.hotel.upsert({
        where: { slug },
        update: {
          name: hotel.name,
          city: hotel.city || 'Unknown',
          country: toCountryCode(hotel.country),
          stars: hotel.stars || 3,
          isActive: true,
          isVerified: true,
          networkType: 'OTA',
          otaIds: { provider: hotel.provider, providerHotelId: hotel.providerHotelId },
          avgRating: hotel.stars || 0
        },
        create: {
          name: hotel.name,
          description: `Snapshot live depuis ${hotel.provider}.`,
          slug,
          networkType: 'OTA',
          country: toCountryCode(hotel.country),
          city: hotel.city || 'Unknown',
          district: 'Snapshot OTA',
          stars: hotel.stars || 3,
          category: 'hotel',
          isActive: true,
          isVerified: true,
          otaIds: { provider: hotel.provider, providerHotelId: hotel.providerHotelId },
          avgRating: hotel.stars || 0,
          totalReviews: 0
        }
      })
      const found = await prisma.hotel.findUnique({ where: { slug }, select: { id: true } })
      if (found) {
        await prisma.hotelImage.deleteMany({ where: { hotelId: found.id } })
      }
      if (found && hotel.imageUrl) {
        await prisma.hotelImage.create({
          data: {
            hotelId: found.id,
            url: hotel.imageUrl,
            alt: `${hotel.name} (${hotel.provider})`,
            order: index,
            isPrimary: true
          }
        })
      }
    })
  )
}
