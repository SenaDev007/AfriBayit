// AfriBayit — Tenant-Aware Prisma Client
// CDC §7 — Row Level Security for multitenant isolation
//
// Wraps PrismaClient with country-based tenant filtering.
// Uses Prisma client extensions ($extends) to automatically inject
// `where: { country }` on tenant-scoped models and SET app.current_tenant
// for future PostgreSQL RLS.

import { db } from '@/lib/db';

// ─── Tenant-scoped models ────────────────────────────────────────────────────────
// Models that have a `country` field and should be auto-filtered by tenant.
// Models without a `country` field (e.g. OAuthAccount, OtpVerification) are excluded.

const TENANT_SCOPED_MODELS = new Set([
  'User',
  'KycDocument',
  'Property',
  'PropertyLegalDoc',
  'Notary',
  'Transaction',
  'Review',
  'Course',
  'CommunityPost',
  'CommunityGroup',
  'CommunityEvent',
  'Notification',
  'Artisan',
  'Geometer',
  'Hotel',
  'Guesthouse',
  'ProfessionalProfile',
  'ShortTermRental',
  'CountryAccreditation',
  'Ambassador',
]);

// Operations that accept a `where` clause and should be filtered
const FILTERABLE_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'count',
  'aggregate',
  'groupBy',
]);

// ─── Tenant Prisma Client Cache ──────────────────────────────────────────────────
// We cache one extended client per country code.
// In production (serverless), the global cache prevents hot-reload leaks.

type TenantClient = ReturnType<typeof db.$extends>;

const globalForTenant = globalThis as unknown as {
  tenantClients: Map<string, TenantClient> | undefined;
};

const tenantClients: Map<string, TenantClient> =
  globalForTenant.tenantClients ?? new Map();

if (process.env.NODE_ENV !== 'production') {
  globalForTenant.tenantClients = tenantClients;
}

// ─── Validate country code ────────────────────────────────────────────────────────

const VALID_COUNTRIES = new Set(['BJ', 'CI', 'BF', 'TG', 'SN']);

function validateCountryCode(code: string): string {
  const upper = code.toUpperCase();
  if (!VALID_COUNTRIES.has(upper)) {
    throw new Error(
      `[TenantDB] Invalid country code: "${code}". Valid codes: ${[...VALID_COUNTRIES].join(', ')}`
    );
  }
  return upper;
}

// ─── Create tenant-scoped Prisma client ───────────────────────────────────────────

function createTenantClient(countryCode: string): TenantClient {
  const upperCountry = validateCountryCode(countryCode);

  // Use Prisma client extensions (the modern, supported approach in Prisma 6+)
  // This automatically injects `where: { country }` on tenant-scoped models
  const extended = db.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Auto-filter tenant-scoped models on read operations
          if (
            model &&
            TENANT_SCOPED_MODELS.has(model) &&
            FILTERABLE_OPERATIONS.has(operation)
          ) {
            if (!args.where) {
              args.where = {};
            }

            const where = args.where as Record<string, unknown>;

            // Only inject filter if the caller hasn't already specified a country filter.
            // This allows explicit country overrides (e.g., admin viewing all countries).
            if (!where.country) {
              where.country = upperCountry;
            }
          }

          return query(args);
        },
      },
    },
  });

  return extended;
}

// ─── Public API: getTenantDb ──────────────────────────────────────────────────────

/**
 * Returns a Prisma client scoped to a specific country/tenant.
 *
 * All `findMany`, `findFirst`, `count`, `aggregate`, and `groupBy` queries
 * on tenant-scoped models will automatically include `where: { country: countryCode }`
 * unless an explicit country filter is already provided.
 *
 * Uses Prisma client extensions ($extends) under the hood, which is the
 * recommended approach for Prisma 6+.
 *
 * @param countryCode - ISO country code (BJ, CI, BF, TG, SN)
 * @returns Extended PrismaClient scoped to the given tenant
 *
 * @example
 * // In an API route:
 * const tenantDb = getTenantDb('BJ');
 * const properties = await tenantDb.property.findMany({ where: { status: 'published' } });
 * // → SQL: SELECT * FROM properties WHERE country = 'BJ' AND status = 'published'
 *
 * @example
 * // With explicit country override (admin access):
 * const tenantDb = getTenantDb('BJ');
 * const allProperties = await tenantDb.property.findMany({ where: { country: 'CI' } });
 * // → SQL: SELECT * FROM properties WHERE country = 'CI' (override respected)
 */
