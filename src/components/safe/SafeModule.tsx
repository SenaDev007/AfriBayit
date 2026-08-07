'use client';

import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

interface SafeModuleProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface SafeModuleState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Default fallback UI shown when SafeModule catches a render error.
 * Functional component so it can use the useTranslation hook.
 */
function SafeModuleFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('safeModule.title', 'Module temporairement indisponible')}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {t(
            'safeModule.description',
            "Ce module n'a pas pu se charger correctement. Veuillez reessayer."
          )}
        </p>
        {error?.message && (
          <p className="text-xs text-gray-400 mb-4 break-words">
            {t('safeModule.detailLabel', 'Detail :')} {error.message}
          </p>
        )}
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#002266] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('safeModule.retry', 'Reessayer')}
        </button>
      </div>
    </div>
  );
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
        <SafeModuleFallback error={this.state.error} onRetry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}
