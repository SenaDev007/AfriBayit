import { z } from 'zod';

export const transactionCreateSchema = z.object({
  propertyId: z.string().min(1, "L'ID propriété est requis"),
  buyerId: z.string().min(1, "L'ID acheteur est requis"),
  sellerId: z.string().min(1, "L'ID vendeur est requis"),
  amount: z.number().positive('Le montant doit être positif'),
  commission: z.number().min(0).default(0),
  currency: z.string().default('XOF'),
  conditions: z.record(z.string(), z.unknown()).optional(),
  notaryId: z.string().optional(),
  geometerId: z.string().optional(),
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
