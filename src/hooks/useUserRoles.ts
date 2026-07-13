'use client';

/**
 * useUserRoles — multi-role management hook (CDC V4 §3.1.1)
 *
 * Provides:
 *   - The current user's roles (from /users/me) with React Query caching
 *   - addRole(role) — POST /users/me/roles/:role
 *   - removeRole(role) — DELETE /users/me/roles/:role
 *   - setPrimaryRole(role) — PATCH /users/me/primary-role/:role
 *   - Loading / error states
 *   - NextAuth session refresh after each mutation so the JWT picks up
 *     the new roles array
 */

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, ApiError } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;        // primary role
  roles: string[];     // multi-role array
  country: string | null;
  city: string | null;
  kycLevel: number;
  verified: boolean;
}

export function useUserRoles() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive roles from session first (fast path, no network roundtrip),
  // then refresh from /users/me when needed.
  const sessionRoles = session?.user?.roles;
  const sessionPrimaryRole = session?.user?.role;
  const roles = sessionRoles && sessionRoles.length > 0
    ? sessionRoles
    : sessionPrimaryRole
      ? [sessionPrimaryRole]
      : [];
  const primaryRole = sessionPrimaryRole || roles[0] || 'buyer';

  const refresh = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const profile = await apiFetch<UserProfile>('/users/me', { auth: true });
      // Refresh the NextAuth session so the JWT and useSession() pick up
      // the new roles. The `update` function re-runs the jwt callback on
      // the backend, which now includes the roles array.
      if (update) {
        await update({
          ...session?.user,
          role: profile.role,
          roles: profile.roles,
        });
      }
      return profile;
    } catch (err) {
      // 401 means not logged in — return null silently
      if (err instanceof ApiError && err.statusCode === 401) return null;
      console.warn('[useUserRoles] refresh failed:', err);
      return null;
    }
  }, [session, update]);

  const addRole = useCallback(async (role: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/users/me/roles/${encodeURIComponent(role)}`, {
        method: 'POST',
        auth: true,
      });
      await refresh();
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erreur lors de l\'ajout du rôle';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const removeRole = useCallback(async (role: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/users/me/roles/${encodeURIComponent(role)}`, {
        method: 'DELETE',
        auth: true,
      });
      await refresh();
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erreur lors du retrait du rôle';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const setPrimaryRole = useCallback(async (role: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/users/me/primary-role/${encodeURIComponent(role)}`, {
        method: 'PATCH',
        auth: true,
      });
      await refresh();
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erreur lors du changement de rôle principal';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return {
    roles,
    primaryRole,
    loading,
    error,
    addRole,
    removeRole,
    setPrimaryRole,
    refresh,
  };
}
