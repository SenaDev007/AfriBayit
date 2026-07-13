'use client';

/**
 * RoleContextBanner — small banner shown at the top of role-specific
 * dashboards to indicate which role the user is acting under.
 *
 * Example on /investor-dashboard:
 *   📊 Vous consultez ce dashboard en tant qu'investisseur
 *   [Changer de dashboard ▾]  [Gérer mes rôles ⚙]
 *
 * Only renders for multi-role users (single-role users don't need it).
 */

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { getRoleDefinition } from '@/lib/role-catalog';
import { LayoutDashboard, Settings } from 'lucide-react';

export default function RoleContextBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const { roles, primaryRole, availableDashboards } = useRoleAccess();

  // Don't render for single-role users
  if (roles.length <= 1) return null;

  // Don't render on the generic dashboard
  if (pathname === '/dashboard') return null;

  // Find which role this dashboard corresponds to
  const currentDashboard = availableDashboards.find((d) => pathname.startsWith(d.path));
  if (!currentDashboard) return null;

  const roleDef = getRoleDefinition(currentDashboard.roleKey);
  const Icon = roleDef.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 rounded-xl border ${roleDef.borderColor} ${roleDef.bgColor} px-4 py-2.5 flex items-center gap-3 flex-wrap`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/70`}>
        <Icon className={`w-4 h-4 ${roleDef.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#0a2a5e]">
          Vous consultez ce dashboard en tant que <span className={roleDef.color}>{roleDef.label}</span>
        </p>
        <p className="text-[11px] text-gray-500">
          Vous avez {roles.length} rôles actifs — basculez entre vos dashboards ci-contre.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {availableDashboards.length > 1 && (
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-medium text-[#003087] hover:underline inline-flex items-center gap-1"
          >
            <LayoutDashboard className="w-3 h-3" />
            Tableau de bord général
          </button>
        )}
        <button
          onClick={() => router.push('/settings/roles')}
          className="text-xs font-medium text-[#D4AF37] hover:underline inline-flex items-center gap-1"
        >
          <Settings className="w-3 h-3" />
          Gérer mes rôles
        </button>
      </div>
    </motion.div>
  );
}
