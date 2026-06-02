import { NextResponse } from 'next/server';

export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID || '';
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  // Try to construct the Google OAuth URL manually
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${googleId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=openid%20email%20profile&` +
    `access_type=offline`;

  // Check for potential issues
  const issues: string[] = [];

  if (!googleId) issues.push('GOOGLE_CLIENT_ID is not set');
  if (!googleSecret) issues.push('GOOGLE_CLIENT_SECRET is not set');
  if (googleId === 'placeholder-google-client-id') issues.push('GOOGLE_CLIENT_ID is still placeholder');
  if (googleSecret === 'placeholder-google-client-secret') issues.push('GOOGLE_CLIENT_SECRET is still placeholder');
  if (!googleId.includes('googleusercontent.com')) issues.push('GOOGLE_CLIENT_ID does not look valid (should end with .apps.googleusercontent.com)');
  if (!googleSecret.startsWith('GOCSPX-')) issues.push('GOOGLE_CLIENT_SECRET does not start with GOCSPX- (new format) — might be outdated');
  if (!process.env.NEXTAUTH_URL) issues.push('NEXTAUTH_URL is not set');
  if (!process.env.NEXTAUTH_SECRET) issues.push('NEXTAUTH_SECRET is not set');

  return NextResponse.json({
    issues: issues.length > 0 ? issues : ['No issues found — configuration looks correct'],
    googleAuthUrl,
    redirectUri,
    clientIdLength: googleId.length,
    clientSecretLength: googleSecret.length,
  });
}
