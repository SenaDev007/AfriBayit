import { z } from 'zod';

export const courseCreateSchema = z.object({
  title: z.string().min(3, 'Le titre est requis'),
  category: z.enum(['immobilier', 'droit_foncier', 'investissement', 'construction', 'finance', 'certification']),
  instructorId: z.string().min(1, "L'ID instructeur est requis"),
  instructor: z.string().min(1, "Le nom de l'instructeur est requis"),
  description: z.string().optional(),
  duration: z.string().min(1, 'La durée est requise'),
  price: z.number().min(0).default(0),
  currency: z.string().default('XOF'),
  level: z.enum(['debutant', 'intermediaire', 'avance', 'expert']).default('debutant'),
  certificate: z.boolean().default(false),
  image: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  modules: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;
