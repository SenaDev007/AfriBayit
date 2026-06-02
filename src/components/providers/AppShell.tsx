'use client';

import { Component, type ReactNode } from 'react';
import { Header } from '@/components/ui/header-3';
import Footer from '@/components/afribayit/Footer';
import NotificationsCenter from '@/components/afribayit/NotificationsCenter';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import RebeccaChat from '@/components/afribayit/RebeccaChat';
import { motion } from 'framer-motion';
import { CountryProvider } from '@/contexts/CountryContext';

function AppShellInner({ children }: { children: ReactNode }) {
  // useSession is called unconditionally per React's rules of hooks.
  // If NextAuth is misconfigured (e.g. missing NEXTAUTH_SECRET), the
  // NextAuthProvider error boundary will catch the SessionProvider failure
  // and render children without it. In that case useSession may throw,
  // which will be caught by the AppShell error boundary below.
  const { data: session } = useSession();

  const pathname = usePathname();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRebeccaOpen, setIsRebeccaOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const isLoggedIn = !!session?.user;

  const isHomePage = pathname === '/';
  const isAuthPage = pathname.startsWith('/auth/');
  const isAdminPage = pathname.startsWith('/admin');

  // Fetch notification count for logged-in users
  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications?unreadOnly=true&limit=1');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setNotificationCount(data.pagination?.total || data.unreadCount || 0);
        }
      } catch {
        // silently fail — notification count is non-critical
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  // Don't show navbar/footer on auth pages or admin pages (admin has its own layout)
  if (isAuthPage || isAdminPage) {
    return <>{children}</>;
  }

  return (
    <CountryProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <Header
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notificationCount={notificationCount}
        />

        <main className="flex-1">
          {children}
        </main>

        <Footer />

        {/* Rebecca Chat Widget (on all pages except auth) */}
        <RebeccaChat isOpen={isRebeccaOpen} onClose={() => setIsRebeccaOpen(false)} />

        {/* Rebecca FAB Button */}
        {!isRebeccaOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRebeccaOpen(true)}
            className="fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-40 w-14 h-14 bg-[#003087] rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">IA</span>
            </span>
          </motion.button>
        )}

        {/* Notifications Panel */}
        <NotificationsCenter
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />
      </div>
    </CountryProvider>
  );
}

/**
 * AppShell with error boundary — if anything in the shell
 * throws (e.g. useSession when NextAuth is broken), we
 * still render the page content without the shell chrome.
 */
interface AppShellProps {
  children: ReactNode;
}

interface AppShellState {
  hasError: boolean;
}

export default class AppShell extends Component<AppShellProps, AppShellState> {
  constructor(props: AppShellProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppShellState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(
      '[AfriBayit] AppShell encountered an error. Rendering page content without shell.',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      // Fallback: just render the page content without navbar/footer/chat
      return <div className="min-h-screen bg-white">{this.props.children}</div>;
    }

    return <AppShellInner>{this.props.children}</AppShellInner>;
  }
}
