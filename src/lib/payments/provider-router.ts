// AfriBayit — Payment Provider Router
// Unified payment interface that routes to the correct provider based on country
// BJ/CI/TG → FedaPay (Mobile Money + local cards)
// Others   → Stripe (international cards + bank transfers)

import { createCheckout, verifyTransaction, processPayout as fedapayPayout, chargeMobileMoney } from './fedapay-client';
import { createPaymentIntent, confirmPayment, processRefund as stripeRefund, getPaymentIntentStatus } from './stripe-client';
import { FEDAPAY_COUNTRIES, MOBILE_MONEY_METHODS, CARD_METHODS } from './types';
import type { PaymentProvider, PaymentMethod, PaymentStatus } from './types';

// ============ Types ============

export interface CustomerInfo {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  id?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  provider: PaymentProvider;
  transactionId: string;
  checkoutUrl?: string;   // FedaPay redirect URL
  clientSecret?: string;  // Stripe client secret
  status: PaymentStatus;
  error?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export interface PayoutResult {
  success: boolean;
  provider: PaymentProvider;
  payoutId: string;
  reference?: string;
  status: string;
  error?: string;
}

// ============ Country → Provider Routing ============

/** Countries that use FedaPay as primary payment provider */
const FEDAPAY_PRIMARY_COUNTRIES = ['BJ', 'CI', 'TG', 'BF'];

/**
 * Determine the best payment provider for a given country.
 * - BJ/CI/TG/BF → FedaPay (Mobile Money + local cards)
 * - Others → Stripe (international cards + bank transfer)
 */
export function getProviderForCountry(country: string): PaymentProvider {
  if (FEDAPAY_PRIMARY_COUNTRIES.includes(country.toUpperCase())) {
    return 'fedapay';
  }
  return 'stripe';
}

/**
 * Determine the best payment provider for a given country + method combination.
 */
export function getProviderForMethod(country: string, method: PaymentMethod): PaymentProvider {
  const isFedapayCountry = FEDAPAY_PRIMARY_COUNTRIES.includes(country.toUpperCase());

  // Mobile Money always goes through FedaPay
  if (MOBILE_MONEY_METHODS.includes(method) && isFedapayCountry) {
    return 'fedapay';
  }

  // Cards in WAEMU countries → FedaPay if configured, else Stripe
  if (CARD_METHODS.includes(method) && isFedapayCountry) {
    if (process.env.FEDAPAY_SECRET_KEY || process.env.FEDAPAY_API_KEY) {
      return 'fedapay';
    }
    return 'stripe';
  }

  // Bank transfer always via Stripe
  if (method === 'bank_transfer') {
    return 'stripe';
  }

  // International cards outside WAEMU → Stripe
  if (CARD_METHODS.includes(method)) {
    return 'stripe';
  }

  // Default: FedaPay for WAEMU, Stripe for others
  return isFedapayCountry ? 'fedapay' : 'stripe';
}

// ============ Unified Payment Interface ============

/**
 * Initiate a payment for a transaction.
 * Routes to the correct provider based on country and payment method.
 * Returns a checkout URL (FedaPay) or client secret (Stripe).
 */
export async function initiatePayment(
  amount: number,
  currency: string,
  country: string,
  customerInfo: CustomerInfo,
  metadata?: Record<string, unknown>
): Promise<InitiatePaymentResult> {
  const provider = getProviderForCountry(country);
  const method = metadata?.method as PaymentMethod | undefined;

  // If method is specified, use method-aware routing
  const resolvedProvider = method
    ? getProviderForMethod(country, method)
    : provider;

  if (resolvedProvider === 'fedapay') {
    // FedaPay checkout flow
    const result = await createCheckout({
      amount,
      currency,
      description: (metadata?.description as string) || `AfriBayit — Paiement ${currency}`,
      customerEmail: customerInfo.email,
      customerId: customerInfo.id,
      metadata: {
        ...metadata,
        customerFirstName: customerInfo.firstName,
        customerLastName: customerInfo.lastName,
        customerPhone: customerInfo.phone,
      },
    });

    return {
      success: result.success,
      provider: 'fedapay',
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
      status: result.success ? 'pending' : 'failed',
      error: result.error,
    };
  }

  // Stripe PaymentIntent flow
  const result = await createPaymentIntent({
    amount,
    currency,
    description: (metadata?.description as string) || `AfriBayit — Payment ${currency}`,
    customerEmail: customerInfo.email,
    customerId: customerInfo.id,
    metadata: (metadata as Record<string, string>) || {},
    returnUrl: (metadata?.returnUrl as string) || undefined,
  });

  return {
    success: result.success,
    provider: 'stripe',
    transactionId: result.paymentIntentId,
    clientSecret: result.clientSecret,
    status: mapStripeStatusToPaymentStatus(result.status),
    error: result.error,
  };
}

/**
 * Verify a payment after callback or polling.
 * Routes to the correct provider based on the provider parameter.
 */
export async function verifyPayment(
  transactionId: string,
  provider: PaymentProvider
): Promise<VerifyPaymentResult> {
  if (provider === 'fedapay') {
    const result = await verifyTransaction(transactionId);

    return {
      success: result.status === 'completed',
      provider: 'fedapay',
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      metadata: result.metadata,
      error: result.status === 'failed' ? 'Transaction failed' : undefined,
    };
  }

  // Stripe
  const result = await getPaymentIntentStatus(transactionId);
  if (!result) {
    return {
      success: false,
      provider: 'stripe',
      status: 'failed',
      amount: 0,
      currency: 'EUR',
      error: 'PaymentIntent not found',
    };
  }

  const status = mapStripeStatusToPaymentStatus(result.status);

  return {
    success: status === 'completed',
    provider: 'stripe',
    status,
    amount: result.amount,
    currency: result.currency,
    metadata: result.metadata,
  };
}

/**
 * Initiate a payout to a recipient.
 * Uses FedaPay for Mobile Money in WAEMU countries, Stripe for bank transfers.
 */
export async function initiatePayout(
  amount: number,
  recipient: string,
  country: string,
  method: 'mobile_money' | 'bank_transfer' = 'mobile_money'
): Promise<PayoutResult> {
  const provider = getProviderForCountry(country);

  if (provider === 'fedapay' && method === 'mobile_money') {
    // Determine the Mobile Money network from country
    const network = getDefaultNetwork(country);
    const currency = getCurrencyForCountry(country);

    const result = await fedapayPayout({
      amount,
      recipientPhone: recipient,
      network,
      currency,
    });

    return {
      success: result.success,
      provider: 'fedapay',
      payoutId: result.payoutId,
      reference: result.reference,
      status: result.status,
      error: result.error,
    };
  }

  // Stripe bank transfer (placeholder — requires Stripe Connect)
  return {
    success: false,
    provider: 'stripe',
    payoutId: '',
    status: 'pending',
    error: 'Stripe bank payouts require Stripe Connect configuration',
  };
}

/**
 * Charge a Mobile Money payment directly (no redirect).
 * Only available for FedaPay-supported countries.
 */
export async function chargeMobileMoneyDirect(
  transactionId: string,
  country: string,
  phoneNumber: string
): Promise<{ success: boolean; provider: PaymentProvider; error?: string }> {
  const provider = getProviderForCountry(country);

  if (provider !== 'fedapay') {
    return {
      success: false,
      provider: 'stripe',
      error: 'Mobile Money direct charge not available for this country',
    };
  }

  const network = getDefaultNetwork(country);
  const result = await chargeMobileMoney(transactionId, network, phoneNumber);

  return {
    success: result.success,
    provider: 'fedapay',
    error: result.error,
  };
}

// ============ Helpers ============

/** Map Stripe PaymentIntent status to our PaymentStatus */
function mapStripeStatusToPaymentStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    requires_payment_method: 'pending',
    requires_confirmation: 'pending',
    requires_action: 'pending',
    processing: 'processing',
    requires_capture: 'processing',
    canceled: 'cancelled',
    succeeded: 'completed',
    partially_funded: 'processing',
  };
  return map[status] || 'pending';
}

