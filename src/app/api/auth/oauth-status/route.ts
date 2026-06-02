import { NextResponse } from 'next/server';

/**
 * OAuth Provider Status Endpoint
 * Returns which OAuth providers are configured and available for the frontend.
 * Used by AuthPages.tsx to conditionally render Google/Facebook buttons.
 */
export async function GET() {
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

  return NextResponse.json({
    google: hasGoogle,
    facebook: hasFacebook,
  });
}
