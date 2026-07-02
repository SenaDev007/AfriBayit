// AfriBayit — Sentry Manual Instrumentation (P4.4)
// Utility functions for manual error tracking and breadcrumbs
// Reference: CDC §10.7 — Monitoring & Incident Response

import * as Sentry from '@sentry/nextjs';
import type { User } from '@prisma/client';

/**
 * Set user context for Sentry (called after login)
 */
export function setSentryUser(user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'country' | 'kycLevel'>): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    role: user.role,
    country: user.country,
    kycLevel: user.kycLevel,
  });
}

/**
 * Clear user context (called on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'log' = 'info',
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
}

/**
 * Manually capture an exception with extra context
 * Use in try/catch blocks for critical operations (escrow, payments, KYC)
 */
export function captureError(
  error: Error | unknown,
  context: {
    module?: string;
    operation?: string;
    userId?: string;
    transactionId?: string;
    [key: string]: unknown;
  } = {}
): void {
  Sentry.captureException(error, {
    tags: {
      module: context.module,
      operation: context.operation,
    },
    user: context.userId ? { id: context.userId } : undefined,
    extra: {
      ...context,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Wrap an async function with Sentry performance monitoring
 * Use for critical API routes and background jobs
 */
export function withSentryTransaction<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  options: { op?: string } = {}
): T {
  return (async (...args: Parameters<T>) => {
    return Sentry.startSpan(
      {
        name,
        op: options.op || 'function',
      },
      async (span) => {
        try {
          const result = await fn(...args);
          span.setAttribute('success', true);
          return result;
        } catch (error) {
          span.setAttribute('success', false);
          span.setAttribute('error', error instanceof Error ? error.message : String(error));
          throw error;
        }
      }
    );
  }) as T;
}

/**
 * Critical operation logger — for escrow releases, KYC validations, payouts
 * These events should trigger Sentry alerts in production
 */
export function logCriticalEvent(
  event: string,
  details: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'warning'
): void {
  Sentry.captureMessage(event, {
    level,
    tags: { critical: 'true' },
    extra: details,
  });

  // Also add as breadcrumb for context in future errors
  addBreadcrumb('critical', event, level === 'fatal' ? 'error' : level, details);
}

/**
 * Instrument escrow operations (P4.4 — critical financial flows)
 */
export const SentryEscrow = {
  fund: (transactionId: string, amount: number, userId: string) => {
    addBreadcrumb('escrow', `Funding escrow for ${transactionId}`, 'info', { transactionId, amount, userId });
  },
  release: (transactionId: string, userId: string, adminId?: string) => {
    logCriticalEvent('escrow.release', { transactionId, userId, adminId, timestamp: Date.now() });
  },
  dispute: (transactionId: string, reason: string, initiatedBy: string) => {
    logCriticalEvent('escrow.dispute', { transactionId, reason, initiatedBy }, 'error');
  },
  refund: (transactionId: string, amount: number, reason: string) => {
    logCriticalEvent('escrow.refund', { transactionId, amount, reason }, 'warning');
  },
};

/**
 * Instrument payment operations (P4.4 — critical financial flows)
 */
export const SentryPayments = {
  initiate: (provider: string, amount: number, transactionId: string) => {
    addBreadcrumb('payment', `Initiating ${provider} payment`, 'info', { provider, amount, transactionId });
  },
  success: (provider: string, transactionId: string, amount: number) => {
    addBreadcrumb('payment', `Payment success via ${provider}`, 'info', { provider, transactionId, amount });
  },
  failure: (provider: string, transactionId: string, error: string) => {
    logCriticalEvent('payment.failure', { provider, transactionId, error }, 'error');
  },
  webhook: (provider: string, eventType: string, eventId: string) => {
    addBreadcrumb('payment', `Webhook ${eventType} from ${provider}`, 'info', { provider, eventType, eventId });
  },
};

/**
 * Instrument KYC operations (P4.4 — compliance)
 */
export const SentryKyc = {
  submit: (userId: string, docType: string) => {
    addBreadcrumb('kyc', `KYC submitted`, 'info', { userId, docType });
  },
  validate: (userId: string, kycLevel: number, adminId: string) => {
    logCriticalEvent('kyc.validate', { userId, kycLevel, adminId });
  },
  reject: (userId: string, reason: string, adminId: string) => {
    logCriticalEvent('kyc.reject', { userId, reason, adminId }, 'warning');
  },
};
