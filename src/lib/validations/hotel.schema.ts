import { z } from 'zod';

export const hotelCreateSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']),
  stars: z.number().int().min(1).max(5).default(3),
  pricePerNight: z.number().positive('Le prix par nuit doit être positif'),
  currency: z.string().default('XOF'),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  ownerId: z.string().optional(),
});

export const hotelRoomCreateSchema = z.object({
  type: z.enum(['single', 'double', 'suite', 'deluxe', 'family']),
  name: z.string().optional(),
  capacity: z.number().int().min(1).default(2),
  amenities: z.array(z.string()).optional(),
  basePriceXof: z.number().positive('Le prix de base est requis'),
  photos: z.array(z.string().url()).optional(),
  totalRooms: z.number().int().min(1).default(1),
});

export const hotelBookingCreateSchema = z.object({
  hotelId: z.string().min(1),
  roomId: z.string().optional(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1).default(1),
  specialRequests: z.string().optional(),
});

export type HotelCreateInput = z.infer<typeof hotelCreateSchema>;
export type HotelRoomCreateInput = z.infer<typeof hotelRoomCreateSchema>;
export type HotelBookingCreateInput = z.infer<typeof hotelBookingCreateSchema>;
