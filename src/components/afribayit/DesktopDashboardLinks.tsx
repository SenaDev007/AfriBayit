'use client';

/**
 * DesktopDashboardLinks — compact list of dashboards shown in the desktop
 * profile dropdown (next to the user avatar in the navbar).
 *
 * Renders a vertical list of all dashboards the user can access, with the
 * currently active one highlighted. Used inside the profile dropdown of
 * the Navbar (desktop only).
 *
 * Only renders items beyond the generic /dashboard (the standard profile
 * menu already has 'Dashboard' as a top-level link).
 */

import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { getRoleDefinition } from '@/lib/role-catalog';

interface DesktopDashboardLinksProps {
  onNavigate: (href: string) => void;
}

export default function DesktopDashboardLinks({ onNavigate }: DesktopDashboardLinksProps) {
  const pathname = usePathname();
  const { availableDashboards } = useRoleAccess();

  // Skip the generic /dashboard (it's already in PROFILE_MENU_ITEMS)
  const roleDashboards = availableDashboards.filter((d) => d.path !== '/dashboard');

  if (roleDashboards.length === 0) return null;

  return (
    <>
      {roleDashboards.map((dash) => {
        const roleDef = getRoleDefinition(dash.roleKey);
        const Icon = roleDef.icon;
        const isActive = pathname.startsWith(dash.path);

        return (
          <button
            key={dash.path}
            onClick={() => onNavigate(dash.path)}
            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors hover:bg-gray-50 ${
              isActive ? 'text-[#003087] font-semibold' : 'text-gray-700'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? roleDef.color : 'text-gray-400'}`} />
            <span className="flex-1">{dash.label}</span>
            {dash.isPrimary && (
              <span className="text-[9px] font-bold uppercase bg-[#D4AF37]/20 text-[#D4AF37] px-1 py-0.5 rounded">
                Principal
              </span>
            )}
            {isActive && <Check className="w-3 h-3 text-[#003087]" />}
          </button>
        );
      })}
    </>
  );
}
