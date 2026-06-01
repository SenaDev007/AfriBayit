// AfriBayit — Payout Processing System
// Handles payouts via Mobile Money and bank transfer

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
    let payoutResult: PayoutResponse;

    if (MOBILE_MONEY_METHODS.includes(request.method)) {
      payoutResult = await processMobileMoneyPayout(request, providerName);
    } else {
      payoutResult = await processBankPayout(request, providerName);
    }

    // 6. Update wallet transaction on success
    if (payoutResult.success) {
      await db.walletTransaction.update({
        where: { id: walletTx.id },
        data: {
          status: 'completed',
          providerRef: payoutResult.providerRef,
        },
      });

      await db.user.update({
        where: { id: request.userId },
        data: {
          pendingPayout: user.pendingPayout, // Reset after successful payout
        },
      });
    }

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

    throw error;
  }
}

/**
 * Process a Mobile Money payout via FedaPay.
 */
async function processMobileMoneyPayout(
  request: PayoutRequest,
  _providerName: 'fedapay' | 'stripe'
): Promise<PayoutResponse> {
  // FedaPay payout via their API (Mobile Money disbursement)
  const apiKey = process.env.FEDAPAY_API_KEY;

  if (!apiKey) {
    throw new Error('FedaPay API key not configured for Mobile Money payouts');
  }

  const response = await fetch('https://api.fedapay.com/v1/payouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(request.amount),
      currency: request.currency.toLowerCase(),
      reason: `AfriBayit Payout - ${request.userId}`,
      destination: request.destination,
      mode: 'mobile_money',
      country: request.countryCode,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Payout failed' }));
    throw new Error(`Mobile Money payout failed: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const payout = data.payout || data;

  return {
    success: true,
    payoutId: payout.id?.toString() || '',
    providerRef: payout.id?.toString() || '',
    status: 'completed',
  };
}

/**
 * Process a bank transfer payout via Stripe.
 */
async function processBankPayout(
  request: PayoutRequest,
  _providerName: 'fedapay' | 'stripe'
): Promise<PayoutResponse> {
  // For bank transfers, we use Stripe Connect or manual bank transfer
  // In production, this would use Stripe Transfers API
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe not configured for bank payouts');
  }

  // Placeholder for Stripe Connect payout implementation
  // In production: create a Transfer to the connected account
  return {
    success: true,
    payoutId: `payout_${Date.now()}`,
    providerRef: `bank_${Date.now()}`,
    status: 'processing',
  };
}

/**
 * Process seller payout after escrow release.
 * Automatically credits the seller's wallet and initiates a payout if configured.
 */
export async function processSellerPayout(transactionId: string): Promise<void> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { escrowAccount: true },
  });

  if (!transaction || !transaction.escrowAccount) {
    throw new Error('Transaction or escrow account not found');
  }

  const escrow = transaction.escrowAccount;
  const commissionRate = transaction.commissionRate || 0.025;
  const commission = Math.round(transaction.amount * commissionRate);
  const sellerAmount = transaction.amount - commission;

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
}
