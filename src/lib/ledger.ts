/**
 * Ledger financier double-entrée (CDC §7B)
 * Chaque entrée est chaînée par hash SHA256 — immuable a posteriori.
 * Conforme BCEAO : toute transaction escrow génère des entrées comptables.
 */

import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export interface LedgerInput {
  escrowId?: string;
  entryType: "DEPOSIT" | "COMMISSION" | "RELEASE" | "REFUND" | "ADJUSTMENT";
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  description: string;
}

/**
 * Writes a ledger entry with hash-chaining for audit immutability.
 * Always call this after mutating an escrow state.
 */
export async function writeLedgerEntry(input: LedgerInput) {
  // Get last entry to chain hashes
  const last = await prisma.ledgerEntry.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, hash: true },
  });

  const prevHash = last?.hash ?? "genesis";

  // Build hash of this entry (prevHash + content)
  const content = `${prevHash}:${input.escrowId ?? ""}:${input.entryType}:${input.debitAccount}:${input.creditAccount}:${input.amount}:${input.currency}:${Date.now()}`;
  const hash = createHash("sha256").update(content).digest("hex");

  return prisma.ledgerEntry.create({
    data: {
      escrowId: input.escrowId,
      entryType: input.entryType as any,
      debitAccount: input.debitAccount,
      creditAccount: input.creditAccount,
      amount: input.amount,
      currency: input.currency as any,
      description: input.description,
      prevHash,
      hash,
    },
  });
}

/**
 * Writes the 3 standard ledger entries when an escrow is released (CDC §7B):
 * 1. RELEASE  : escrow:platform → seller:sellerId (netAmount)
 * 2. COMMISSION: escrow:platform → platform:revenue (commission)
 */
export async function writeLedgerRelease(escrow: {
  id: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  netAmount: number;
  commission: number;
  currency: string;
  reference: string;
}) {
  await writeLedgerEntry({
    escrowId: escrow.id,
    entryType: "RELEASE",
    debitAccount: "escrow:platform",
    creditAccount: `seller:${escrow.sellerId}`,
    amount: escrow.netAmount,
    currency: escrow.currency,
    description: `Libération fonds vendeur — ${escrow.reference}`,
  });

  if (escrow.commission > 0) {
    await writeLedgerEntry({
      escrowId: escrow.id,
      entryType: "COMMISSION",
      debitAccount: "escrow:platform",
      creditAccount: "platform:revenue",
      amount: escrow.commission,
      currency: escrow.currency,
      description: `Commission AfriBayit — ${escrow.reference}`,
    });
  }
}

/**
 * Writes a REFUND ledger entry.
 */
export async function writeLedgerRefund(escrow: {
  id: string;
  buyerId: string;
  amount: number;
  currency: string;
  reference: string;
}) {
  await writeLedgerEntry({
    escrowId: escrow.id,
    entryType: "REFUND",
    debitAccount: "escrow:platform",
    creditAccount: `buyer:${escrow.buyerId}`,
    amount: escrow.amount,
    currency: escrow.currency,
    description: `Remboursement acheteur — ${escrow.reference}`,
  });
}
