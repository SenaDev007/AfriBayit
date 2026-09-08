// AfriBayit — Vitest Setup (P4.1 + Module 19)
//
// This is a full-stack Next.js monolith (see docs/adr/0001-monolith-architecture.md).
// Unit tests here only exercise pure-utility code paths.

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
// We do NOT mock @/lib/api-client globally — individual test files that
// need to assert on network calls should mock it per-test. This allows
// api-client shape tests (tests/unit/api-client.test.ts) to verify the
// real module exports without interference.

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
