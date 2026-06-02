// AfriBayit — Payout Processing System
// Handles payouts via Mobile Money and bank transfer
// Uses the Payment Abstraction Layer (FedaPayProvider) for actual transfers
// + J+1 Auto-Payout for escrow releases via Mobile Money

import { db } from '@/lib/db';
import { getProvider, selectBestProvider } from './index';
import type { PaymentMethod, PayoutRequest, PayoutResponse } from './types';
import { MOBILE_MONEY_METHODS } from './types';

/** Commission rates by transaction amount range */
const COMMISSION_RATES = [
  { maxAmount: 5_000_000, rate: 0.05 },    // 5% for amounts up to 5M FCFA
  { maxAmount: 20_000_000, rate: 0.035 },   // 3.5% for 5M-20M FCFA
  { maxAmount: 50_000_000, rate: 0.025 },   // 2.5% for 20M-50M FCFA
  { maxAmount: Infinity, rate: 0.02 },       // 2% for amounts above 50M FCFA
];

// ============ J+1 Auto-Payout Constants ============

/** Minimum payout amount in FCFA — below this, hold until threshold reached */
const MIN_PAYOUT_AMOUNT = 5_000;

/** Maximum payout per single transaction in FCFA — split if needed */
const MAX_PAYOUT_PER_TX = 2_000_000;

/** Maximum retry attempts for failed payouts */
const MAX_RETRY_ATTEMPTS = 3;

/** Daily batch processing hour (UTC) */
const BATCH_PROCESSING_HOUR_UTC = 9;

/** Supported Mobile Money providers per country */
const MOBILE_MONEY_PROVIDERS: Record<string, { method: PaymentMethod; name: string }[]> = {
  BJ: [
    { method: 'mobile_money_mtn', name: 'MTN MoMo' },
    { method: 'mobile_money_moov', name: 'Moov Money' },
    { method: 'mobile_money_orange', name: 'Orange Money' },
  ],
  CI: [
    { method: 'mobile_money_mtn', name: 'MTN MoMo' },
    { method: 'mobile_money_moov', name: 'Moov Money' },
    { method: 'mobile_money_orange', name: 'Orange Money' },
  ],
  BF: [
    { method: 'mobile_money_mtn', name: 'MTN MoMo' },
    { method: 'mobile_money_moov', name: 'Moov Money' },
  ],
  TG: [
    { method: 'mobile_money_mtn', name: 'MTN MoMo' },
    { method: 'mobile_money_moov', name: 'Moov Money' },
  ],
};

/** Mobile Money number validation patterns per country */
const MOMO_PATTERNS: Record<string, { prefix: string[]; length: number }> = {
  BJ: { prefix: ['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'], length: 8 },
  CI: { prefix: ['01', '02', '03', '04', '05', '06', '07', '08', '09'], length: 10 },
  BF: { prefix: ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'], length: 8 },
  TG: { prefix: ['90', '91', '92', '93', '94', '95', '96', '97', '98', '99'], length: 8 },
};

// ============ J+1 Payout Scheduling ============

export interface ScheduledPayout {
  id: string;
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  destination: string;
  countryCode: string;
  scheduledFor: Date;
  status: 'scheduled' | 'processing' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  createdAt: Date;
  processedAt?: Date;
  providerRef?: string;
  error?: string;
}

/**
 * Validate a Mobile Money phone number for a specific country.
 * Returns the cleaned number if valid, or null if invalid.
 */
export function validateMobileMoneyNumber(phone: string, countryCode: string): { valid: boolean; cleaned: string; error?: string } {
  // Strip spaces, dashes, and leading +
  const cleaned = phone.replace(/[\s\-+]/g, '');

  // Remove country code prefix if present
  const countryPrefixes: Record<string, string> = {
    BJ: '229',
    CI: '225',
    BF: '226',
    TG: '228',
  };

  let localNumber = cleaned;
  const prefix = countryPrefixes[countryCode];
  if (prefix && cleaned.startsWith(prefix)) {
    localNumber = cleaned.substring(prefix.length);
  }

  const pattern = MOMO_PATTERNS[countryCode];
  if (!pattern) {
    return { valid: false, cleaned, error: `Pays non supporté : ${countryCode}` };
  }

  if (localNumber.length !== pattern.length) {
    return { valid: false, cleaned, error: `Numéro invalide : ${localNumber.length} chiffres (attendu ${pattern.length})` };
  }

  const startsWithValidPrefix = pattern.prefix.some(p => localNumber.startsWith(p));
  if (!startsWithValidPrefix) {
    return { valid: false, cleaned, error: `Préfixe invalide pour ${countryCode}` };
  }

  return { valid: true, cleaned: localNumber };
}

/**
 * Get the next business day (J+1) from now.
 * Skips weekends (Saturday/Sunday).
 */
export function getNextBusinessDay(fromDate: Date = new Date()): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);

  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }

  // Set to batch processing hour (9am UTC)
  next.setHours(BATCH_PROCESSING_HOUR_UTC, 0, 0, 0);

  return next;
}

