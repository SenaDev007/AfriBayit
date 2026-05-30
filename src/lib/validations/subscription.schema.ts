import { z } from 'zod';

export const subscriptionCreateSchema = z.object({
  userId: z.string().min(1, "L'ID utilisateur est requis"),
  planType: z.enum([
    'agent_seed', 'agent_grow', 'agent_lead', 'agent_network',
    'pms_starter', 'pms_pro', 'pms_enterprise',
    'artisan_pro', 'geometer_pro', 'notary_pro',
    'academy_basic', 'academy_pro',
  ]),
  priceXof: z.number().positive('Le prix doit être positif'),
  currency: z.string().default('XOF'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().default(true),
  paymentRef: z.string().optional(),
});

export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;
