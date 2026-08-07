// AfriBayit — signOutAndClear() unit tests (Module 19 — P4.1)
//
// Verifies the four-step sign-out cleanup:
//   1. Calls the backend logout endpoint (`POST /auth/logout`).
//   2. Clears all afribayit_* localStorage keys.
//   3. Calls `setAccessToken(null)` to drop the in-memory bearer token.
//   4. Calls NextAuth's `signOut()` to drop the session cookie.
// And that steps 2-4 still run even if step 1 throws.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api-client so we can assert on api.post + setAccessToken calls
// without hitting the network. The signout module imports from './api-client'
// (relative), which resolves to the same file as '@/lib/api-client', so this
// mock covers both import paths.
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn().mockResolvedValue(null),
    post: vi.fn().mockResolvedValue({ ok: true }),
    patch: vi.fn().mockResolvedValue({ ok: true }),
    put: vi.fn().mockResolvedValue({ ok: true }),
    delete: vi.fn().mockResolvedValue({ ok: true }),
    upload: vi.fn().mockResolvedValue({ ok: true }),
    downloadBlob: vi.fn().mockResolvedValue(undefined),
  },
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn().mockReturnValue(null),
  ApiError: class ApiError extends Error {
    statusCode: number;
    data?: unknown;
    constructor(msg: string, code: number, data?: unknown) {
      super(msg);
      this.statusCode = code;
      this.data = data;
    }
  },
}));

import { api, setAccessToken } from '@/lib/api-client';
import { signOut } from 'next-auth/react';
import { signOutAndClear, LOGOUT_STORAGE_KEYS } from '@/lib/signout';

describe('signOutAndClear()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('calls the backend logout endpoint', async () => {
    await signOutAndClear();
    expect(api.post).toHaveBeenCalledWith('/auth/logout', {});
  });

  it('clears all afribayit_* localStorage keys', async () => {
    // Pre-populate localStorage with sentinel values so we can confirm they
    // get removed.
    for (const key of LOGOUT_STORAGE_KEYS) {
      localStorage.setItem(key, 'sentinel');
    }
    expect(LOGOUT_STORAGE_KEYS.length).toBeGreaterThan(0);

    await signOutAndClear();

    for (const key of LOGOUT_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it('calls setAccessToken(null)', async () => {
    await signOutAndClear();
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });

  it('calls NextAuth signOut() with the default callbackUrl', async () => {
    await signOutAndClear();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith(
      expect.objectContaining({ callbackUrl: '/', redirect: false }),
    );
  });

  it('forwards callbackUrl and redirect options to signOut()', async () => {
    await signOutAndClear({ callbackUrl: '/auth/login', redirect: true });
    expect(signOut).toHaveBeenCalledWith(
      expect.objectContaining({ callbackUrl: '/auth/login', redirect: true }),
    );
  });

  it('still clears localStorage + setAccessToken + signOut when the backend logout fails', async () => {
    // Make api.post reject — simulating a network error or 5xx.
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

    for (const key of LOGOUT_STORAGE_KEYS) {
      localStorage.setItem(key, 'sentinel');
    }

    // Must NOT throw — failure is contained inside signOutAndClear.
    await expect(signOutAndClear()).resolves.toBeUndefined();

    // Local state still cleared.
    for (const key of LOGOUT_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(setAccessToken).toHaveBeenCalledWith(null);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('still calls signOut() even when localStorage is unavailable', async () => {
    // Simulate a Privacy Mode browser where localStorage throws.
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('localStorage unavailable');
      },
    });

    try {
      // Should not throw.
      await expect(signOutAndClear()).resolves.toBeUndefined();
      expect(setAccessToken).toHaveBeenCalledWith(null);
      expect(signOut).toHaveBeenCalledTimes(1);
    } finally {
      // Restore localStorage for subsequent tests.
      if (original) {
        Object.defineProperty(window, 'localStorage', original);
      }
    }
  });
});
