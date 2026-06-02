import { NextResponse } from 'next/server';

/**
 * OAuth Test Endpoint
 * Tests OAuth configuration by manually constructing authorization URLs
 * and attempting to discover the provider's OIDC configuration.
 * This helps debug why NextAuth's OAuth flow fails.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `SET (len=${process.env.NEXTAUTH_SECRET.length})` : 'NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `SET (len=${process.env.GOOGLE_CLIENT_ID.length})` : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `SET (len=${process.env.GOOGLE_CLIENT_SECRET.length})` : 'NOT SET',
      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? `SET (len=${process.env.FACEBOOK_CLIENT_ID.length})` : 'NOT SET',
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? `SET (len=${process.env.FACEBOOK_CLIENT_SECRET.length})` : 'NOT SET',
    },
  };

  // Test 1: Google OIDC Discovery
  try {
    const googleDiscoveryUrl = 'https://accounts.google.com/.well-known/openid-configuration';
    const discoveryResponse = await fetch(googleDiscoveryUrl, {
      signal: AbortSignal.timeout(10000),
    });
    if (discoveryResponse.ok) {
      const discovery = await discoveryResponse.json();
      results.googleDiscovery = {
        success: true,
        authorization_endpoint: discovery.authorization_endpoint,
        token_endpoint: discovery.token_endpoint,
        issuer: discovery.issuer,
      };
    } else {
      results.googleDiscovery = {
        success: false,
        status: discoveryResponse.status,
        statusText: discoveryResponse.statusText,
      };
    }
  } catch (e) {
    results.googleDiscovery = {
      success: false,
      error: (e as Error).message,
    };
  }

  // Test 2: Construct Google OAuth URL
  if (process.env.GOOGLE_CLIENT_ID) {
    const redirectUri = `${process.env.NEXTAUTH_URL || 'https://afri-bayit.vercel.app'}/api/auth/callback/google`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=test_state`;

    results.googleAuthUrl = {
      redirectUri,
      url: googleAuthUrl,
      urlLength: googleAuthUrl.length,
    };

    // Test if the redirect URI is properly formatted
    results.googleRedirectUriCheck = {
      redirectUri,
      startsWithHttps: redirectUri.startsWith('https://'),
      containsCallback: redirectUri.includes('/api/auth/callback/google'),
      domain: redirectUri.replace(/https?:\/\//, '').split('/')[0],
    };
  }

  // Test 3: Facebook OAuth URL
  if (process.env.FACEBOOK_CLIENT_ID) {
    const fbRedirectUri = `${process.env.NEXTAUTH_URL || 'https://afri-bayit.vercel.app'}/api/auth/callback/facebook`;
    results.facebookAuthUrl = {
      redirectUri: fbRedirectUri,
      appId: process.env.FACEBOOK_CLIENT_ID,
    };
  }

  // Test 4: Try to import and use NextAuth's internal OAuth handler
  try {
    // Dynamically import next-auth to test provider initialization
    const { default: NextAuth } = await import('next-auth');
    const GoogleProvider = (await import('next-auth/providers/google')).default;
    const FacebookProvider = (await import('next-auth/providers/facebook')).default;

    // Try creating Google provider
    try {
      const googleProvider = GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      });
      results.googleProviderInit = {
        success: true,
        id: googleProvider.id,
        name: googleProvider.name,
        type: googleProvider.type,
        hasAuthorization: !!googleProvider.authorization,
        hasToken: !!googleProvider.token,
        hasUserInfo: !!googleProvider.userinfo,
        wellKnown: (googleProvider as Record<string, unknown>).wellKnown || null,
      };
    } catch (e) {
      results.googleProviderInit = {
        success: false,
        error: (e as Error).message,
      };
    }

    // Try creating Facebook provider
    try {
      const fbProvider = FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID!,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      });
      results.facebookProviderInit = {
        success: true,
        id: fbProvider.id,
        name: fbProvider.name,
        type: fbProvider.type,
        hasAuthorization: !!fbProvider.authorization,
        hasToken: !!fbProvider.token,
        hasUserInfo: !!fbProvider.userinfo,
        wellKnown: (fbProvider as Record<string, unknown>).wellKnown || null,
      };
    } catch (e) {
      results.facebookProviderInit = {
        success: false,
        error: (e as Error).message,
      };
    }
  } catch (e) {
    results.nextAuthImportError = (e as Error).message;
  }

  return NextResponse.json(results, { status: 200 });
}
