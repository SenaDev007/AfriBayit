// AfriBayit — Vitest Setup (P4.1)
// Global setup for all unit tests

import { vi } from 'vitest';

// Mock @prisma/client to avoid DB initialization in unit tests
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    property: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    transaction: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    escrowAccount: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    kycDocument: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((cb) => cb(mockPrismaClient)),
  };
  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

// Mock the db module to use the mock Prisma client
vi.mock('@/lib/db', () => {
  const mockDb = {
    user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    property: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    transaction: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    escrowAccount: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    kycDocument: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  };
  return { db: mockDb };
});

// Mock Next.js headers/cookies helpers
vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

// Mock NextAuth getServerSession by default (override per-test)
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => null),
}));

// Mock z-ai-web-dev-sdk to avoid real LLM calls in tests
vi.mock('z-ai-web-dev-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: vi.fn() } },
  })),
}));

// Mock Resend (avoid real email sends)
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'test-email-id' }) },
  })),
}));

// Set test environment variables
vi.stubEnv('NODE_ENV', 'test');
process.env.NEXTAUTH_SECRET = 'test-secret-for-vitest-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Suppress console.log in tests (keep error/warn for debugging)
const originalLog = console.log;
console.log = (...args) => {
  // Allow logs that explicitly start with [TEST]
  if (typeof args[0] === 'string' && args[0].startsWith('[TEST]')) {
    originalLog(...args);
  }
};
