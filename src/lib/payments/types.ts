// AfriBayit — Payment Abstraction Layer Types
// Shared TypeScript interfaces for the payment system

export type PaymentProvider = 'fedapay' | 'stripe';

export type PaymentMethod =
  | 'mobile_money_mtn'
  | 'mobile_money_moov'
  | 'mobile_money_orange'
  | 'mobile_money_wave'
  | 'card_visa'
  | 'card_mastercard'
  | 'bank_transfer';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export type TransactionState =
  | 'CREATED'
  | 'FUNDED'
  | 'NOTARY_ASSIGNED'
  | 'GEO_VERIFIED'
  | 'DEED_SIGNED'
  | 'ANDF_REGISTERED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface InitPaymentRequest {
  amount: number;
  currency: string; // XOF, EUR
  provider: PaymentProvider;
  method: PaymentMethod;
  reference: string; // transaction or escrow ID
  metadata?: Record<string, unknown>;
  customerEmail: string;
  customerPhone?: string;
  countryCode: string; // BJ, CI, BF, TG
  description?: string;
}

export interface InitPaymentResponse {
  success: boolean;
  paymentId: string;
  providerRef: string;
  redirectUrl?: string;
  status: PaymentStatus;
}

export interface VerifyPaymentResponse {
  status: PaymentStatus;
  providerRef: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface RefundResponse {
  success: boolean;
  refundRef: string;
  amount: number;
  status: PaymentStatus;
}

export interface WebhookEvent {
  provider: PaymentProvider;
  event: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  metadata?: Record<string, unknown>;
}

export interface PayoutRequest {
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  destination: string; // phone number for Mobile Money, bank account ref
  countryCode: string;
}

export interface PayoutResponse {
  success: boolean;
  payoutId: string;
  providerRef: string;
  status: PaymentStatus;
}

/** FedaPay-specific method mapping */
export const FEDAPAY_METHOD_MAP: Record<string, string> = {
  mobile_money_mtn: 'mtn_benin',
  mobile_money_moov: 'moov_benin',
  mobile_money_orange: 'orange_benin',
  mobile_money_wave: 'wave',
  card_visa: 'card',
  card_mastercard: 'card',
};

/** Map country code to FedaPay locale method suffix */
export const FEDAPAY_COUNTRY_SUFFIX: Record<string, Record<string, string>> = {
  BJ: {
    mobile_money_mtn: 'mtn_benin',
    mobile_money_moov: 'moov_benin',
    mobile_money_orange: 'orange_benin',
  },
  CI: {
    mobile_money_mtn: 'mtn_ci',
    mobile_money_moov: 'moov_ci',
    mobile_money_orange: 'orange_ci',
  },
  BF: {
    mobile_money_mtn: 'mtn_burkina',
    mobile_money_moov: 'moov_burkina',
  },
  TG: {
    mobile_money_mtn: 'mtn_togo',
    mobile_money_moov: 'moov_togo',
  },
};

/** Countries where FedaPay Mobile Money is available */
export const FEDAPAY_COUNTRIES = ['BJ', 'CI', 'BF', 'TG'];

/** Mobile Money payment methods */
export const MOBILE_MONEY_METHODS: PaymentMethod[] = [
  'mobile_money_mtn',
  'mobile_money_moov',
  'mobile_money_orange',
  'mobile_money_wave',
];

/** Card payment methods */
export const CARD_METHODS: PaymentMethod[] = [
  'card_visa',
  'card_mastercard',
];

/** Escrow ledger entry types */
export type EscrowEntryType = 'CREDIT' | 'DEBIT' | 'HOLD' | 'RELEASE' | 'REFUND' | 'COMMISSION';

/** Release conditions for escrow */
export interface ReleaseConditions {
  docsValidated: boolean;
  geoTrustValidated: boolean;
  notaryAssigned: boolean;
  deedSigned: boolean;
  andfRegistered: boolean;
}

/** Escrow state transition event */
export interface EscrowTransitionEvent {
  transactionId: string;
  fromState: TransactionState;
  toState: TransactionState;
  actorType: string;
  actorId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
