// AfriBayit — Auto-Payout J+1 Engine
// Automatically schedules and processes payouts to sellers/owners
// after transaction completion based on payment method:
//   - Mobile Money: J+1 (next business day)
//   - Bank Transfer: J+3
//   - FedaPay: J+1

import { db } from '@/lib/db';
import { getProvider, selectBestProvider } from '@/lib/payments/index';
import type { PaymentMethod } from '@/lib/payments/types';
import { MOBILE_MONEY_METHODS } from '@/lib/payments/types';

export type PayoutMethod = 'mobile_money' | 'bank_transfer' | 'fedapay';

export interface SchedulePayoutParams {
  transactionId: string;
  amount: number;
  recipient: string; // recipient userId
  method: PayoutMethod;
  scheduledAt?: Date; // override the calculated schedule
  destination?: string; // phone number or bank ref
  country?: string;
  currency?: string;
}

export interface ProcessPayoutResult {
  success: boolean;
  payoutId: string;
  providerRef?: string;
  confirmationRef?: string;
  status: string;
  error?: string;
}

/**
 * Calculate the payout execution date based on method.
 * - Mobile Money: J+1 (next business day)
 * - Bank Transfer: J+3
 * - FedaPay: J+1
 */
export function calculatePayoutSchedule(
  transactionDate: Date,
  method: PayoutMethod
): Date {
  const schedule = new Date(transactionDate);

  switch (method) {
    case 'mobile_money':
      // J+1: next business day
      schedule.setDate(schedule.getDate() + 1);
      break;
    case 'fedapay':
      // J+1: next business day
      schedule.setDate(schedule.getDate() + 1);
      break;
    case 'bank_transfer':
      // J+3: 3 business days
      let daysAdded = 0;
      while (daysAdded < 3) {
        schedule.setDate(schedule.getDate() + 1);
        const dayOfWeek = schedule.getDay();
        // Skip weekends (0=Sunday, 6=Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysAdded++;
        }
      }
      break;
    default:
      // Default J+1
      schedule.setDate(schedule.getDate() + 1);
  }

  // Skip weekends for J+1 methods too
  if (method === 'mobile_money' || method === 'fedapay') {
    const dayOfWeek = schedule.getDay();
    if (dayOfWeek === 0) {
      // Sunday → Monday
      schedule.setDate(schedule.getDate() + 1);
    } else if (dayOfWeek === 6) {
      // Saturday → Monday
      schedule.setDate(schedule.getDate() + 2);
    }
  }

  // Set execution time to 08:00 UTC
  schedule.setHours(8, 0, 0, 0);

  return schedule;
}

/**
 * Determine the payout method from a PaymentMethod type.
 */
export function mapPaymentMethodToPayoutMethod(method: PaymentMethod): PayoutMethod {
  if (MOBILE_MONEY_METHODS.includes(method)) {
    return 'mobile_money';
  }
  if (method === 'bank_transfer') {
    return 'bank_transfer';
  }
  // Default to FedaPay for cards and other methods
  return 'fedapay';
}

/**
 * Schedule a payout for a transaction.
 * Creates a ScheduledPayout record with the calculated execution date.
 */
export async function schedulePayout(
  params: SchedulePayoutParams
): Promise<{ id: string; scheduledAt: Date; status: string }> {
  const {
    transactionId,
    amount,
    recipient,
    method,
    scheduledAt: overrideScheduledAt,
    destination,
    country = 'BJ',
    currency = 'XOF',
  } = params;

  // Calculate scheduled date
  const transactionDate = new Date();
  const scheduledAt = overrideScheduledAt || calculatePayoutSchedule(transactionDate, method);

  // Get recipient's payout destination if not provided
  let payoutDestination = destination;
  if (!payoutDestination) {
    const user = await db.user.findUnique({
      where: { id: recipient },
      select: { phone: true, country: true },
    });
    payoutDestination = user?.phone || '';
  }

  // Create the scheduled payout
  const payout = await db.scheduledPayout.create({
    data: {
      transactionId,
      recipientId: recipient,
      amount,
      currency,
      method,
      destination: payoutDestination,
      country,
      status: 'scheduled',
      scheduledAt,
      metadata: JSON.stringify({
        scheduledBy: 'system',
        originalAmount: amount,
        method,
      }),
    },
  });

  return {
    id: payout.id,
    scheduledAt: payout.scheduledAt,
    status: payout.status,
  };
}

