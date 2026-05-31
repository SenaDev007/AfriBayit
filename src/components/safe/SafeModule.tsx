'use client';

import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface SafeModuleProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SafeModuleState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary wrapper for module components.
 * Catches render-time errors and shows a friendly fallback UI
 * instead of crashing the entire page.
 */
export default class SafeModule extends Component<SafeModuleProps, SafeModuleState> {
  constructor(props: SafeModuleProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SafeModule] Component error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Module temporairement indisponible
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ce module n&apos;a pas pu se charger correctement. Veuillez reessayer.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-gray-400 mb-4 break-words">
                Detail : {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#002266] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
