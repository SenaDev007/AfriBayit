'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch, ApiError } from '@/lib/api-client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  country: string | null;
  city: string | null;
  kycLevel: number;
  verified: boolean;
}

export function useUserRoles() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (update) {
        await update({
          ...session?.user,
          role: profile.role,
          roles: profile.roles,
        });
      }
      return profile;
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) return null;
      return null;
    }
  }, [session, update]);

  const addRole = useCallback(async (role: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/users/me/roles/${encodeURIComponent(role)}`, { method: 'POST', auth: true });
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
      await apiFetch(`/users/me/roles/${encodeURIComponent(role)}`, { method: 'DELETE', auth: true });
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
      await apiFetch(`/users/me/primary-role/${encodeURIComponent(role)}`, { method: 'PATCH', auth: true });
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

  return { roles, primaryRole, loading, error, addRole, removeRole, setPrimaryRole, refresh };
}
