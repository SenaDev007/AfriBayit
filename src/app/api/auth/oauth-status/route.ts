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

  return NextResponse.json({
    google: hasGoogle,
    facebook: hasFacebook,
    // Debug info: show if IDs look valid (not secrets)
    debug: {
      googleClientIdSet: !!googleId && googleId !== 'placeholder-google-client-id',
      googleClientSecretSet: !!googleSecret && googleSecret !== 'placeholder-google-client-secret',
      facebookClientIdSet: !!facebookId && facebookId !== 'placeholder-facebook-client-id',
      facebookClientSecretSet: !!facebookSecret && facebookSecret !== 'placeholder-facebook-client-secret',
      nextauthUrl: process.env.NEXTAUTH_URL || '(not set)',
      nextauthSecretSet: !!process.env.NEXTAUTH_SECRET,
    },
  });
}
