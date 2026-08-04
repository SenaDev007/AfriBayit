// AfriBayit — signOutAndClear helper (CDC §10 — auth cleanup)
//
// Single entry-point for logging a user out client-side. Performs the
// four cleanup steps in order and is resilient to failures so a flaky
// backend logout endpoint never leaves the user in a half-signed-out
// state on the client.
//
//   1. POST /auth/logout            — invalidate refresh token server-side
//   2. localStorage.removeItem(...)  — wipe cached user data
//   3. setAccessToken(null)          — clear in-memory bearer token
//   4. signOut({ callbackUrl })      — drop NextAuth session cookie
//
// If any step throws, the remaining steps still run. The promise resolves
// only after all four steps have been attempted.

'use client';

import { signOut } from 'next-auth/react';
import { api, setAccessToken } from './api-client';

// All afribayit_* localStorage keys that hold user-specific data.
// Adding a new key here is the single source of truth for what gets
// wiped on logout.
export const LOGOUT_STORAGE_KEYS = [
  'afribayit_access_token',
  'afribayit-notification-prefs',
  'afribayit-silent-hours',
  'afribayit-premium-notifs',
  'afribayit_locale',
  'afribayit_country',
  'afribayit_onboarding_completed',
];

export interface SignOutOptions {
  /** Where to redirect after sign-out. Defaults to `/`. */
  callbackUrl?: string;
  /** Force NextAuth signOut to redirect (default: false — caller handles redirect). */
  redirect?: boolean;
}

export async function signOutAndClear(options?: SignOutOptions): Promise<void> {
  const callbackUrl = options?.callbackUrl ?? '/';
  const redirect = options?.redirect ?? false;

  // Step 1 — best-effort backend logout. Never throws to the caller.
  try {
    await api.post('/auth/logout', {});
  } catch (err) {
    console.warn('[signOutAndClear] Backend logout failed (continuing with local cleanup):', err);
  }

  // Step 2 — clear all afribayit_* localStorage keys. Wrapped in try/catch
  // so an unavailable / quota-exceeded localStorage doesn't abort the rest.
  if (typeof window !== 'undefined') {
    try {
      for (const key of LOGOUT_STORAGE_KEYS) {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore per-key failures.
        }
      }
    } catch (err) {
      console.warn('[signOutAndClear] localStorage cleanup failed:', err);
    }
  }

  // Step 3 — clear the in-memory access token used by the API client.
  try {
    setAccessToken(null);
  } catch (err) {
    console.warn('[signOutAndClear] setAccessToken(null) failed:', err);
  }

  // Step 4 — NextAuth signOut (clears the session cookie + optionally
  // redirects to callbackUrl).
  try {
    await signOut({ callbackUrl, redirect });
  } catch (err) {
    // Even NextAuth failing shouldn't leave the user stuck — local state
    // is already cleared above.
    console.warn('[signOutAndClear] NextAuth signOut failed:', err);
  }
}

export default signOutAndClear;
