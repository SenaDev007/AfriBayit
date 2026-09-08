// AfriBayit — FedaPay Client SDK Wrapper
// Wraps the official fedapay Node.js SDK for sandbox/production payment processing
// Supports: checkout sessions, transaction verification, Mobile Money payouts

import { FedaPay, Transaction, Payout, Customer, Webhook } from 'fedapay';

// ============ Initialization ============

let initialized = false;

/**
 * Initialize the FedaPay SDK with environment variables.
 * Called lazily on first use to avoid startup errors when keys are not set.
 */
function ensureInitialized(): void {
  if (initialized) return;

  const apiKey = process.env.FEDAPAY_SECRET_KEY || process.env.FEDAPAY_API_KEY || '';
  const publicKey = process.env.FEDAPAY_PUBLIC_KEY || '';
  const environment = process.env.FEDAPAY_ENVIRONMENT ||
    (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');

  if (apiKey) {
    FedaPay.setApiKey(apiKey);
  }
  if (publicKey) {
    FedaPay.setToken(publicKey);
  }

  FedaPay.setEnvironment(environment);
  FedaPay.setApiVersion('v1');

  initialized = true;
}

// ============ Types ============

export interface CheckoutParams {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutResult {
  success: boolean;
  transactionId: string;
  checkoutUrl?: string;
  token?: string;
  error?: string;
}

export interface VerificationResult {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface PayoutParams {
  amount: number;
  recipientPhone: string;
  network: 'MTN' | 'ORANGE' | 'MOOV' | 'WAVE';
  currency: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId: string;
  reference?: string;
  status: string;
  error?: string;
}

export interface TransactionStatusResult {
  id: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Core Functions ============

/**
 * Create a FedaPay checkout session.
 * Returns a checkout URL that the customer can be redirected to,
 * or a token for direct Mobile Money charging.
 */
export async function createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  ensureInitialized();

  try {
    // Create or find customer
    let customer: Customer | null = null;
    if (params.customerEmail) {
      try {
        const customers = await Customer.all({
          email: params.customerEmail,
        });
        const customerList = customers?.items || customers || [];
        if (Array.isArray(customerList) && customerList.length > 0) {
          customer = customerList[0];
        }
      } catch {
        // Customer not found, will create below
      }

      if (!customer) {
        try {
          customer = await Customer.create({
            email: params.customerEmail,
            firstname: params.metadata?.customerFirstName as string || '',
            lastname: params.metadata?.customerLastName as string || '',
            phone_number: params.metadata?.customerPhone as string || undefined,
          });
        } catch {
          // Customer creation is optional — proceed without
        }
      }
    }

    // Create the transaction
    const transactionData: Record<string, unknown> = {
      amount: Math.round(params.amount),
      currency: params.currency.toLowerCase(),
      description: (params.description as string) || '',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      metadata: {
        ...params.metadata,
        customerId: params.customerId,
      },
    };

    if (customer) {
      transactionData.customer_id = customer.id;
    }

    const transaction = await Transaction.create(transactionData);
    const transactionId = transaction.id?.toString() || '';
    const transactionRef = transaction.reference || transactionId;

    // Generate a payment token for the checkout
    let checkoutUrl: string | undefined;
    let token: string | undefined;

    try {
      const tokenResult = await transaction.generateToken();
      const tokenValue = tokenResult?.token || tokenResult?.url;
      if (tokenValue) {
        token = tokenValue;
        const env = FedaPay.getEnvironment();
        const base = env === 'live'
          ? 'https://fedapay.com'
          : 'https://sandbox.fedapay.com';
        checkoutUrl = `${base}/checkout/${tokenValue}`;
      }
    } catch (tokenError) {
      // Token generation failed — still return the transaction for polling
      console.warn('FedaPay token generation failed:', tokenError);
    }

    return {
      success: true,
      transactionId: transactionRef || transactionId,
      checkoutUrl,
      token,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown FedaPay error';
    console.error('FedaPay createCheckout error:', message);
    return {
      success: false,
      transactionId: '',
      error: message,
    };
  }
}

/**
 * Verify a FedaPay transaction by its ID or reference.
 * Returns the current status and details.
 */
export async function verifyTransaction(transactionId: string): Promise<VerificationResult> {
  ensureInitialized();

  try {
    const transaction = await Transaction.retrieve(transactionId);
    const tx = transaction;

    return {
      status: mapFedaPayStatus(tx.status),
      transactionId: tx.id?.toString() || transactionId,
      amount: parseFloat(tx.amount) || 0,
      currency: (tx.currency || 'XOF').toUpperCase(),
      metadata: tx.metadata || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Verification failed';
    console.error('FedaPay verifyTransaction error:', message);
    return {
      status: 'failed',
      transactionId,
      amount: 0,
      currency: 'XOF',
    };
  }
}

/**
 * Initiate a Mobile Money payout via FedaPay.
 * Supports MTN, Orange, Moov, and Wave networks.
 */
export async function processPayout(params: PayoutParams): Promise<PayoutResult> {
  ensureInitialized();

  try {
    const mode = mapNetworkToMode(params.network);

    const payout = await Payout.create({
      amount: Math.round(params.amount),
      currency: params.currency.toLowerCase(),
      mode,
      destination: params.recipientPhone,
    });

    // Send the payout immediately
    const result = await payout.sendNow();
    const payoutRef = result?.id?.toString() || payout?.id?.toString() || '';

    return {
      success: true,
      payoutId: payoutRef,
      reference: result?.reference || payoutRef,
      status: result?.status || payout?.status || 'sent',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payout failed';
    console.error('FedaPay processPayout error:', message);
    return {
      success: false,
      payoutId: '',
      status: 'failed',
      error: message,
    };
  }
}

/**
 * Get the current status of a FedaPay transaction.
 */
export async function getTransactionStatus(transactionId: string): Promise<TransactionStatusResult | null> {
  ensureInitialized();

  try {
    const transaction = await Transaction.retrieve(transactionId);
    const tx = transaction;

    return {
      id: tx.id?.toString() || transactionId,
      reference: tx.reference || '',
      status: tx.status || 'unknown',
      amount: parseFloat(tx.amount) || 0,
      currency: (tx.currency || 'XOF').toUpperCase(),
      createdAt: tx.created_at || '',
      updatedAt: tx.updated_at || '',
    };
  } catch (error) {
    console.error('FedaPay getTransactionStatus error:', error);
    return null;
  }
}

/**
 * Verify a FedaPay webhook signature.
 * Uses the official SDK Webhook.constructEvent method.
 */
export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret?: string
): any {
  const webhookSecret = secret || process.env.FEDAPAY_PUBLIC_KEY || '';
  try {
    return Webhook.constructEvent(payload, signatureHeader, webhookSecret);
  } catch (error) {
    console.error('FedaPay webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Charge a transaction directly via Mobile Money (no redirect).
 * Useful for server-side Mobile Money flows.
 */
export async function chargeMobileMoney(
  transactionId: string,
  network: 'MTN' | 'ORANGE' | 'MOOV' | 'WAVE',
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  ensureInitialized();

  try {
    const mode = mapNetworkToMode(network);
    const transaction = await Transaction.retrieve(transactionId);
    const tokenResult = await transaction.generateToken();
    const token = tokenResult?.token;

    if (!token) {
      return { success: false, error: 'Failed to generate payment token' };
    }

    await transaction.sendNowWithToken(mode, token, {
      phone_number: phoneNumber,
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mobile Money charge failed';
    console.error('FedaPay chargeMobileMoney error:', message);
    return { success: false, error: message };
  }
}

// ============ Helpers ============

function mapFedaPayStatus(status: string): VerificationResult['status'] {
  const map: Record<string, VerificationResult['status']> = {
    pending: 'pending',
    processing: 'processing',
    approved: 'completed',
    completed: 'completed',
    declined: 'failed',
    failed: 'failed',
    refunded: 'refunded',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    partially_refunded: 'refunded',
  };
  return map[status] || 'pending';
}

function mapNetworkToMode(network: string): string {
  const map: Record<string, string> = {
    MTN: 'mtn',
    ORANGE: 'orange',
    MOOV: 'moov',
    WAVE: 'wave',
  };
  return map[network.toUpperCase()] || 'mtn';
}
