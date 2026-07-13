'use client';

/**
 * DashboardSwitcher — quick switcher for multi-role users (CDC V4 §3.1.1)
 *
 * Renders as a compact dropdown shown in the navbar. Lets a multi-role user
 * jump between any of their accessible dashboards without having to navigate
 * through the profile menu.
 *
 * Only renders if the user has >1 accessible dashboard (otherwise a single
 * link is enough — the standard profile menu already has it).
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ChevronDown, Check } from 'lucide-react';
import { useRoleAccess, type DashboardInfo } from '@/hooks/useRoleAccess';

export default function DashboardSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { availableDashboards } = useRoleAccess();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Don't render if user has only 1 dashboard (the generic /dashboard)
  if (availableDashboards.length <= 1) return null;

  // Find the currently active dashboard
  const currentDashboard = availableDashboards.find((d) => pathname.startsWith(d.path))
    || availableDashboards[0];

  const handleSelect = (dash: DashboardInfo) => {
    router.push(dash.path);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-[#003087]/10 text-[#003087] hover:bg-[#003087]/20"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{currentDashboard.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            <div className="px-3 py-2 border-b border-gray-100">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">
                Mes dashboards
              </span>
            </div>
            <div className="py-1 max-h-[340px] overflow-y-auto">
              {availableDashboards.map((dash) => {
                const isActive = pathname.startsWith(dash.path);
                return (
                  <button
                    key={dash.path}
                    onClick={() => handleSelect(dash)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-start gap-2 ${
                      isActive ? 'bg-[#003087]/5' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[#0a2a5e]">
                          {dash.label}
                        </span>
                        {dash.isPrimary && (
                          <span className="text-[9px] font-bold uppercase bg-[#D4AF37]/20 text-[#D4AF37] px-1.5 py-0.5 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                        {dash.description}
                      </p>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-[#003087] shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-gray-100 px-3 py-2">
              <button
                onClick={() => {
                  router.push('/settings/roles');
                  setOpen(false);
                }}
                className="text-[11px] text-[#D4AF37] hover:underline font-medium"
              >
                ⚙ Gérer mes rôles
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
