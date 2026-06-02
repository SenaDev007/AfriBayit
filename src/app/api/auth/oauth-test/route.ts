import { NextResponse } from 'next/server';

/**
 * OAuth Test Endpoint v2
 * Tests the actual openid-client library that NextAuth uses internally.
 */
export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || '(not set)',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `SET (len=${process.env.NEXTAUTH_SECRET.length})` : 'NOT SET',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `SET (len=${process.env.GOOGLE_CLIENT_ID.length})` : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `SET (len=${process.env.GOOGLE_CLIENT_SECRET.length})` : 'NOT SET',
      FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? `SET (len=${process.env.FACEBOOK_CLIENT_ID.length})` : 'NOT SET',
      FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? `SET (len=${process.env.FACEBOOK_CLIENT_SECRET.length})` : 'NOT SET',
    },
  };

  // Test 1: Use openid-client to discover Google's OIDC config (same as NextAuth does)
  try {
    const openidClient = await import('openid-client');
    results.openidClientVersion = openidClient.version || 'unknown';

    // Google OIDC discovery
    try {
      const googleIssuer = await openidClient.Issuer.discover('https://accounts.google.com/.well-known/openid-configuration');
      results.googleOidcDiscovery = {
        success: true,
        issuer: googleIssuer.metadata.issuer,
        authorization_endpoint: googleIssuer.metadata.authorization_endpoint,
        token_endpoint: googleIssuer.metadata.token_endpoint,
        userinfo_endpoint: googleIssuer.metadata.userinfo_endpoint,
      };

      // Try to create a Client and build the authorization URL
      try {
        const client = new googleIssuer.Client({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uris: [`${process.env.NEXTAUTH_URL || 'https://afri-bayit.vercel.app'}/api/auth/callback/google`],
        });

        const authUrl = client.authorizationUrl({
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          state: 'test_state',
          code_challenge_method: 'S256',
        });

        results.googleClientCreation = {
          success: true,
          authUrl: authUrl.substring(0, 100) + '...',
          authUrlLength: authUrl.length,
        };
      } catch (clientErr) {
        results.googleClientCreation = {
          success: false,
          error: (clientErr as Error).message,
          stack: (clientErr as Error).stack?.substring(0, 300),
        };
      }
    } catch (discoveryErr) {
      results.googleOidcDiscovery = {
        success: false,
        error: (discoveryErr as Error).message,
        stack: (discoveryErr as Error).stack?.substring(0, 300),
      };
    }

    // Facebook doesn't use OIDC discovery, but has a specific graph API URL
    try {
      const fbDiscoveryUrl = 'https://www.facebook.com/.well-known/openid-configuration/';
      const fbDiscoveryResponse = await fetch(fbDiscoveryUrl, {
        signal: AbortSignal.timeout(10000),
      });
      if (fbDiscoveryResponse.ok) {
        const fbDiscovery = await fbDiscoveryResponse.json();
        results.facebookOidcDiscovery = {
          success: true,
          issuer: fbDiscovery.issuer,
          authorization_endpoint: fbDiscovery.authorization_endpoint,
          token_endpoint: fbDiscovery.token_endpoint,
          userinfo_endpoint: fbDiscovery.userinfo_endpoint,
        };
      } else {
        results.facebookOidcDiscovery = {
          success: false,
          status: fbDiscoveryResponse.status,
          note: 'Facebook may not support standard OIDC discovery',
        };
      }
    } catch (fbErr) {
      results.facebookOidcDiscovery = {
        success: false,
        error: (fbErr as Error).message,
        note: 'Facebook may not support standard OIDC discovery',
      };
    }
  } catch (importErr) {
    results.openidClientImport = {
      success: false,
      error: (importErr as Error).message,
    };
  }

  // Test 2: Check NextAuth providers config
  try {
    const { authOptions } = await import('@/lib/auth');
    results.nextAuthProviders = authOptions.providers.map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      type: p.type,
    }));
    results.nextAuthPages = authOptions.pages;
  } catch (err) {
    results.nextAuthConfigError = (err as Error).message;
  }

  return NextResponse.json(results, { status: 200 });
}
