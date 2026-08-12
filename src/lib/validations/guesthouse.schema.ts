import { z } from 'zod';

export const guesthouseCreateSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  city: z.string().min(1, 'La ville est requise'),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']),
  quartier: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  ownerId: z.string().min(1, "L'ID propriétaire est requis"),
  breakfastAvailable: z.boolean().default(false),
  breakfastPrice: z.number().optional(),
  hasStaff: z.boolean().default(false),
});

export const guesthouseRoomCreateSchema = z.object({
  name: z.string().min(1, 'Le nom de la chambre est requis'),
  capacity: z.number().int().min(1).default(2),
  amenities: z.array(z.string()).optional(),
  basePrice: z.number().positive('Le prix de base est requis'),
  photos: z.array(z.string().url()).optional(),
  instantBooking: z.boolean().default(true),
});

export const guesthouseBookingCreateSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  guests: z.number().int().min(1).default(1),
  breakfastIncluded: z.boolean().default(false),
});

export type GuesthouseCreateInput = z.infer<typeof guesthouseCreateSchema>;
export type GuesthouseRoomCreateInput = z.infer<typeof guesthouseRoomCreateSchema>;
export type GuesthouseBookingCreateInput = z.infer<typeof guesthouseBookingCreateSchema>;
