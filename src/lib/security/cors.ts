// AfriBayit — CORS Configuration
// Cross-Origin Resource Sharing settings

export interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge: number;
  allowCredentials: boolean;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://afribayit.com',
    'https://www.afribayit.com',
    'https://app.afribayit.com',
    'https://admin.afribayit.com',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD5',
    'Date',
    'X-Api-Version',
    'X-Transform-Port',
  ],
  maxAge: 86400, // 24 hours
  allowCredentials: true,
};

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(
  request: Request,
  config: Partial<CorsConfig> = {}
): Record<string, string> {
  const mergedConfig = { ...DEFAULT_CORS_CONFIG, ...config };

  const origin = request.headers.get('origin') || '';
  const isAllowed = isOriginAllowed(origin, mergedConfig.allowedOrigins);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': mergedConfig.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': mergedConfig.allowedHeaders.join(', '),
    'Access-Control-Max-Age': String(mergedConfig.maxAge),
  };

  if (isAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  if (mergedConfig.allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (!origin) return false;

  // Development mode: allow localhost
  if (process.env.NODE_ENV === 'development') {
    if (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return true;
    }
  }

  return allowedOrigins.some((allowed) => {
    if (allowed === origin) return true;
    // Support wildcard subdomains
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(
  request: Request,
  config: Partial<CorsConfig> = {}
): Response | null {
  if (request.method !== 'OPTIONS') return null;

  const headers = getCorsHeaders(request, config);
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to an existing response
 */
export function addCorsHeaders(
  response: Response,
  request: Request,
  config: Partial<CorsConfig> = {}
): Response {
  const corsHeaders = getCorsHeaders(request, config);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
