import { NextResponse } from 'next/server';

export async function GET() {
  // Check OAuth env vars — report what's configured (without revealing secrets)
  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  const facebookId = process.env.FACEBOOK_CLIENT_ID;
  const facebookSecret = process.env.FACEBOOK_CLIENT_SECRET;

  const hasGoogle = !!(
    googleId &&
    googleId !== 'placeholder-google-client-id' &&
    googleSecret &&
    googleSecret !== 'placeholder-google-client-secret'
  );

  const hasFacebook = !!(
    facebookId &&
    facebookId !== 'placeholder-facebook-client-id' &&
    facebookSecret &&
    facebookSecret !== 'placeholder-facebook-client-secret'
  );

  // Extended debug: validate credential formats
  const debug: Record<string, unknown> = {
    googleClientIdSet: !!googleId && googleId !== 'placeholder-google-client-id',
    googleClientSecretSet: !!googleSecret && googleSecret !== 'placeholder-google-client-secret',
    facebookClientIdSet: !!facebookId && facebookId !== 'placeholder-facebook-client-id',
    facebookClientSecretSet: !!facebookSecret && facebookSecret !== 'placeholder-facebook-client-secret',
    nextauthUrl: process.env.NEXTAUTH_URL || '(not set)',
    nextauthSecretSet: !!process.env.NEXTAUTH_SECRET,
    nextauthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
  };

  // Google Client ID format check (should be something like: 123456789-xxxx.apps.googleusercontent.com)
  if (googleId) {
    debug.googleClientIdLength = googleId.length;
    debug.googleClientIdEndsWithAppsGoogleusercontent = googleId.endsWith('.apps.googleusercontent.com');
    debug.googleClientIdStart = googleId.substring(0, 12) + '...';
  }

  // Google Client Secret format check (should start with GOCSPX- for web applications)
  if (googleSecret) {
    debug.googleClientSecretLength = googleSecret.length;
    debug.googleClientSecretStartsWithGOCSPX = googleSecret.startsWith('GOCSPX-');
    debug.googleClientSecretStart = googleSecret.substring(0, 6) + '***';
  }

  // Facebook App ID format check (should be numeric)
  if (facebookId) {
    debug.facebookClientIdLength = facebookId.length;
    debug.facebookClientIdIsNumeric = /^\d+$/.test(facebookId);
    debug.facebookClientIdStart = facebookId.substring(0, 4) + '...';
  }

  // Facebook Client Secret format check (should be 32-char hex)
  if (facebookSecret) {
    debug.facebookClientSecretLength = facebookSecret.length;
    debug.facebookClientSecretIsHex = /^[a-f0-9]+$/i.test(facebookSecret);
    debug.facebookClientSecretStart = facebookSecret.substring(0, 4) + '***';
  }

  // Test: manually construct the Google OAuth URL
  if (hasGoogle) {
    try {
      const redirectUri = `${process.env.NEXTAUTH_URL || 'https://afri-bayit.vercel.app'}/api/auth/callback/google`;
      debug.googleRedirectUri = redirectUri;
      debug.googleAuthUrlConstructable = true;
    } catch (e) {
      debug.googleAuthUrlConstructable = false;
      debug.googleAuthUrlError = (e as Error).message;
    }
  }

  return NextResponse.json({
    google: hasGoogle,
    facebook: hasFacebook,
    debug,
  });
}
