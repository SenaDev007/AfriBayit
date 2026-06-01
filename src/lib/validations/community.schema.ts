import { z } from 'zod';

export const communityPostCreateSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  content: z.string().min(10, 'Le contenu doit contenir au moins 10 caractères'),
  category: z.enum(['discussion', 'question', 'success_story', 'market_analysis', 'legal', 'event', 'investment']),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']).optional(),
  tags: z.array(z.string()).optional(),
});

export const communityGroupCreateSchema = z.object({
  name: z.string().min(2, 'Le nom du groupe est requis'),
  description: z.string().optional(),
  type: z.enum(['investisseurs', 'agents', 'artisans', 'ville', 'pays', 'theme']),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']).optional(),
  city: z.string().optional(),
  isPrivate: z.boolean().default(false),
  coverImage: z.string().url().optional(),
});

export const communityEventCreateSchema = z.object({
  title: z.string().min(2, "Le titre de l'événement est requis"),
  description: z.string().optional(),
  eventType: z.enum(['meetup', 'webinar', 'formation', 'visite']),
  country: z.enum(['BJ', 'CI', 'BF', 'TG']).optional(),
  city: z.string().optional(),
  venue: z.string().optional(),
  eventDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  isVirtual: z.boolean().default(false),
  meetingUrl: z.string().url().optional(),
  maxAttendees: z.number().int().positive().optional(),
  image: z.string().url().optional(),
});

export type CommunityPostCreateInput = z.infer<typeof communityPostCreateSchema>;
export type CommunityGroupCreateInput = z.infer<typeof communityGroupCreateSchema>;
export type CommunityEventCreateInput = z.infer<typeof communityEventCreateSchema>;
