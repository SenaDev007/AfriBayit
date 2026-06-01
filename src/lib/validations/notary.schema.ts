import { z } from 'zod';

export const notaryCreateSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  licenseNumber: z.string().min(1, 'Le numéro de licence est requis'),
  chamberName: z.string().optional(),
  specialty: z.string().optional(),
  zone: z.string().optional(),
  subscriptionTier: z.enum(['gratuit', 'pro', 'elite']).optional(),
});

export type NotaryCreateInput = z.infer<typeof notaryCreateSchema>;
