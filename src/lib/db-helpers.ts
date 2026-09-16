import { Prisma } from '@prisma/client';

export function toJsonInput(value: unknown): any {
  if (value === null || value === undefined) return Prisma.JsonNull;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed); } catch { return value; }
    }
    return value;
  }
  return value;
}

export function fromJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  return value as unknown as T;
}

/**
 * Defensive reader for Json columns that should hold an array.
 *
 * Legacy rows (old seed / old API writes) may store the JSON *string*
 * `'["https://…"]'` instead of a real array. Reading `value[0]` on the string
 * yields `'['`, which silently breaks every image URL downstream. This helper
 * parses stringified arrays and always returns a real array (empty on garbage).
 */
export function parseJsonArray<T = unknown>(value: unknown): T[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
  }
  return [];
}

/**
 * Defensive reader for Json columns that should hold an object (record).
 *
 * Legacy rows written before the Json-column fix may store the JSON *string*
 * `'{"transactionId":…}'` instead of a real object. Casting such a string to
 * Record<string, unknown> silently yields undefined for every key — which
 * broke escrow funding in the FedaPay/Stripe webhooks and payout processing.
 * This helper parses stringified objects and always returns a real record.
 */
export function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // fall through
      }
    }
  }
  return {};
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber?: () => number }).toNumber === 'function') return (value as { toNumber: () => number }).toNumber();
  return Number(String(value));
}
