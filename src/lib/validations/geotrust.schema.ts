import { z } from 'zod';
import { GEO_SERVICE_CODES } from '@/lib/geotrust/service-codes';

export const geometerMissionCreateSchema = z.object({
  propertyId: z.string().min(1, "L'ID propriété est requis"),
  geometerId: z.string().min(1, "L'ID géomètre est requis"),
  serviceCode: z.enum([GEO_SERVICE_CODES[0], ...GEO_SERVICE_CODES.slice(1)]),
  price: z.number().positive('Le prix doit être positif'),
  currency: z.string().default('XOF'),
  notes: z.string().optional(),
});

export type GeometerMissionCreateInput = z.infer<typeof geometerMissionCreateSchema>;
