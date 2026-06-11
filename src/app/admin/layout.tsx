'use client';

import React, { useState, useCallback } from 'react';
import { SessionProvider } from 'next-auth/react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('ALL');

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
      <div className="min-h-screen bg-[#f8f9fc]">
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
          <main className="p-4 sm:p-5 lg:p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
