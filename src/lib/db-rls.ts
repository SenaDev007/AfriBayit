// AfriBayit — Row-Level Security Module for Multi-tenant Data Isolation
//
// This module provides functions to set the RLS context for each request
// so that database queries are automatically scoped to the user's country.
//
// IMPORTANT: RLS policies only work with PostgreSQL in production.
// In development (SQLite), these functions are no-ops and the application
// relies on the tenant-guard module for country filtering instead.
//
// Usage with Prisma raw queries:
//   await setRLSContext(userId, country);
//   // Then all subsequent queries in this session are country-scoped

import { db } from '@/lib/db';

/**
 * Set the RLS context for the current database session.
 * This must be called before any queries that need country-scoping.
 *
 * In PostgreSQL, this sets session-level variables that are picked up
 * by RLS policies defined on the tables (see prisma/migrations/rls.sql).
 *
 * In SQLite (development), this is a no-op since SQLite doesn't support RLS.
 * Use the tenant-guard module's addTenantFilter() instead for dev environments.
 */
export async function setRLSContext(userId: string, country: string): Promise<void> {
  // For Prisma with PostgreSQL, we use $executeRawUnsafe to set session variables
  // These are picked up by RLS policies defined on the tables
  try {
    await db.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = '${sanitizeSQLString(userId)}';`
    );
    await db.$executeRawUnsafe(
      `SET LOCAL app.current_country = '${sanitizeSQLString(country)}';`
    );
  } catch (error) {
    // RLS context setting will fail on SQLite or when not connected to PostgreSQL
    // This is expected in development and should not crash the app
    console.warn('RLS context setting failed (may not be PostgreSQL):', error);
  }
}

/**
 * Clear the RLS context after a request completes.
 * This prevents context leaking between requests on pooled connections.
 */
export async function clearRLSContext(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`RESET app.current_user_id;`);
    await db.$executeRawUnsafe(`RESET app.current_country;`);
  } catch (error) {
    // Expected to fail on SQLite
    console.warn('RLS context reset failed (may not be PostgreSQL):', error);
  }
}

/**
 * Country-scoped query helper.
 * Wraps Prisma where clauses with country filtering automatically.
 *
 * This is the application-level alternative to RLS that works with SQLite.
 * Use this in combination with the tenant-guard module.
 */
export function withCountryScope<T extends Record<string, unknown>>(
  query: T,
  country?: string
): T {
  if (!country) return query;
  return { ...query, country } as T;
}

/**
 * Execute a callback within an RLS context.
 * Automatically sets and clears the RLS context around the callback.
 *
 * Usage:
 *   const results = await withRLSContext(userId, 'BJ', async () => {
 *     return db.property.findMany({ where: { status: 'published' } });
 *   });
 */
export async function withRLSContext<T>(
  userId: string,
  country: string,
  callback: () => Promise<T>
): Promise<T> {
  await setRLSContext(userId, country);
  try {
    return await callback();
  } finally {
    await clearRLSContext();
  }
}

/**
 * Check if the current database supports RLS (PostgreSQL only).
 * Useful for determining whether to use RLS or application-level filtering.
 */
export async function isRLSSupported(): Promise<boolean> {
  try {
    // Try a lightweight PostgreSQL-specific query
    await db.$executeRawUnsafe(`SELECT current_setting('server_version') IS NOT NULL;`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Basic SQL string sanitization to prevent SQL injection in RLS context setting.
 * This is a defense-in-depth measure — the values should already be validated
 * at the application layer before reaching this function.
 */
function sanitizeSQLString(value: string): string {
  // Remove single quotes, semicolons, and common injection patterns
  return value
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .substring(0, 64); // Limit length
}
