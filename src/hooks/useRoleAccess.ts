'use client';

/**
 * useRoleAccess — multi-role access control hook (CDC V4 §3.1.1)
 *
 * Provides:
 *   - roles: string[]         — all roles the current user has
 *   - primaryRole: string     — the user's primary role
 *   - hasRole(role): boolean  — true if user has this role (or is admin)
 *   - hasAnyRole(roles): boolean — true if user has any of the listed roles
 *   - hasAllRoles(roles): boolean — true if user has all of the listed roles
 *   - canAccess(path): boolean — checks against ROLE_GATED_ROUTES
 *   - availableDashboards: DashboardInfo[] — list of dashboards the user can access
 *
 * Admins automatically have access to everything (they bypass all role gates).
 */

import { useSession } from 'next-auth/react';
import { ROLE_CATALOG, getRoleDefinition } from '@/lib/role-catalog';

// Mirror of ROLE_GATED_ROUTES from middleware.ts (kept in sync manually)
// If you change one, change the other.
export const DASHBOARD_ACCESS: { path: string; roles: string[] }[] = [
  { path: '/agent-dashboard', roles: ['agent', 'certified_agent', 'premium_agent'] },
  { path: '/investor-dashboard', roles: ['investor'] },
  { path: '/owner-dashboard', roles: ['seller', 'agent', 'certified_agent', 'premium_agent'] },
  { path: '/hotel-dashboard', roles: ['hotelier'] },
  { path: '/notary-dashboard', roles: ['notary'] },
  { path: '/geotrust', roles: ['geometer'] },
  { path: '/admin', roles: ['admin'] },
  { path: '/dashboard', roles: [] }, // accessible to everyone authenticated
];

export interface DashboardInfo {
  path: string;
  roleKey: string;
  label: string;
  description: string;
  isPrimary: boolean;
}

export function useRoleAccess() {
  const { data: session } = useSession();

  const sessionRoles = session?.user?.roles;
  const sessionPrimaryRole = session?.user?.role;
  const roles: string[] = sessionRoles && sessionRoles.length > 0
    ? sessionRoles
    : sessionPrimaryRole
      ? [sessionPrimaryRole]
      : [];
  const primaryRole = sessionPrimaryRole || roles[0] || 'buyer';
  const isAdmin = roles.includes('admin');

  const hasRole = (role: string): boolean => {
    if (isAdmin) return true; // admin bypasses everything
    return roles.includes(role);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    if (isAdmin) return true;
    return roleList.some((r) => roles.includes(r));
  };

  const hasAllRoles = (roleList: string[]): boolean => {
    if (isAdmin) return true;
    return roleList.every((r) => roles.includes(r));
  };

  const canAccess = (path: string): boolean => {
    if (isAdmin) return true;
    // Find the matching dashboard route
    const match = DASHBOARD_ACCESS.find((d) => path.startsWith(d.path));
    if (!match) return true; // not a gated route → accessible
    if (match.roles.length === 0) return true; // public dashboard
    return match.roles.some((r) => roles.includes(r));
  };

  // Compute the list of dashboards the user can actually access.
  // Always includes /dashboard (the generic one) first.
  const availableDashboards: DashboardInfo[] = [];

  // Generic dashboard — always available
  availableDashboards.push({
    path: '/dashboard',
    roleKey: primaryRole,
    label: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité',
    isPrimary: true,
  });

  // Role-specific dashboards
  for (const entry of DASHBOARD_ACCESS) {
    if (entry.path === '/dashboard') continue; // already added
    if (entry.roles.length === 0) continue;    // not role-specific
    if (!hasAnyRole(entry.roles)) continue;

    // Find a representative role for this dashboard (prefer the user's actual role)
    const userMatchingRole = entry.roles.find((r) => roles.includes(r)) || entry.roles[0];
    const roleDef = getRoleDefinition(userMatchingRole);

    availableDashboards.push({
      path: entry.path,
      roleKey: userMatchingRole,
      label: roleDef.label,
      description: roleDef.description,
      isPrimary: userMatchingRole === primaryRole,
    });
  }

  return {
    roles,
    primaryRole,
    isAdmin,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    availableDashboards,
  };
}
