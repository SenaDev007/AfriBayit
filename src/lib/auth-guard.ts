import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { verifyAccessToken, type JWTPayload } from '@/lib/security/jwt-security';
import type { Role } from '@/lib/security/rbac';

// Re-export Role for backward compatibility with existing imports
export type { Role };

interface AuthGuardOptions {
  requiredRoles?: Role[];
  requireKycLevel?: number; // minimum KYC level required
}

interface AuthResult {
  success: true;
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  userId: string;
  email: string;
  role: string;
  country: string | null;
  kycLevel: number;
}

interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * Rôle requis — aligné sur le middleware (src/lib/auth.ts → isAdmin).
 *
 * « admin » est le rôle administrateur plateforme historique (compte seed
 * admin@afribayit.com) : il a accès complet, exactement comme le middleware
 * l'accepte déjà pour les PAGES /admin. Avant cet alignement, le compte
 * voyait le back-office mais toutes ses API répondaient 403 — un bord de
 * contrôle affiché mais vide. Les CountryAccreditations continuent de
 * gouverner l'accès pays par pays (COUNTRY_ADMIN).
 */
function hasRequiredRole(
  userRole: string | undefined | null,
  requiredRoles: readonly string[] | undefined,
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (userRole === 'admin') return true; // admin plateforme = accès complet
  return requiredRoles.includes(userRole as never);
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Validate RS256 JWT from Authorization header.
 * Returns the decoded payload if valid, or null if invalid/missing.
 */
async function validateBearerToken(token: string): Promise<JWTPayload | null> {
  const result = await verifyAccessToken(token);
  if (!result.valid || !result.payload) return null;
  return result.payload;
}

/**
 * Auth guard for API routes.
 * Two authentication methods supported:
 * 1. NextAuth session (cookie-based) — for browser clients
 * 2. RS256 JWT Bearer token — for API/mobile clients
 *
 * Validates role/KYC requirements and returns either a success result
 * with user info or an error response.
 */
export async function authGuard(
  requestOrOptions?: Request | AuthGuardOptions,
  options?: AuthGuardOptions
): Promise<AuthResult | AuthError> {
  // Handle overloaded signatures:
  // authGuard(request, options) or authGuard(options) or authGuard()
  let request: Request | undefined;
  let guardOptions: AuthGuardOptions = {};

  if (requestOrOptions instanceof Request) {
    request = requestOrOptions;
    guardOptions = options ?? {};
  } else if (requestOrOptions) {
    guardOptions = requestOrOptions;
  }

  // Strategy 1: Try RS256 Bearer token first (for API/mobile clients)
  if (request) {
    const bearerToken = extractBearerToken(request);
    if (bearerToken) {
      const payload = await validateBearerToken(bearerToken);
      if (payload) {
        // Validate role requirements
        if (guardOptions.requiredRoles && guardOptions.requiredRoles.length > 0) {
          if (!hasRequiredRole(payload.role as string, guardOptions.requiredRoles)) {
            return {
              success: false,
              response: NextResponse.json(
                { error: 'Accès non autorisé', code: 'FORBIDDEN', requiredRoles: guardOptions.requiredRoles },
                { status: 403 }
              ),
            };
          }
        }

        // Validate KYC level requirements
        if (guardOptions.requireKycLevel && (payload.kycLevel ?? 0) < guardOptions.requireKycLevel) {
          return {
            success: false,
            response: NextResponse.json(
              { error: 'Niveau KYC insuffisant', code: 'KYC_REQUIRED', requiredLevel: guardOptions.requireKycLevel, currentLevel: payload.kycLevel ?? 0 },
              { status: 403 }
            ),
          };
        }

        // Return auth result with RS256 JWT claims
        // Note: session is null for Bearer token auth — callers should use userId/role/etc directly
        return {
          success: true,
          session: null as unknown as NonNullable<Awaited<ReturnType<typeof getServerSession>>>,
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
          country: payload.country ?? null,
          kycLevel: payload.kycLevel ?? 0,
        };
      }

      // Token was present but invalid
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Token invalide ou expiré', code: 'INVALID_TOKEN' },
          { status: 401 }
        ),
      };
    }
  }

  // Strategy 2: Fall back to NextAuth session (cookie-based)
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const userId = (session.user as Record<string, unknown>).id as string;
  const role = (session.user as Record<string, unknown>).role as string;
  const country = (session.user as Record<string, unknown>).country as string | null;
  const kycLevel = (session.user as Record<string, unknown>).kycLevel as number;

  // Check role requirements
  if (guardOptions.requiredRoles && guardOptions.requiredRoles.length > 0) {
    if (!hasRequiredRole(role, guardOptions.requiredRoles)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Accès non autorisé', code: 'FORBIDDEN', requiredRoles: guardOptions.requiredRoles },
          { status: 403 }
        ),
      };
    }
  }

  // Check KYC level requirements
  if (guardOptions.requireKycLevel && kycLevel < guardOptions.requireKycLevel) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Niveau KYC insuffisant', code: 'KYC_REQUIRED', requiredLevel: guardOptions.requireKycLevel, currentLevel: kycLevel },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    session,
    userId,
    email: session.user.email ?? '',
    role,
    country,
    kycLevel,
  };
}

/**
 * Convenience function that throws on auth failure.
 * Use in API routes for cleaner code.
 */
export async function requireAuth(
  requestOrOptions?: Request | AuthGuardOptions,
  options?: AuthGuardOptions
): Promise<AuthResult> {
  const result = await authGuard(requestOrOptions, options);
  if (!result.success) {
    throw result;
  }
  return result;
}