/**
 * Process a scheduled payout.
 * Executes the payout via the appropriate payment provider.
 */
export async function processPayout(payoutId: string): Promise<ProcessPayoutResult> {
  const payout = await db.scheduledPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    return {
      success: false,
      payoutId,
      status: 'failed',
      error: 'Payout not found',
    };
  }

  if (payout.status === 'completed') {
    return {
      success: true,
      payoutId,
      providerRef: payout.providerRef || undefined,
      confirmationRef: payout.confirmationRef || undefined,
      status: 'completed',
    };
  }

  if (payout.status === 'processing') {
    return {
      success: false,
      payoutId,
      status: 'processing',
      error: 'Payout is already being processed',
    };
  }

  // Mark as processing
  await db.scheduledPayout.update({
    where: { id: payoutId },
    data: { status: 'processing', updatedAt: new Date() },
  });

  try {
    let providerRef = '';
    let confirmationRef = '';

    // Process based on method
    const paymentMethod = payout.method === 'mobile_money'
      ? 'mobile_money_mtn' as PaymentMethod
      : payout.method === 'bank_transfer'
        ? 'bank_transfer' as PaymentMethod
        : 'mobile_money_mtn' as PaymentMethod; // fedapay defaults to mobile money

    // Use the existing payout system
    const { processPayout: executePayout } = await import('@/lib/payments/payout');

    const payoutResult = await executePayout({
      userId: payout.recipientId,
      amount: payout.amount,
      currency: payout.currency,
      method: paymentMethod,
      destination: payout.destination,
      countryCode: payout.country,
    });

    if (payoutResult.success) {
      providerRef = payoutResult.providerRef;
      confirmationRef = payoutResult.payoutId;

      // Mark as completed
      await db.scheduledPayout.update({
        where: { id: payoutId },
        data: {
          status: 'completed',
          processedAt: new Date(),
          providerRef,
          confirmationRef,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        payoutId,
        providerRef,
        confirmationRef,
        status: 'completed',
      };
    } else {
      throw new Error('Payout provider returned unsuccessful');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Increment retry count
    const updatedRetryCount = payout.retryCount + 1;
    const newStatus = updatedRetryCount >= payout.maxRetries ? 'failed' : 'scheduled';

    await db.scheduledPayout.update({
      where: { id: payoutId },
      data: {
        status: newStatus,
        retryCount: updatedRetryCount,
        failureReason: errorMessage,
        updatedAt: new Date(),
      },
    });

    return {
      success: false,
      payoutId,
      status: newStatus,
      error: errorMessage,
    };
  }
}

/**
 * Schedule a payout automatically after escrow release.
 * Called when a transaction's escrow is released.
 */
export async function schedulePayoutAfterRelease(
  transactionId: string
): Promise<{ id: string; scheduledAt: Date; status: string } | null> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { escrowAccount: true },
  });

  if (!transaction || transaction.status !== 'RELEASED') {
    return null;
  }

  // Calculate seller amount (minus commission)
  const commissionRate = transaction.commissionRate || 0.025;
  const commission = Math.round(transaction.amount * commissionRate);
  const sellerAmount = transaction.amount - commission;

  // Determine payout method based on original payment method
  const originalMethod = transaction.paymentProvider === 'stripe' ? 'bank_transfer' : 'mobile_money';

  // Get seller details
  const seller = await db.user.findUnique({
    where: { id: transaction.sellerId },
    select: { phone: true, country: true },
  });

  return schedulePayout({
    transactionId,
    amount: sellerAmount,
    recipient: transaction.sellerId,
    method: originalMethod as PayoutMethod,
    destination: seller?.phone || undefined,
    country: seller?.country || transaction.country,
    currency: transaction.currency,
  });
}
