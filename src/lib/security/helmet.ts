// AfriBayit — Security Headers (Helmet.js-like configuration)
// Applies security headers to all responses

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  strictTransportSecurity?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
  xXssProtection?: string;
}

const DEFAULT_SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '0', // Disabled in favor of CSP
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'interest-cohort=()',
  ].join(', '),
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.cloudfront.net",
    "connect-src 'self' https://api.africastalking.com https://api.resend.com https://graph.facebook.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

/**
 * Get all security headers
 */
export function getSecurityHeaders(
  overrides: Partial<SecurityHeadersConfig> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...DEFAULT_SECURITY_HEADERS };

  // Apply overrides
  if (overrides.contentSecurityPolicy !== undefined) {
    headers['Content-Security-Policy'] = overrides.contentSecurityPolicy;
  }
  if (overrides.xFrameOptions !== undefined) {
    headers['X-Frame-Options'] = overrides.xFrameOptions;
  }
  if (overrides.xContentTypeOptions !== undefined) {
    headers['X-Content-Type-Options'] = overrides.xContentTypeOptions;
  }
  if (overrides.strictTransportSecurity !== undefined) {
    headers['Strict-Transport-Security'] = overrides.strictTransportSecurity;
  }
  if (overrides.referrerPolicy !== undefined) {
    headers['Referrer-Policy'] = overrides.referrerPolicy;
  }
  if (overrides.permissionsPolicy !== undefined) {
    headers['Permissions-Policy'] = overrides.permissionsPolicy;
  }

  return headers;
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: Response,
  config: Partial<SecurityHeadersConfig> = {}
): Response {
  const headers = getSecurityHeaders(config);

  Object.entries(headers).forEach(([key, value]) => {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  });

  return response;
}

/**
 * For development: relaxed CSP that allows localhost
 */
export function getDevSecurityHeaders(): Record<string, string> {
  return {
    ...DEFAULT_SECURITY_HEADERS,
    'Content-Security-Policy': [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' http://localhost:* https://localhost:*",
      "img-src 'self' data: blob: https://images.unsplash.com http://localhost:*",
    ].join('; '),
    'X-Frame-Options': 'SAMEORIGIN',
  };
}