/**
 * Schedule a J+1 auto-payout when escrow is released.
 * Stores the scheduled payout as a WalletTransaction with type 'auto_payout_scheduled'.
 */
export async function scheduleJ1Payout(
  userId: string,
  transactionId: string,
  amount: number,
  currency: string,
  method: PaymentMethod,
  destination: string,
  countryCode: string
): Promise<ScheduledPayout> {
  const scheduledFor = getNextBusinessDay();

  // Validate Mobile Money number
  if (MOBILE_MONEY_METHODS.includes(method)) {
    const validation = validateMobileMoneyNumber(destination, countryCode);
    if (!validation.valid) {
      throw new Error(`Numéro Mobile Money invalide : ${validation.error}`);
    }
  }

  // Check minimum payout amount — if below, hold until threshold
  if (amount < MIN_PAYOUT_AMOUNT) {
    // Create a "held" payout that will accumulate
    await db.walletTransaction.create({
      data: {
        userId,
        type: 'payout_held',
        amount: -amount,
        balanceAfter: 0, // Will be updated
        currency,
        status: 'pending',
        reference: transactionId,
        metadata: JSON.stringify({
          reason: 'below_minimum',
          minAmount: MIN_PAYOUT_AMOUNT,
          scheduledAmount: amount,
          method,
          destination,
          countryCode,
          scheduledFor: scheduledFor.toISOString(),
        }),
      },
    });

    return {
      id: `held_${transactionId}`,
      userId,
      transactionId,
      amount,
      currency,
      method,
      destination,
      countryCode,
      scheduledFor,
      status: 'scheduled',
      retryCount: 0,
      createdAt: new Date(),
    };
  }

  // Split if amount exceeds max per transaction
  const payouts: ScheduledPayout[] = [];
  let remaining = amount;
  let splitIndex = 0;

  while (remaining > 0) {
    const chunkAmount = Math.min(remaining, MAX_PAYOUT_PER_TX);
    const walletTx = await db.walletTransaction.create({
      data: {
        userId,
        type: 'auto_payout_scheduled',
        amount: -chunkAmount,
        balanceAfter: 0,
        currency,
        status: 'pending',
        reference: `${transactionId}_j1${splitIndex > 0 ? `_${splitIndex}` : ''}`,
        metadata: JSON.stringify({
          transactionId,
          payoutType: 'j1_auto',
          method,
          destination,
          countryCode,
          scheduledFor: scheduledFor.toISOString(),
          splitIndex,
          totalSplits: Math.ceil(amount / MAX_PAYOUT_PER_TX),
          originalAmount: amount,
          chunkAmount,
          retryCount: 0,
          maxRetries: MAX_RETRY_ATTEMPTS,
        }),
      },
    });

    payouts.push({
      id: walletTx.id,
      userId,
      transactionId,
      amount: chunkAmount,
      currency,
      method,
      destination,
      countryCode,
      scheduledFor,
      status: 'scheduled',
      retryCount: 0,
      createdAt: new Date(),
    });

    remaining -= chunkAmount;
    splitIndex++;
  }

  return payouts[0]; // Return the first (or only) scheduled payout
}

/**
 * Process all scheduled J+1 payouts that are due.
 * Called by the daily batch processor at 9am UTC.
 * Idempotent — will not double-pay already completed payouts.
 */
