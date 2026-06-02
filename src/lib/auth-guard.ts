import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { verifyAccessToken, type JWTPayload } from '@/lib/security/jwt-security';

type Role = 'buyer' | 'seller' | 'investor' | 'tourist' | 'artisan' | 'agent' | 'notary' | 'geometer' | 'admin';

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
function validateBearerToken(token: string): JWTPayload | null {
  const result = verifyAccessToken(token);
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
      const payload = validateBearerToken(bearerToken);
      if (payload) {
        // Validate role requirements
        if (guardOptions.requiredRoles && guardOptions.requiredRoles.length > 0) {
          if (!guardOptions.requiredRoles.includes(payload.role as Role)) {
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
    if (!guardOptions.requiredRoles.includes(role as Role)) {
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
