// Unit tests for the api-client transient retry (serverless/Neon cold starts).
// Production symptom: intermittent « Erreur de chargement — Impossible de
// charger les biens » while the Vercel function or Neon compute wakes up:
// the browser receives a 502/503/504 or a dropped connection. A single
// short retry on idempotent GETs absorbs these transients.
//
// NEXT_PUBLIC_API_URL is inlined at module load, so each test re-imports the
// module with a stubbed environment and a fresh module registry.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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
  mod.__setApiRetryBackoffForTests(0); // no sleep in tests
  return mod;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api-client transient retry (serverless cold starts)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('same-origin 503 on GET is retried once and succeeds', async () => {
    const { api } = await importApiClient(''); // monolith (same-origin)
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 1) {
        return jsonResponse({ error: 'cold start' }, 503);
      }
      return jsonResponse({ properties: [{ id: 'p1', title: 'Villa Lomé' }] });
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await api.get('/properties?limit=12');
    expect(res).toEqual({ properties: [{ id: 'p1', title: 'Villa Lomé' }] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('same-origin 502 and 504 on GET are also retried (all gateway statuses)', async () => {
    for (const status of [502, 504]) {
      const { api } = await importApiClient('');
      const fetchMock = vi.fn(async () => {
        if (fetchMock.mock.calls.length === 1) {
          return new Response('Bad Gateway', { status });
        }
        return jsonResponse({ properties: 48, transactions: 3 });
      });
      vi.stubGlobal('fetch', fetchMock);

      const res = await api.get('/stats');
      expect(res).toEqual({ properties: 48, transactions: 3 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      vi.unstubAllGlobals();
    }
  });

  it('same-origin network error on GET is retried once and succeeds', async () => {
    const { api } = await importApiClient('');
    const fetchMock = vi.fn(async () => {
      if (fetchMock.mock.calls.length === 1) {
        throw new TypeError('fetch failed — connection dropped');
      }
      return jsonResponse({ properties: 48 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await api.get('/stats');
    expect(res).toEqual({ properties: 48 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('two consecutive 503s surface the error (exactly one retry, no loops)', async () => {
    const { api, ApiError } = await importApiClient('');
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'still cold' }, 503));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/properties')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('two consecutive network errors surface the original error', async () => {
    const { api } = await importApiClient('');
    const fetchMock = vi.fn(async () => {
      throw new TypeError('fetch failed — offline');
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/properties')).rejects.toThrow('fetch failed');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('POST is never transient-retried (non-idempotent)', async () => {
    const { api } = await importApiClient('');
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'unavailable' }, 503));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      api.post('/payments/initiate', { transactionId: 't1', amount: 5000 }),
    ).rejects.toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('500 is authoritative — NOT retried (application error, not transient)', async () => {
    const { api } = await importApiClient('');
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'boom' }, 500));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get('/properties')).rejects.toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('successful responses are never retried', async () => {
    const { api } = await importApiClient('');
    const fetchMock = vi.fn(async () => jsonResponse({ properties: [{ id: 'p1' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/properties');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
