import { z } from 'zod';

export const geometerMissionCreateSchema = z.object({
  propertyId: z.string().min(1, "L'ID propriété est requis"),
  geometerId: z.string().min(1, "L'ID géomètre est requis"),
  serviceCode: z.enum(['GEO_GPS', 'GEO_SURF', 'GEO_INSP', 'GEO_BORN', 'GEO_TOPO', 'GEO_DRON', 'GEO_CERT', 'GEO_3D']),
  price: z.number().positive('Le prix doit être positif'),
  currency: z.string().default('XOF'),
  notes: z.string().optional(),
});

export type GeometerMissionCreateInput = z.infer<typeof geometerMissionCreateSchema>;
