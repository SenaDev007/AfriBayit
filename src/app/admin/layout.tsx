'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  // Le sélecteur pays suit l'URL : /admin/BJ/… → BJ, sinon console globale.
  // Ainsi le « bord de contrôle » reflète toujours le backoffice visité.
  useEffect(() => {
    const match = pathname.match(/^\/admin\/([A-Z]{2})(?:\/|$)/);
    setSelectedCountry(match ? match[1] : 'ALL');
  }, [pathname]);

  // Thème sombre Win-Agro : la classe .admin-dark est posée sur la coque ET
  // sur <body> — les portails (Dialog, Select, DropdownMenu, Toaster) sont
  // attachés à document.body et héritent ainsi des variables sombres.
  useEffect(() => {
    document.body.classList.add('admin-dark');
    return () => {
      document.body.classList.remove('admin-dark');
    };
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleCountryChange = useCallback((code: string) => {
    setSelectedCountry(code);
  }, []);

  return (
    <SessionProvider>
      <div className="admin-dark min-h-screen bg-admin-bg">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={handleToggleSidebar}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10">
              <AdminSidebar
                collapsed={false}
                onToggle={() => setMobileMenuOpen(false)}
                selectedCountry={selectedCountry}
                onCountryChange={(code) => {
                  handleCountryChange(code);
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
          )}
        >
          <AdminHeader
            onMobileMenuToggle={handleMobileMenuToggle}
            selectedCountry={selectedCountry}
            onCountryChange={handleCountryChange}
          />
          <main className="p-4 lg:p-6 min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
