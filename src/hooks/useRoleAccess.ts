'use client';

import { useSession } from 'next-auth/react';
import { ROLE_CATALOG, getRoleDefinition } from '@/lib/role-catalog';

export const DASHBOARD_ACCESS: { path: string; roles: string[] }[] = [
  { path: '/agent-dashboard', roles: ['agent', 'certified_agent', 'premium_agent'] },
  { path: '/investor-dashboard', roles: ['investor'] },
  { path: '/owner-dashboard', roles: ['seller', 'agent', 'certified_agent', 'premium_agent'] },
  { path: '/hotel-dashboard', roles: ['hotelier'] },
  { path: '/notary-dashboard', roles: ['notary'] },
  { path: '/geotrust', roles: ['geometer'] },
  { path: '/admin', roles: ['admin'] },
  { path: '/dashboard', roles: [] },
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
    if (isAdmin) return true;
    return roles.includes(role);
  };

  const hasAnyRole = (roleList: string[]): boolean => {
    if (isAdmin) return true;
    return roleList.some((r) => roles.includes(r));
  };

  const canAccess = (path: string): boolean => {
    if (isAdmin) return true;
    const match = DASHBOARD_ACCESS.find((d) => path.startsWith(d.path));
    if (!match) return true;
    if (match.roles.length === 0) return true;
    return match.roles.some((r) => roles.includes(r));
  };

  const availableDashboards: DashboardInfo[] = [];
  availableDashboards.push({
    path: '/dashboard', roleKey: primaryRole, label: 'Tableau de bord',
    description: 'Vue d\'ensemble de votre activité', isPrimary: true,
  });

  for (const entry of DASHBOARD_ACCESS) {
    if (entry.path === '/dashboard') continue;
    if (entry.roles.length === 0) continue;
    if (!hasAnyRole(entry.roles)) continue;
    const userMatchingRole = entry.roles.find((r) => roles.includes(r)) || entry.roles[0];
    const roleDef = getRoleDefinition(userMatchingRole);
    availableDashboards.push({
      path: entry.path, roleKey: userMatchingRole, label: roleDef.label,
      description: roleDef.description, isPrimary: userMatchingRole === primaryRole,
    });
  }

  return { roles, primaryRole, isAdmin, hasRole, hasAnyRole, canAccess, availableDashboards };
}
