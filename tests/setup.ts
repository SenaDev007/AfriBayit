// AfriBayit — Vitest Setup (P4.1 + Module 19 — frontend-only test setup)
//
// Replaces the dead Prisma/Resend/z-ai-sdk mocks (this is a frontend-only
// repo — there's no Prisma client, no email sender, no LLM SDK on this
// side of the wire). The new mocks cover Next.js server helpers,
// NextAuth (server + React), and the api-client so unit tests can drive
// the auth flow without a live backend.

import { vi } from 'vitest';

// ─── Next.js server helpers ───────────────────────────────────────────────
vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({
    get: () => undefined,
    getAll: () => [],
    set: () => {},
    delete: () => {},
  }),
}));

// ─── NextAuth (server) ────────────────────────────────────────────────────
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => null),
  default: vi.fn(() => null),
}));

// ─── NextAuth (React client) ──────────────────────────────────────────────
// `signOut` is spied on per-test (tests/unit/signout.test.ts) so we expose
// a default no-op implementation here.
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(() => Promise.resolve({ ok: true })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── API client (network) ─────────────────────────────────────────────────
// Default mocks for the api-client helpers. Tests that need to assert on
// specific calls should override these per-test using vi.mocked(...).
vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-client')>('@/lib/api-client');
  return {
    ...actual,
    api: {
      get: vi.fn().mockResolvedValue(null),
      post: vi.fn().mockResolvedValue({ ok: true }),
      patch: vi.fn().mockResolvedValue({ ok: true }),
      put: vi.fn().mockResolvedValue({ ok: true }),
      delete: vi.fn().mockResolvedValue({ ok: true }),
      upload: vi.fn().mockResolvedValue({ ok: true }),
    },
    apiFetch: vi.fn().mockResolvedValue(null),
    apiGet: vi.fn().mockResolvedValue(null),
    apiPost: vi.fn().mockResolvedValue({ ok: true }),
    apiPatch: vi.fn().mockResolvedValue({ ok: true }),
    apiDelete: vi.fn().mockResolvedValue({ ok: true }),
    apiPut: vi.fn().mockResolvedValue({ ok: true }),
    setAccessToken: vi.fn(),
    getAccessToken: vi.fn().mockReturnValue(null),
    authApi: {
      login: vi.fn().mockResolvedValue({}),
      login2FA: vi.fn().mockResolvedValue({}),
      register: vi.fn().mockResolvedValue({}),
      me: vi.fn().mockResolvedValue(null),
      logout: vi.fn().mockResolvedValue({ ok: true }),
      sendOTP: vi.fn().mockResolvedValue({}),
      verifyOTP: vi.fn().mockResolvedValue({}),
    },
    ApiError: actual.ApiError,
  };
});

// ─── Test environment variables ───────────────────────────────────────────
vi.stubEnv('NODE_ENV', 'test');
process.env.NEXTAUTH_SECRET = 'test-secret-for-vitest-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// ─── Console noise reduction ──────────────────────────────────────────────
// Suppress console.log in tests (keep error/warn for debugging).
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  // Allow logs that explicitly start with [TEST]
  if (typeof args[0] === 'string' && args[0].startsWith('[TEST]')) {
    originalLog(...args);
  }
};

// ─── jsdom polyfills ──────────────────────────────────────────────────────
// jsdom doesn't implement matchMedia / IntersectionObserver / ResizeObserver
// — polyfill them so component tests that touch UI hooks don't crash.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  if (!('IntersectionObserver' in window)) {
    // @ts-expect-error — minimal polyfill for tests only
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
  if (!('ResizeObserver' in window)) {
    // @ts-expect-error — minimal polyfill for tests only
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}
