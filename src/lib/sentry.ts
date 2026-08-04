// AfriBayit — Sentry error/warning capture helper (CDC §3.1.6)
//
// Wraps `Sentry.captureException` so application code never has to import
// `@sentry/nextjs` directly. Always logs to console (so errors are visible
// in dev / SSR logs even when Sentry is not configured), then forwards to
// Sentry only when its DSN is available.
//
// Usage:
//   import { captureError, captureWarning } from '@/lib/sentry';
//   try { … } catch (err) { captureError('Payment failed', err, { userId }); }

export interface CaptureContext {
  [key: string]: unknown;
}

let sentryAvailable: boolean | null = null;

async function getSentry(): Promise<typeof import('@sentry/nextjs') | null> {
  if (sentryAvailable === false) return null;
  try {
    const mod = await import('@sentry/nextjs');
    sentryAvailable = !!mod && typeof mod.captureException === 'function';
    return sentryAvailable ? mod : null;
  } catch {
    sentryAvailable = false;
    return null;
  }
}

/**
 * Capture an unexpected error. Always logs to console; forwards to Sentry
 * if its DSN is configured.
 */
export async function captureError(
  message: string,
  error?: unknown,
  context?: CaptureContext,
): Promise<void> {
  // Console first — never let a Sentry init failure swallow the log.
  if (error instanceof Error) {
    console.error(`[captureError] ${message}`, error, context ?? {});
  } else {
    console.error(`[captureError] ${message}`, error ?? '', context ?? {});
  }

  try {
    const Sentry = await getSentry();
    if (!Sentry) return;

    if (context && Object.keys(context).length > 0) {
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) {
          scope.setExtra(k, v);
        }
        scope.setLevel('error');
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message, 'error');
        }
      });
    } else {
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    }
  } catch (sentryErr) {
    // Never let Sentry fail silently — surface it.
    console.warn('[captureError] Sentry capture failed:', sentryErr);
  }
}

/**
 * Capture a non-blocking warning. Always logs to console.warn; forwards to
 * Sentry as a warning breadcrumb / message when available.
 */
export async function captureWarning(
  message: string,
  context?: CaptureContext,
): Promise<void> {
  console.warn(`[captureWarning] ${message}`, context ?? {});

  try {
    const Sentry = await getSentry();
    if (!Sentry) return;

    if (context && Object.keys(context).length > 0) {
      Sentry.withScope((scope) => {
        for (const [k, v] of Object.entries(context)) {
          scope.setExtra(k, v);
        }
        scope.setLevel('warning');
        Sentry.captureMessage(message, 'warning');
      });
    } else {
      Sentry.captureMessage(message, 'warning');
    }
  } catch (sentryErr) {
    console.warn('[captureWarning] Sentry capture failed:', sentryErr);
  }
}

/**
 * Synchronous variant for use in places that can't await (e.g. top-level
 * catch blocks). Fires the async capture without awaiting.
 */
export function captureErrorSync(
  message: string,
  error?: unknown,
  context?: CaptureContext,
): void {
  void captureError(message, error, context);
}

export function captureWarningSync(
  message: string,
  context?: CaptureContext,
): void {
  void captureWarning(message, context);
}

export default { captureError, captureWarning, captureErrorSync, captureWarningSync };
