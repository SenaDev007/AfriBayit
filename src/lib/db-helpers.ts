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

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber?: () => number }).toNumber === 'function') return (value as { toNumber: () => number }).toNumber();
  return Number(String(value));
}
