import { z } from 'zod';

export const escrowCreateSchema = z.object({
  transactionId: z.string().min(1, "L'ID transaction est requis"),
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.string().default('XOF'),
});

export const escrowLedgerEntrySchema = z.object({
  entryType: z.enum(['CREDIT', 'DEBIT', 'HOLD', 'RELEASE', 'REFUND', 'COMMISSION']),
  amount: z.number().positive('Le montant doit être positif'),
  reference: z.string().optional(),
  providerRef: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type EscrowCreateInput = z.infer<typeof escrowCreateSchema>;
export type EscrowLedgerEntryInput = z.infer<typeof escrowLedgerEntrySchema>;