/** Get the default Mobile Money network for a country */
function getDefaultNetwork(country: string): 'MTN' | 'ORANGE' | 'MOOV' | 'WAVE' {
  const defaults: Record<string, 'MTN' | 'ORANGE' | 'MOOV' | 'WAVE'> = {
    BJ: 'MTN',
    CI: 'ORANGE',
    TG: 'MOOV',
    BF: 'ORANGE',
  };
  return defaults[country.toUpperCase()] || 'MTN';
}

/** Get the currency for a country */
function getCurrencyForCountry(country: string): string {
  const currencies: Record<string, string> = {
    BJ: 'XOF',
    CI: 'XOF',
    TG: 'XOF',
    BF: 'XOF',
    SN: 'XOF',
    ML: 'XOF',
    NE: 'XOF',
    GN: 'GNF',
    GH: 'GHS',
    NG: 'NGN',
    CM: 'XAF',
    GA: 'XAF',
  };
  return currencies[country.toUpperCase()] || 'XOF';
}

/**
 * Get available payment methods for a country.
 */
export function getAvailablePaymentMethods(country: string): {
  provider: PaymentProvider;
  methods: PaymentMethod[];
} {
  const provider = getProviderForCountry(country);
  const methods: PaymentMethod[] = [];

  if (provider === 'fedapay') {
    methods.push('mobile_money_mtn', 'mobile_money_moov', 'mobile_money_orange');
    if (country === 'CI' || country === 'SN') {
      methods.push('mobile_money_wave');
    }
    methods.push('card_visa', 'card_mastercard');
  }

  // Stripe is always available for cards and bank transfers
  if (!methods.includes('card_visa')) {
    methods.push('card_visa', 'card_mastercard');
  }
  if (process.env.STRIPE_SECRET_KEY) {
    methods.push('bank_transfer');
  }

  return { provider, methods };
}
