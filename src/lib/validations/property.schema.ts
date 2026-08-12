import { z } from 'zod';

export const propertyCreateSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  type: z.enum(['villa', 'appartement', 'terrain', 'bureau', 'commerce', 'chambre', 'guesthouse']),
  transaction: z.enum(['achat', 'location', 'investissement', 'location_courte_duree']),
  price: z.number().positive('Le prix doit être positif'),
  currency: z.string().default('XOF'),
  surface: z.number().positive('La surface doit être positive'),
  rooms: z.number().int().min(0).default(0),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().int().min(0).default(0),
  city: z.string().min(1, 'La ville est requise'),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']),
  quartier: z.string().min(1, 'Le quartier est requis'),
  address: z.string().optional(),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  features: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  agentId: z.string().min(1, "L'ID agent est requis"),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
