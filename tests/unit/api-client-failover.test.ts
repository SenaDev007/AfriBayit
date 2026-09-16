// Unit tests for the api-client same-origin failover (dead split-backend
// guard). Production incident: a stale Vercel env var
// NEXT_PUBLIC_API_URL=https://afribayit-api-production.up.railway.app
// pointed at a DELETED Railway app, so every client-side API call 404'd
// ("Application not found") while the same-origin monolith API worked
// perfectly — the site rendered with no data.
//
// NEXT_PUBLIC_API_URL is inlined at module load, so each test re-imports the
// module with a stubbed environment and a fresh module registry.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const DEAD_BACKEND = 'https://afribayit-api-production.up.railway.app';

type ApiClientModule = typeof import('@/lib/api-client');

/** Import the api-client with a controlled NEXT_PUBLIC_API_URL value. */
async function importApiClient(apiUrl: string | undefined): Promise<ApiClientModule> {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (apiUrl !== undefined) {
    vi.stubEnv('NEXT_PUBLIC_API_URL', apiUrl);
  }
  const mod = await import('@/lib/api-client');
  mod.__resetApiFailoverForTests();
  return mod;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client same-origin failover', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('404 from a dead external backend → retried same-origin, then pinned', async () => {
    const { api } = await importApiClient(DEAD_BACKEND);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith(DEAD_BACKEND)) {
        // Railway's "Application not found" 404
        return jsonResponse({ status: 'error', code: 404, message: 'Application not found' }, 404);
      }
      return jsonResponse({ properties: [{ id: 'p1', title: 'Villa Lomé' }] });
    });
    vi.stubGlobal('fetch', fetchMock);

    // First request: dead backend 404 → same-origin retry succeeds.
    const res1 = await api.get('/properties?limit=12');
    expect(res1).toEqual({ properties: [{ id: 'p1', title: 'Villa Lomé' }] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      `${DEAD_BACKEND}/api/properties?limit=12`,
    );
    expect(String(fetchMock.mock.calls[1][0])).toBe('/api/properties?limit=12');

    // Second request: pinned same-origin — the dead backend is never hit again.
    await api.get('/stats');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2][0])).toBe('/api/stats');
  });

  it('network error (dead host) on GET → same-origin retry succeeds and pins', async () => {
    const { api } = await importApiClient(DEAD_BACKEND);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith(DEAD_BACKEND)) {
        throw new TypeError('fetch failed — DNS/dead host');
      }
      return jsonResponse({ properties: 48, transactions: 3 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await api.get('/stats');
    expect(res).toEqual({ properties: 48, transactions: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toBe('/api/stats');
  });

  it('404 from external + 404 from same-origin → original 404 propagates, NO pinning', async () => {
    const { api, ApiError } = await importApiClient(DEAD_BACKEND);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({ error: 'Not found' }, 404),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/properties/does-not-exist')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2); // external + same-origin retry

    // Still not pinned: the next request targets the external backend again
    // (a live external API that legitimately 404s must not be abandoned).
    await expect(api.get('/properties/other')).rejects.toBeInstanceOf(ApiError);
    expect(String(fetchMock.mock.calls[2][0])).toBe(
      `${DEAD_BACKEND}/api/properties/other`,
    );
  });

  it('POST with 404 from the dead backend is retried same-origin (no handler executed)', async () => {
    const { api } = await importApiClient(DEAD_BACKEND);
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith(DEAD_BACKEND)) {
        return jsonResponse({ message: 'Application not found' }, 404);
      }
      expect(init?.method).toBe('POST');
      return jsonResponse({ ok: true, id: 'tx1' }, 201);
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await api.post('/payments/initiate', { transactionId: 't1', amount: 5000 });
    expect(res).toEqual({ ok: true, id: 'tx1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('503 on a GET is retried same-origin; 500 is NOT (server-side app error)', async () => {
    const { api, ApiError } = await importApiClient(DEAD_BACKEND);

    // 500 → authoritative error, no failover.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: 'Internal error' }, 500)),
    );
    await expect(api.get('/properties')).rejects.toBeInstanceOf(ApiError);
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(1);

    // Fresh module (pinned state must not leak) → 503 on GET → retried.
    const fresh = await importApiClient(DEAD_BACKEND);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.startsWith(DEAD_BACKEND)) {
          return new Response('Service Unavailable', { status: 503 });
        }
        return jsonResponse({ properties: [] });
      }),
    );
    const res = await fresh.api.get('/properties');
    expect(res).toEqual({ properties: [] });
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(2);
  });

  it('no NEXT_PUBLIC_API_URL (monolith default) → single same-origin request, no failover', async () => {
    const { api } = await importApiClient('');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input).startsWith(DEAD_BACKEND)).toBe(false);
      return jsonResponse({ properties: [{ id: 'p1' }] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await api.get('/properties');
    expect(res).toEqual({ properties: [{ id: 'p1' }] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('/api/properties');
  });

  it('toApiPath normalization still applies before failover (paths get the /api prefix)', async () => {
    const { api } = await importApiClient(DEAD_BACKEND);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith(DEAD_BACKEND)) return jsonResponse({}, 404);
      return jsonResponse({ properties: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    // Call WITHOUT the /api prefix — legacy call-site convention.
    await api.get('/properties');
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${DEAD_BACKEND}/api/properties`);
    expect(String(fetchMock.mock.calls[1][0])).toBe('/api/properties');
  });

  it('non-retryable bodies (FormData) skip the failover retry', async () => {
    const { api, ApiError } = await importApiClient(DEAD_BACKEND);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ message: 'Application not found' }, 404)),
    );

    const form = new FormData();
    form.append('file', 'x');
    await expect(api.upload('/kyc/submit', form)).rejects.toBeInstanceOf(ApiError);
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(1); // no retry
  });
});
