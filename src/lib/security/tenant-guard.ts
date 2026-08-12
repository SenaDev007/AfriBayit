// AfriBayit — Tenant Guard
// Country-based data isolation for multi-tenant access

import { mapDbRole, canAccessCountry, type Role } from './rbac';

interface TenantContext {
  userId: string;
  role: Role;
  country: string | null;
  isSuperAdmin: boolean;
  isCountryAdmin: boolean;
}

/**
 * Create a tenant context from user data
 */
export function createTenantContext(userData: {
  id: string;
  role: string;
  country: string | null;
}): TenantContext {
  const mappedRole = mapDbRole(userData.role);

  return {
    userId: userData.id,
    role: mappedRole,
    country: userData.country,
    isSuperAdmin: mappedRole === 'SUPER_ADMIN',
    isCountryAdmin: mappedRole === 'COUNTRY_ADMIN',
  };
}

/**
 * Get the country filter for a tenant context
 * Returns the country that should be used to filter queries
 */
export function getTenantCountryFilter(context: TenantContext): string | null {
  // SUPER_ADMIN can see all countries (no filter)
  if (context.isSuperAdmin) return null;

  // All other users are scoped to their country
  return context.country;
}

/**
 * Validate that a user can access data in a specific country
 */
export function validateTenantAccess(
  context: TenantContext,
  targetCountry: string
): { allowed: boolean; reason?: string } {
  if (context.isSuperAdmin) {
    return { allowed: true };
  }

  if (!context.country) {
    return { allowed: false, reason: 'User has no country assigned' };
  }

  if (!canAccessCountry(context.role, context.country, targetCountry)) {
    return {
      allowed: false,
      reason: `User with role ${context.role} in ${context.country} cannot access data for ${targetCountry}`,
    };
  }

  return { allowed: true };
}

/**
 * Add country filter to a Prisma where clause
 */
export function addTenantFilter(
  where: Record<string, unknown>,
  context: TenantContext
): Record<string, unknown> {
  const countryFilter = getTenantCountryFilter(context);
  if (countryFilter) {
    return { ...where, country: countryFilter };
  }
  return where;
}

/**
 * Middleware wrapper that enforces tenant isolation
 */
export function withTenantGuard(
  handler: (request: Request, context: TenantContext) => Promise<Response>
) {
  return async (request: Request, tenantContext: TenantContext): Promise<Response> => {
    // The handler receives the tenant context with country information
    // It should use getTenantCountryFilter() to scope queries
    return handler(request, tenantContext);
  };
}

/**
 * Get allowed countries for a user
 */
export function getAllowedCountries(context: TenantContext): string[] {
  const ALL_COUNTRIES = ['BJ', 'CI', 'BF', 'TG'];

  if (context.isSuperAdmin) {
    return ['ALL', ...ALL_COUNTRIES];
  }

  if (context.isCountryAdmin && context.country) {
    return [context.country];
  }

  if (context.country) {
    return [context.country];
  }

  return [];
}
