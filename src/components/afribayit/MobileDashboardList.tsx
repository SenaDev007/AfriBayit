'use client';

/**
 * MobileDashboardList — vertical list of dashboards for the mobile menu.
 *
 * Renders a compact list of all dashboards the user can access, with the
 * currently active one highlighted. Used inside the mobile slide-in menu
 * of the Navbar.
 *
 * Only renders the section if the user has >1 dashboard (otherwise the
 * generic profile menu link to /dashboard is enough).
 */

import { usePathname } from 'next/navigation';
import { LayoutDashboard, ChevronRight } from 'lucide-react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { getRoleDefinition } from '@/lib/role-catalog';

interface MobileDashboardListProps {
  onNavigate: (href: string) => void;
}

export default function MobileDashboardList({ onNavigate }: MobileDashboardListProps) {
  const pathname = usePathname();
  const { availableDashboards } = useRoleAccess();

  // Don't render if there's only the generic dashboard
  if (availableDashboards.length <= 1) return null;

  return (
    <div className="space-y-0.5">
      <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-[#003087] flex items-center gap-1">
        <LayoutDashboard className="w-3 h-3" />
        Mes dashboards
      </p>
      {availableDashboards.map((dash) => {
        const roleDef = getRoleDefinition(dash.roleKey);
        const Icon = roleDef.icon;
        const isActive = pathname.startsWith(dash.path);

        return (
          <button
            key={dash.path}
            onClick={() => onNavigate(dash.path)}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-colors ${
              isActive
                ? 'bg-[#003087]/5 text-[#003087] font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? roleDef.color : 'text-gray-400'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span>{dash.label}</span>
                {dash.isPrimary && (
                  <span className="text-[9px] font-bold uppercase bg-[#D4AF37]/20 text-[#D4AF37] px-1 py-0.5 rounded">
                    Principal
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-3 h-3 text-gray-300" />
          </button>
        );
      })}
    </div>
  );
}
