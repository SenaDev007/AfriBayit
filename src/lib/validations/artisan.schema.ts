import { z } from 'zod';

export const artisanCreateSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  trade: z.string().min(1, 'Le métier est requis'),
  specialties: z.array(z.string()).optional(),
  priceRange: z.string().optional(),
  dailyRate: z.number().positive().optional(),
  zone: z.string().optional(),
  city: z.string().optional(),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']).optional(),
  portfolio: z.array(z.string().url()).optional(),
});

export const artisanQuoteCreateSchema = z.object({
  userId: z.string().min(1),
  propertyId: z.string().optional(),
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  estimatedBudget: z.number().positive().optional(),
});

export type ArtisanCreateInput = z.infer<typeof artisanCreateSchema>;
export type ArtisanQuoteCreateInput = z.infer<typeof artisanQuoteCreateSchema>;
