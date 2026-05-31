import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

type Role = 'buyer' | 'seller' | 'investor' | 'tourist' | 'artisan' | 'agent' | 'notary' | 'geometer' | 'admin';

interface AuthGuardOptions {
  requiredRoles?: Role[];
  requireKycLevel?: number; // minimum KYC level required
}

interface AuthResult {
  success: true;
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  userId: string;
  role: string;
  country: string | null;
  kycLevel: number;
}

interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * Auth guard for API routes.
 * Extracts session from NextAuth and validates role/KYC requirements.
 * Returns either a success result with user info or an error response.
 */
export async function authGuard(
  options: AuthGuardOptions = {}
): Promise<AuthResult | AuthError> {
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
  if (options.requiredRoles && options.requiredRoles.length > 0) {
    if (!options.requiredRoles.includes(role as Role)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Accès non autorisé', code: 'FORBIDDEN', requiredRoles: options.requiredRoles },
          { status: 403 }
        ),
      };
    }
  }

  // Check KYC level requirements
  if (options.requireKycLevel && kycLevel < options.requireKycLevel) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Niveau KYC insuffisant', code: 'KYC_REQUIRED', requiredLevel: options.requireKycLevel, currentLevel: kycLevel },
        { status: 403 }
      ),
    };
  }

  return {
    success: true,
    session,
    userId,
    role,
    country,
    kycLevel,
  };
}

/**
 * Convenience function that throws on auth failure.
 * Use in API routes for cleaner code.
 */
export async function requireAuth(options: AuthGuardOptions = {}): Promise<AuthResult> {
  const result = await authGuard(options);
  if (!result.success) {
    throw result;
  }
  return result;
}
