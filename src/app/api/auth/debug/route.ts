import { NextResponse } from 'next/server';

export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID || '(not set)';
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET || '(not set)';
  const facebookId = process.env.FACEBOOK_CLIENT_ID || '(not set)';
  const facebookSecret = process.env.FACEBOOK_CLIENT_SECRET || '(not set)';
  const nextauthUrl = process.env.NEXTAUTH_URL || '(not set)';
  const nextauthSecret = process.env.NEXTAUTH_SECRET ? '(set, ' + process.env.NEXTAUTH_SECRET.length + ' chars)' : '(not set)';

  // Show partial values for debugging (first 10 chars + last 4)
  const mask = (val: string) => {
    if (val === '(not set)' || val.length < 15) return val;
    return val.substring(0, 10) + '...' + val.substring(val.length - 4);
  };

  return NextResponse.json({
    nextauth: {
      url: nextauthUrl,
      secret: nextauthSecret,
    },
    google: {
      clientId: mask(googleId),
      clientSecret: mask(googleSecret),
      clientIdLength: googleId === '(not set)' ? 0 : googleId.length,
      clientSecretLength: googleSecret === '(not set)' ? 0 : googleSecret.length,
      clientIdFormat: googleId.includes('googleusercontent.com') ? 'valid format' : 'INVALID format (should end with .apps.googleusercontent.com)',
    },
    facebook: {
      clientId: mask(facebookId),
      clientSecret: mask(facebookSecret),
      clientIdLength: facebookId === '(not set)' ? 0 : facebookId.length,
    },
    expectedCallbacks: {
      google: `${nextauthUrl}/api/auth/callback/google`,
      facebook: `${nextauthUrl}/api/auth/callback/facebook`,
    },
  });
}
