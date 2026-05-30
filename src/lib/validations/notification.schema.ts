import { z } from 'zod';

export const notificationCreateSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  type: z.enum(['transaction', 'message', 'alert', 'system', 'promotion', 'community', 'rebecca', 'certification', 'profile', 'premium', 'security']),
  category: z.enum(['profile', 'annonces', 'transactions', 'market_alerts', 'rebecca', 'community', 'formations', 'certification', 'premium', 'security']),
  title: z.string().min(1, 'Le titre est requis'),
  message: z.string().min(1, 'Le message est requis'),
  actionUrl: z.string().optional(),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  channels: z.array(z.enum(['push', 'email', 'sms', 'whatsapp'])).optional(),
});

export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
