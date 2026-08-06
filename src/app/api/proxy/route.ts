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

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  .replace(/\/+$/, '')
  .replace(/^([^h])/, 'https://$1');

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

  // Build the backend URL
  const backendUrl = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;

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
    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      body: body || undefined,
    });

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
