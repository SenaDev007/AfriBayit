// AfriBayit — BFF Proxy Route.
//
// CDC §10.1 — This route proxies ALL backend API calls through the Next.js
// server, reading the JWT from the httpOnly cookie (set by /api/auth/token)
// instead of localStorage. This eliminates the XSS token-theft vector entirely
// because the JWT never touches client-side JavaScript.
//
// Usage from the client:
//   Instead of:  apiFetch('/properties')  →  fetch(`${API_URL}/properties`, { headers: { Authorization: `Bearer ${localStorageToken}` } })
//   Use:         fetch('/api/proxy?path=/properties')  →  this route reads the httpOnly cookie and forwards
//
// The api-client.ts has a `useBFFProxy` flag (currently false for backward compat).
// When set to true, all calls route through this proxy instead of directly to the backend.
//
// This is the CDC §10.1 compliant pattern. Once fully tested, set useBFFProxy = true
// in api-client.ts and remove the localStorage token storage entirely.

import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';

// Legacy split-backend base (empty in the monolith). When set it serves the
// API WITHOUT the /api prefix (old Railway convention).
const EXTERNAL_API_URL = (process.env.NEXT_PUBLIC_API_URL || '')
  .replace(/\/+$/, '')
  .replace(/^([^h])/, 'https://$1');

/**
 * Candidate backend URLs for a proxied path, in order:
 * 1. Legacy split backend (NEXT_PUBLIC_API_URL) — routes WITHOUT /api prefix.
 * 2. Same-origin monolith (ADR 0001) — routes under /api/*.
 * The same-origin candidate guarantees the BFF keeps working even when the
 * legacy env var points at a removed host (e.g. deleted Railway deployment).
 */
function backendCandidates(request: NextRequest, path: string): string[] {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const candidates: string[] = [];
  if (EXTERNAL_API_URL) {
    candidates.push(`${EXTERNAL_API_URL}${normalizedPath}`);
  }
  candidates.push(`${request.nextUrl.origin}/api${normalizedPath}`);
  return candidates;
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, 'GET');
}
export async function POST(request: NextRequest) {
  return proxyRequest(request, 'POST');
}
export async function PATCH(request: NextRequest) {
  return proxyRequest(request, 'PATCH');
}
export async function PUT(request: NextRequest) {
  return proxyRequest(request, 'PUT');
}
export async function DELETE(request: NextRequest) {
  return proxyRequest(request, 'DELETE');
}

async function proxyRequest(request: NextRequest, method: string) {
  // Extract the backend path from the query string: /api/proxy?path=/properties/123
  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Read the JWT from the httpOnly cookie (set by /api/auth/token)
  const accessToken = request.cookies.get('afribayit_at')?.value;
  const countryCode = request.cookies.get('afribayit_country')?.value || 'BJ';

  // Forward the request to the backend
  const headers: Record<string, string> = {
    'X-Country-Code': countryCode,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Copy Content-Type for POST/PATCH/PUT
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  // Get the request body (for POST/PATCH/PUT)
  let body: BodyInit | null = null;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await request.text();
  }

  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    let backendResponse: Response | null = null;
    let lastError: unknown = null;
    for (const backendUrl of backendCandidates(request, path)) {
      try {
        const attempt = await fetch(backendUrl, {
          method,
          headers,
          body: body || undefined,
        });
        // Accept definitive answers; retry the next candidate only on
        // dead-backend symptoms (404 = no route executed, 502/503/504 =
        // gateway down). A live backend's own 4xx/5xx is authoritative.
        if (
          attempt.ok ||
          (attempt.status !== 404 &&
            attempt.status !== 502 &&
            attempt.status !== 503 &&
            attempt.status !== 504)
        ) {
          backendResponse = attempt;
          break;
        }
        lastError = new Error(`Backend ${backendUrl} answered HTTP ${attempt.status}`);
      } catch (err) {
        lastError = err;
      }
    }

    if (!backendResponse) {
      const message =
        lastError instanceof Error ? lastError.message : 'All backend candidates failed';
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Forward the response back to the client
    const responseContentType = backendResponse.headers.get('content-type') || '';

    if (responseContentType.includes('application/json')) {
      const data = await backendResponse.json();
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // For non-JSON responses (PDFs, images, etc.)
    const blob = await backendResponse.blob();
    return new NextResponse(blob, {
      status: backendResponse.status,
      headers: {
        'Content-Type': responseContentType || 'application/octet-stream',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
