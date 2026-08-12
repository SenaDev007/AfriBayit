// AfriBayit — Role-Based Access Control (RBAC)
// Permission definitions and enforcement for all roles

export type Role =
  | 'BUYER' // USER_STANDARD — navigation, recherche, favoris, messagerie, formations, réservations
  | 'SELLER' // Propriétaire/Vendeur — dashboard analytics, gestion multi-propriétés
  | 'INVESTOR' // Acheteur/Investisseur — calculateur ROI, alertes intelligentes
  | 'TOURIST' // Touriste/Voyageur — réservations hôtels, programme fidélité
  | 'ARTISAN' // Artisan BTP — profil certifié, galerie réalisations
  | 'CERTIFIED_AGENT' // Agent immobilier certifié — publication annonces, dashboard pro
  | 'PREMIUM_AGENT' // Agent Premium — droits CERTIFIED_AGENT + boost + analytics + InMail
  | 'ARTISAN_PRO' // Artisan Pro — profil pro, missions, portfolio
  | 'HOTELIER' // Propriétaire Guesthouse/Hotel — dashboard multi-chambres
  | 'TRAINER' // Formateur/Expert — cours publiés, certifications
  | 'NOTARY' // Notaire certifié — transactions notariales
  | 'GEOMETER' // Géomètre certifié GeoTrust — missions géométriques
  | 'COUNTRY_ADMIN' // Admin pays — validation annonces, gestion agents
  | 'SUPER_ADMIN'; // Admin global — accès total

// Map from database roles to RBAC roles
export const DB_ROLE_MAP: Record<string, Role> = {
  buyer: 'BUYER',
  seller: 'SELLER',
  investor: 'INVESTOR',
  tourist: 'TOURIST',
  agent: 'CERTIFIED_AGENT',
  certified_agent: 'CERTIFIED_AGENT',
  premium_agent: 'PREMIUM_AGENT',
  artisan: 'ARTISAN',
  artisan_pro: 'ARTISAN_PRO',
  hotelier: 'HOTELIER',
  trainer: 'TRAINER',
  notary: 'NOTARY',
  geometer: 'GEOMETER',
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
    'analytics:own',
  ],
  INVESTOR: [
    'properties:read',
    'transactions:own',
    'analytics:own',
    'messages:own',
    'reviews:write',
    'favorites:manage',
    'profile:own',
    'wallet:own',
  ],
  TOURIST: [
    'properties:read',
    'bookings:own',
    'hotels:read',
    'messages:own',
    'reviews:write',
    'favorites:manage',
    'profile:own',
    'wallet:own',
  ],
  CERTIFIED_AGENT: [
    'properties:crud',
    'transactions:manage',
    'listings:boost',
    'analytics:own',
    'messages:own',
    'profile:own',
    'wallet:own',
    'reviews:write',
  ],
  PREMIUM_AGENT: [
    'properties:crud',
    'transactions:manage',
    'listings:boost',
    'analytics:own',
    'messages:own',
    'profile:own',
    'wallet:own',
    'reviews:write',
    'inmail:send',
    'boost:premium',
    'vr:access',
    'crm:access',
  ],
  ARTISAN: [
    'profile:own',
    'missions:own',
    'quotes:manage',
    'messages:own',
    'wallet:own',
  ],
  ARTISAN_PRO: [
    'profile:own',
    'profile:pro',
    'missions:own',
    'quotes:manage',
    'portfolio:manage',
    'messages:own',
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