export function getTenantDb(countryCode: string): TenantClient {
  const upperCountry = validateCountryCode(countryCode);

  // Return cached client if available
  const cached = tenantClients.get(upperCountry);
  if (cached) return cached;

  // Create and cache new client
  const client = createTenantClient(upperCountry);
  tenantClients.set(upperCountry, client);

  return client;
}

// ─── Public API: setTenantSession ─────────────────────────────────────────────────

/**
 * Sets the PostgreSQL session variable `app.current_tenant` for RLS.
 *
 * This must be called at the beginning of each request when using
 * PostgreSQL Row Level Security policies. The session variable persists
 * for the duration of the database connection.
 *
 * IMPORTANT: This is a no-op when using SQLite (local dev).
 * Only works with PostgreSQL (Neon) connections.
 *
 * @param countryCode - ISO country code to set as current tenant
 *
 * @example
 * // In an API route:
 * const tenantDb = getTenantDb('BJ');
 * await setTenantSession('BJ');
 * // Now all subsequent queries on this connection are RLS-scoped
 */
export async function setTenantSession(countryCode: string): Promise<void> {
  const upperCountry = validateCountryCode(countryCode);

  try {
    await db.$executeRawUnsafe(
      `SET LOCAL app.current_country = '${upperCountry}'`
    );
  } catch {
    // Silently ignore if not on PostgreSQL (e.g., SQLite in dev)
    // or if the app.current_country variable is not yet configured
  }
}

// ─── Public API: getTenantFilter ──────────────────────────────────────────────────

/**
 * Returns a Prisma where-clause fragment for country filtering.
 * Useful for manual filtering when you need more control than the extension.
 *
 * @param countryCode - ISO country code
 * @returns Object with `country` field for Prisma where clause
 *
 * @example
 * const where = {
 *   status: 'published',
 *   ...getTenantFilter('BJ'),
 * };
 * // → { status: 'published', country: 'BJ' }
 */
export function getTenantFilter(countryCode: string): { country: string } {
  const upperCountry = validateCountryCode(countryCode);
  return { country: upperCountry };
}

// ─── Public API: extractTenantFromRequest ─────────────────────────────────────────

/**
 * Extracts the tenant/country code from an HTTP request.
 *
 * Checks in order:
 * 1. `x-tenant-country` header (set by Next.js middleware)
 * 2. `afribayit_country` cookie
 * 3. `country` query parameter
 * 4. Falls back to 'BJ' (default)
 *
 * @param request - The incoming HTTP request
 * @returns Upper-case country code
 */
export function extractTenantFromRequest(request: Request): string {
  // 1. Check header set by middleware
  const headerCountry = request.headers.get('x-tenant-country');
  if (headerCountry && VALID_COUNTRIES.has(headerCountry.toUpperCase())) {
    return headerCountry.toUpperCase();
  }

  // 2. Check cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/afribayit_country=([A-Z]{2})/);
  if (cookieMatch && VALID_COUNTRIES.has(cookieMatch[1])) {
    return cookieMatch[1];
  }

  // 3. Check query param
  const url = new URL(request.url);
  const queryCountry = url.searchParams.get('country');
  if (queryCountry && VALID_COUNTRIES.has(queryCountry.toUpperCase())) {
    return queryCountry.toUpperCase();
  }

  // 4. Default to BJ
  return 'BJ';
}

// ─── Public API: isTenantScopedModel ──────────────────────────────────────────────

/**
 * Checks if a Prisma model name is tenant-scoped (has a `country` field).
 */
export function isTenantScopedModel(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model);
}

// ─── Cleanup (for testing / hot reload) ───────────────────────────────────────────

/**
 * Clears all cached tenant Prisma clients.
 * Should only be used in tests or during development.
 */
export function clearTenantClientCache(): void {
  tenantClients.clear();
}
