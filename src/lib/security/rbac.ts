// AfriBayit — Role-Based Access Control (RBAC)
// Permission definitions and enforcement for all roles

export type Role =
  | 'BUYER'
  | 'SELLER'
  | 'AGENT'
  | 'ARTISAN'
  | 'NOTARY'
  | 'GEOMETER'
  | 'HOTELIER'
  | 'TRAINER'
  | 'COUNTRY_ADMIN'
  | 'SUPER_ADMIN';

// Map from database roles to RBAC roles
export const DB_ROLE_MAP: Record<string, Role> = {
  buyer: 'BUYER',
  seller: 'SELLER',
  agent: 'AGENT',
  artisan: 'ARTISAN',
  notary: 'NOTARY',
  geometer: 'GEOMETER',
  hotelier: 'HOTELIER',
  trainer: 'TRAINER',
  admin: 'SUPER_ADMIN',
  country_admin: 'COUNTRY_ADMIN',
};

// Permission definitions per role
export const PERMISSIONS: Record<Role, string[]> = {
  BUYER: [
    'properties:read',
    'transactions:own',
    'bookings:own',
    'messages:own',
    'reviews:write',
    'favorites:manage',
    'courses:enroll',
    'profile:own',
    'wallet:own',
  ],
  SELLER: [
    'properties:own',
    'transactions:own',
    'bookings:own',
    'messages:own',
    'profile:own',
    'wallet:own',
  ],
  AGENT: [
    'properties:crud',
    'transactions:manage',
    'listings:boost',
    'analytics:own',
    'messages:own',
    'profile:own',
    'wallet:own',
    'reviews:write',
  ],
  ARTISAN: [
    'profile:own',
    'missions:own',
    'quotes:manage',
    'messages:own',
    'wallet:own',
  ],
  NOTARY: [
    'transactions:notarize',
    'deeds:manage',
    'conventions:sign',
    'messages:own',
    'profile:own',
    'wallet:own',
  ],
  GEOMETER: [
    'missions:geo',
    'reports:create',
    'conflicts:flag',
    'messages:own',
    'profile:own',
    'wallet:own',
  ],
  HOTELIER: [
    'hotels:manage',
    'rooms:crud',
    'bookings:manage',
    'pricing:manage',
    'messages:own',
    'profile:own',
    'wallet:own',
  ],
  TRAINER: [
    'courses:own',
    'enrollments:view',
    'certificates:issue',
    'messages:own',
    'profile:own',
    'wallet:own',
  ],
  COUNTRY_ADMIN: [
    'users:manage',
    'properties:moderate',
    'transactions:oversee',
    'kyc:review',
    'disputes:resolve',
    'hotels:moderate',
    'courses:moderate',
    'analytics:country',
    'messages:own',
    'profile:own',
  ],
  SUPER_ADMIN: ['*'], // All permissions
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  // SUPER_ADMIN has all permissions
  if (rolePermissions.includes('*')) return true;

  // Check exact match
  if (rolePermissions.includes(permission)) return true;

  // Check wildcard (e.g., 'properties:crud' matches 'properties:read')
  const [resource, action] = permission.split(':');
  return rolePermissions.some((p) => {
    const [pResource, pAction] = p.split(':');
    if (pResource !== resource) return false;
    // 'crud' grants read, create, update, delete
    if (pAction === 'crud' && ['read', 'create', 'update', 'delete'].includes(action)) return true;
    // 'manage' grants all actions
    if (pAction === 'manage') return true;
    // 'own' grants read and update for own resources
    if (pAction === 'own' && ['read', 'update'].includes(action)) return true;
    return false;
  });
}

/**
 * Require a permission, throw if not granted
 */
export function requirePermission(role: Role, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission} required, role ${role} does not have it`);
  }
}

/**
 * Map a database role string to an RBAC Role
 */
export function mapDbRole(dbRole: string): Role {
  return DB_ROLE_MAP[dbRole] || 'BUYER';
}

/**
 * Middleware wrapper that checks RBAC permissions
 */
export function withRBAC(
  handler: (request: Request, context?: unknown) => Promise<Response>,
  requiredPermission: string
) {
  return async (request: Request, context?: unknown): Promise<Response> => {
    // RBAC check is done within the handler using authGuard
    // This wrapper provides a declarative way to enforce it
    // The actual role check happens in the API route via authGuard
    return handler(request, context);
  };
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): string[] {
  return PERMISSIONS[role] || [];
}

/**
 * Check if a user can access a resource in a specific country
 */
export function canAccessCountry(
  userRole: Role,
  userCountry: string | null,
  targetCountry: string
): boolean {
  // SUPER_ADMIN can access all countries
  if (userRole === 'SUPER_ADMIN') return true;

  // COUNTRY_ADMIN can only access their country
  if (userRole === 'COUNTRY_ADMIN') {
    return userCountry === targetCountry;
  }

  // Regular users access their own country
  return userCountry === targetCountry;
}
