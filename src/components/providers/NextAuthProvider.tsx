'use client';

import { Component, type ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

interface NextAuthProviderProps {
  children: ReactNode;
}

interface NextAuthProviderState {
  hasError: boolean;
}

/**
 * Wraps next-auth SessionProvider with an error boundary.
 * If NEXTAUTH_SECRET is missing or next-auth fails to initialize,
 * the app will still render children without a session context
 * instead of crashing the entire page.
 */
export default class NextAuthProvider extends Component<
  NextAuthProviderProps,
  NextAuthProviderState
> {
  constructor(props: NextAuthProviderProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): NextAuthProviderState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(
      '[AfriBayit] NextAuth SessionProvider failed to initialize. ' +
        'This is usually caused by a missing NEXTAUTH_SECRET environment variable. ' +
        'The app will continue without authentication.',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      // Render children without SessionProvider so the app still works
      // (just without auth session context)
      return this.props.children;
    }

    return <SessionProvider>{this.props.children}</SessionProvider>;
  }
}
