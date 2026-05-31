// AfriBayit — Payment Abstraction Layer (PAL) Orchestrator
// Central hub for payment provider selection, initiation, and webhook routing

import type {
  PaymentProvider,
  PaymentMethod,
  InitPaymentRequest,
  InitPaymentResponse,
  WebhookEvent,
} from './types';
import { FEDAPAY_COUNTRIES, MOBILE_MONEY_METHODS, CARD_METHODS } from './types';
import { PaymentProviderBase } from './providers/base-provider';
import { FedaPayProvider } from './providers/fedapay';
import { StripeProvider } from './providers/stripe';

// Singleton provider instances
let fedapayInstance: FedaPayProvider | null = null;
let stripeInstance: StripeProvider | null = null;

/**
 * Get a payment provider instance by name.
 * Uses lazy singleton pattern to avoid re-instantiation.
 */
export function getProvider(name: PaymentProvider): PaymentProviderBase {
  switch (name) {
    case 'fedapay':
      if (!fedapayInstance) fedapayInstance = new FedaPayProvider();
      return fedapayInstance;

    case 'stripe':
      if (!stripeInstance) stripeInstance = new StripeProvider();
      return stripeInstance;

    default:
      throw new Error(`Unknown payment provider: ${name}`);
  }
}

/**
 * Auto-select the best payment provider based on country and payment method.
 *
 * Rules:
 * - BJ/CI/BF/TG + Mobile Money → FedaPay
 * - International cards (Visa/MC) → Stripe
 * - Cards in WAEMU countries → FedaPay (preferred for local processing)
 * - Bank transfer → Stripe
 */
export function selectBestProvider(
  country: string,
  method: PaymentMethod
): PaymentProvider {
  const isMobileMoney = MOBILE_MONEY_METHODS.includes(method);
  const isCard = CARD_METHODS.includes(method);
  const isFedapayCountry = FEDAPAY_COUNTRIES.includes(country);

  // Mobile Money always goes through FedaPay
  if (isMobileMoney && isFedapayCountry) {
    return 'fedapay';
  }

  // Cards in WAEMU countries — prefer FedaPay for local processing, fallback Stripe
  if (isCard && isFedapayCountry) {
    // If FedaPay is configured, use it; otherwise Stripe
    if (process.env.FEDAPAY_API_KEY) {
      return 'fedapay';
    }
    return 'stripe';
  }

  // International cards outside WAEMU
  if (isCard) {
    return 'stripe';
  }

  // Bank transfers via Stripe
  if (method === 'bank_transfer') {
    return 'stripe';
  }

  // Default fallback
  return 'fedapay';
}

/**
 * Initiate a payment using the best provider for the given country/method.
 * If the request already specifies a provider, use that directly.
 */
export async function initiatePayment(
  request: InitPaymentRequest
): Promise<InitPaymentResponse> {
  // Auto-select provider if not specified or if we want to validate
  const providerName = request.provider || selectBestProvider(request.countryCode, request.method);
  const provider = getProvider(providerName);

  // Validate the provider supports this method/country combo
  if (!provider.supportsMethod(request.method, request.countryCode)) {
    // Try fallback provider
    const fallback = providerName === 'fedapay' ? 'stripe' : 'fedapay';
    const fallbackProvider = getProvider(fallback as PaymentProvider);

    if (fallbackProvider.supportsMethod(request.method, request.countryCode)) {
      return fallbackProvider.initiatePayment({ ...request, provider: fallback as PaymentProvider });
    }

    throw new Error(
      `No payment provider supports method "${request.method}" in country "${request.countryCode}"`
    );
  }

  return provider.initiatePayment(request);
}

/**
 * Process an incoming webhook by routing to the correct provider handler.
 */
export async function processWebhook(
  providerName: PaymentProvider,
  payload: unknown,
  headers: Record<string, string>
): Promise<WebhookEvent> {
  const provider = getProvider(providerName);
  return provider.handleWebhook(payload, headers);
}

/**
 * Verify a payment with the correct provider.
 */
export async function verifyPayment(
  providerName: PaymentProvider,
  reference: string
) {
  const provider = getProvider(providerName);
  return provider.verifyPayment(reference);
}

/**
 * Process a refund with the correct provider.
 */
export async function processRefund(
  providerName: PaymentProvider,
  reference: string,
  amount?: number
) {
  const provider = getProvider(providerName);
  return provider.processRefund(reference, amount);
}

/**
 * Get available payment methods for a specific country.
 */
export function getAvailableMethods(country: string): PaymentMethod[] {
  const methods: PaymentMethod[] = [];
  const isFedapayCountry = FEDAPAY_COUNTRIES.includes(country);

  if (isFedapayCountry) {
    methods.push('mobile_money_mtn', 'mobile_money_moov', 'mobile_money_orange');
    // Wave is available in specific countries
    if (country === 'CI' || country === 'SN') {
      methods.push('mobile_money_wave');
    }
  }

  // Cards are available everywhere via Stripe
  methods.push('card_visa', 'card_mastercard');

  // Bank transfer via Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    methods.push('bank_transfer');
  }

  return methods;
}