export async function processScheduledPayouts(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  results: Array<{ payoutId: string; status: string; error?: string }>;
}> {
  const now = new Date();

  // Find all scheduled payouts that are due
  const scheduledPayouts = await db.walletTransaction.findMany({
    where: {
      type: 'auto_payout_scheduled',
      status: 'pending',
    },
    take: 100, // Process in batches of 100
  });

  const results: Array<{ payoutId: string; status: string; error?: string }> = [];
  let succeeded = 0;
  let failed = 0;

  for (const payout of scheduledPayouts) {
    const metadata = payout.metadata ? JSON.parse(payout.metadata as string) as Record<string, unknown> : {};
    const scheduledFor = metadata.scheduledFor as string | undefined;

    // Only process payouts that are scheduled for today or earlier
    if (scheduledFor && new Date(scheduledFor) > now) {
      continue;
    }

    const method = metadata.method as PaymentMethod;
    const destination = metadata.destination as string;
    const countryCode = metadata.countryCode as string;
    const retryCount = (metadata.retryCount as number) || 0;
    const maxRetries = (metadata.maxRetries as number) || MAX_RETRY_ATTEMPTS;

    try {
      // Mark as processing to prevent concurrent processing (idempotency)
      await db.walletTransaction.update({
        where: { id: payout.id },
        data: {
          status: 'completed', // Use as lock — will revert to pending on failure
          metadata: JSON.stringify({ ...metadata, processingAt: now.toISOString() }),
        },
      });

      const payoutRequest: PayoutRequest = {
        userId: payout.userId,
        amount: Math.abs(payout.amount),
        currency: payout.currency,
        method,
        destination,
        countryCode,
      };

      const providerName = selectBestProvider(countryCode, method);
      const provider = getProvider(providerName);
      const payoutResult = await provider.processPayout(payoutRequest);

      if (payoutResult.success) {
        // Mark as completed
        await db.walletTransaction.update({
          where: { id: payout.id },
          data: {
            status: 'completed',
            providerRef: payoutResult.providerRef,
            metadata: JSON.stringify({
              ...metadata,
              completedAt: now.toISOString(),
              providerRef: payoutResult.providerRef,
              payoutId: payoutResult.payoutId,
            }),
          },
        });
        succeeded++;
        results.push({ payoutId: payout.id, status: 'completed' });
      } else {
        throw new Error(`Payout failed: status=${payoutResult.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      // Check if we should retry
      if (retryCount < maxRetries) {
        // Schedule retry
        await db.walletTransaction.update({
          where: { id: payout.id },
          data: {
            status: 'pending', // Reset to pending for next batch
            metadata: JSON.stringify({
              ...metadata,
              retryCount: retryCount + 1,
              lastError: errorMessage,
              lastRetryAt: now.toISOString(),
              nextRetryScheduled: getNextBusinessDay(now).toISOString(),
            }),
          },
        });
        results.push({ payoutId: payout.id, status: 'retrying', error: errorMessage });
      } else {
        // Max retries reached — mark as failed
        await db.walletTransaction.update({
          where: { id: payout.id },
          data: {
            status: 'failed',
            metadata: JSON.stringify({
              ...metadata,
              retryCount,
              lastError: errorMessage,
              failedAt: now.toISOString(),
              maxRetriesReached: true,
            }),
          },
        });

        // Refund the user's wallet for the failed payout
        const refundAmount = Math.abs(payout.amount);
        const user = await db.user.findUnique({
          where: { id: payout.userId },
          select: { walletBalance: true },
        });

        if (user) {
          await db.user.update({
            where: { id: payout.userId },
            data: { walletBalance: user.walletBalance + refundAmount },
          });
        }

        failed++;
        results.push({ payoutId: payout.id, status: 'failed', error: errorMessage });
      }
    }
  }

  return {
    processed: scheduledPayouts.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * Process held payouts that have accumulated above the minimum threshold.
 */
export async function processHeldPayouts(): Promise<{
  released: number;
  totalUsers: number;
}> {
  // Find users with held payouts
  const heldPayouts = await db.walletTransaction.findMany({
    where: {
      type: 'payout_held',
      status: 'pending',
    },
  });

  // Group by user
  const byUser = new Map<string, number>();
  for (const hp of heldPayouts) {
    const current = byUser.get(hp.userId) || 0;
    byUser.set(hp.userId, current + Math.abs(hp.amount));
  }

  let released = 0;
  let totalUsers = 0;

  for (const [userId, totalAmount] of byUser) {
    if (totalAmount >= MIN_PAYOUT_AMOUNT) {
      // Find the latest held payout to get destination info
      const latestHeld = heldPayouts
        .filter(hp => hp.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (latestHeld?.metadata) {
        const metadata = JSON.parse(latestHeld.metadata as string) as Record<string, unknown>;

        // Schedule the combined payout
        await scheduleJ1Payout(
          userId,
          latestHeld.reference || 'held_accumulation',
          totalAmount,
          latestHeld.currency,
          metadata.method as PaymentMethod,
          metadata.destination as string,
          metadata.countryCode as string,
        );

        // Mark all held payouts as processed
        const userHeldIds = heldPayouts
          .filter(hp => hp.userId === userId)
          .map(hp => hp.id);

        await db.walletTransaction.updateMany({
          where: { id: { in: userHeldIds } },
          data: { status: 'completed' },
        });

        released += totalAmount;
        totalUsers++;
      }
    }
  }

  return { released, totalUsers };
}

// ============ Original Payout Functions ============

/**
 * Calculate commission for a transaction amount.
 */
export function calculateCommission(amount: number): { rate: number; commission: number } {
  for (const tier of COMMISSION_RATES) {
    if (amount <= tier.maxAmount) {
      return {
        rate: tier.rate,
        commission: Math.round(amount * tier.rate),
      };
    }
  }
  return { rate: 0.02, commission: Math.round(amount * 0.02) };
}

/**
 * Validate that a user can request a payout.
 * Checks: wallet balance, KYC level, no existing pending payouts of same type.
 */
export async function validatePayoutEligibility(
  userId: string,
  amount: number
): Promise<{ eligible: boolean; reason?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      walletBalance: true,
      kycLevel: true,
      pendingPayout: true,
    },
  });

  if (!user) {
    return { eligible: false, reason: 'Utilisateur introuvable' };
  }

  // Check wallet balance
  if (user.walletBalance < amount) {
    return {
      eligible: false,
      reason: `Solde insuffisant. Solde: ${user.walletBalance} FCFA, Demandé: ${amount} FCFA`,
    };
  }

  // Require KYC level 2 for payouts
  if (user.kycLevel < 2) {
    return {
      eligible: false,
      reason: 'Niveau KYC insuffisant. Vérification d\'identité (niveau 2) requise pour les retraits.',
    };
  }

  return { eligible: true };
}

/**
 * Process a payout request.
 * Creates a WalletTransaction and initiates the transfer via the payment provider.
 */
export async function processPayout(request: PayoutRequest): Promise<PayoutResponse> {
  // 1. Validate eligibility
  const validation = await validatePayoutEligibility(request.userId, request.amount);
  if (!validation.eligible) {
    throw new Error(validation.reason || 'Payout not eligible');
  }

  // 2. Select provider based on method and country
  const providerName = selectBestProvider(request.countryCode, request.method);
  const provider = getProvider(providerName);

  // 3. Deduct from wallet and create pending transaction
  const user = await db.user.findUnique({ where: { id: request.userId } });
  if (!user) throw new Error('User not found');

  const newBalance = user.walletBalance - request.amount;

  const walletTx = await db.walletTransaction.create({
    data: {
      userId: request.userId,
      type: 'payout',
      amount: -request.amount,
      balanceAfter: newBalance,
      currency: request.currency,
      status: 'pending',
      metadata: JSON.stringify({
        method: request.method,
        destination: request.destination,
        countryCode: request.countryCode,
        provider: providerName,
      }),
    },
  });

  // 4. Update user's wallet balance and pending payout
  await db.user.update({
    where: { id: request.userId },
    data: {
      walletBalance: newBalance,
      pendingPayout: user.pendingPayout + request.amount,
    },
  });

  // 5. Attempt the payout via provider
  try {
    const payoutResult = await provider.processPayout(request);

    // 6. Update wallet transaction on success
    if (payoutResult.success) {
      await db.walletTransaction.update({
        where: { id: walletTx.id },
        data: {
          status: payoutResult.status === 'completed' ? 'completed' : 'pending',
          providerRef: payoutResult.providerRef,
        },
      });

      // Only reset pending payout if fully completed
      if (payoutResult.status === 'completed') {
        await db.user.update({
          where: { id: request.userId },
          data: {
            pendingPayout: user.pendingPayout, // Reset after successful payout
          },
        });
      }
    }

    console.log(`[Payout] Payout ${payoutResult.payoutId} processed via ${providerName}: status=${payoutResult.status}`);

    return payoutResult;
  } catch (error) {
    // Payout failed — revert wallet deduction
    await db.walletTransaction.update({
      where: { id: walletTx.id },
      data: { status: 'failed' },
    });

    await db.user.update({
      where: { id: request.userId },
      data: {
        walletBalance: user.walletBalance, // Restore original balance
        pendingPayout: user.pendingPayout,
      },
    });

    console.error(`[Payout] Payout failed via ${providerName}:`, error);
    throw error;
  }
}

/**
 * Process a Mobile Money payout via FedaPay.
 * @deprecated Use processPayout() instead, which routes through the PAL.
 */
export async function processMobileMoneyPayout(
  request: PayoutRequest
): Promise<PayoutResponse> {
  const provider = getProvider('fedapay');
  return provider.processPayout(request);
}

/**
 * Process seller payout after escrow release.
 * Automatically credits the seller's wallet and schedules a J+1 auto-payout.
 */
export async function processSellerPayout(transactionId: string): Promise<void> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { escrowAccount: true, property: { select: { title: true } } },
  });

  if (!transaction || !transaction.escrowAccount) {
    throw new Error('Transaction or escrow account not found');
  }

  const escrow = transaction.escrowAccount;
  const commissionRate = transaction.commissionRate || 0.025;
  const commission = Math.round(transaction.amount * commissionRate);
  const sellerAmount = transaction.amount - commission;

  console.log(`[Payout] Processing seller payout for transaction ${transactionId}: ${sellerAmount} XOF (commission: ${commission})`);

  // Credit seller's wallet
  const seller = await db.user.findUnique({
    where: { id: transaction.sellerId },
  });

  if (!seller) {
    throw new Error('Seller not found');
  }

  const newBalance = seller.walletBalance + sellerAmount;

  await db.$transaction([
    db.user.update({
      where: { id: transaction.sellerId },
      data: { walletBalance: newBalance },
    }),
    db.walletTransaction.create({
      data: {
        userId: transaction.sellerId,
        type: 'escrow_release',
        amount: sellerAmount,
        balanceAfter: newBalance,
        currency: transaction.currency,
        status: 'completed',
        reference: transactionId,
        metadata: JSON.stringify({
          transactionId,
          escrowAmount: escrow.heldAmount,
          commission,
          commissionRate,
          sellerAmount,
          propertyTitle: transaction.property?.title,
        }),
      },
    }),
    // Credit commission to platform wallet (admin)
    db.walletTransaction.create({
      data: {
        userId: 'platform',
        type: 'commission',
        amount: commission,
        balanceAfter: 0, // Platform balance tracked separately
        currency: transaction.currency,
        status: 'completed',
        reference: transactionId,
        metadata: JSON.stringify({
          transactionId,
          commissionRate,
          commission,
        }),
      },
    }),
  ]);

  // Schedule J+1 auto-payout if seller has a phone number and Mobile Money configured
  if (seller.phone && seller.country) {
    try {
      // Determine the best Mobile Money method based on seller's country
      const availableProviders = MOBILE_MONEY_PROVIDERS[seller.country] || [];
      if (availableProviders.length > 0) {
        const defaultMethod = availableProviders[0]; // Use first available provider
        await scheduleJ1Payout(
          seller.id,
          transactionId,
          sellerAmount,
          transaction.currency,
          defaultMethod.method,
          seller.phone,
          seller.country,
        );
        console.log(`[Payout] J+1 auto-payout scheduled for seller ${seller.id}: ${sellerAmount} XOF via ${defaultMethod.name}`);
      }
    } catch (error) {
      console.error(`[Payout] J+1 scheduling failed for seller ${seller.id}:`, error);
      // Non-critical — seller can still request manual payout
    }
  }

  console.log(`[Payout] Seller wallet credited: ${sellerAmount} XOF for transaction ${transactionId}`);
}

/**
 * Get available Mobile Money providers for a country.
 */
export function getMobileMoneyProviders(countryCode: string): { method: PaymentMethod; name: string }[] {
  return MOBILE_MONEY_PROVIDERS[countryCode] || [];
}

/**
 * Get payout status by wallet transaction ID.
 */
export async function getPayoutStatus(payoutId: string): Promise<{
  id: string;
  status: string;
  amount: number;
  currency: string;
  method?: string;
  destination?: string;
  providerRef?: string;
  retryCount?: number;
  scheduledFor?: string;
  error?: string;
} | null> {
  const tx = await db.walletTransaction.findUnique({
    where: { id: payoutId },
  });

  if (!tx) return null;

  const metadata = tx.metadata ? JSON.parse(tx.metadata as string) as Record<string, unknown> : {};

  return {
    id: tx.id,
    status: tx.status,
    amount: Math.abs(tx.amount),
    currency: tx.currency,
    method: metadata.method as string | undefined,
    destination: metadata.destination as string | undefined,
    providerRef: tx.providerRef,
    retryCount: metadata.retryCount as number | undefined,
    scheduledFor: metadata.scheduledFor as string | undefined,
    error: metadata.lastError as string | undefined,
  };
}
