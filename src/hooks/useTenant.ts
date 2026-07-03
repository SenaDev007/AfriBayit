// AfriBayit — useTenant Hook (frontend stub)
// Tenant config is now managed by the backend API.
// This hook provides basic country selection for the frontend.

import { useState, useCallback } from 'react';
import { COUNTRIES_CONFIG } from '@/lib/constants';

export function useTenant() {
  const [selectedCountry, setSelectedCountry] = useState<string>('BJ');

  const countries = COUNTRIES_CONFIG;
  const currentCountry = COUNTRIES_CONFIG.find((c: any) => c.code === selectedCountry) || COUNTRIES_CONFIG[0];

  const setCountry = useCallback((code: string) => {
    setSelectedCountry(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('afribayit_country', code);
    }
  }, []);

  return {
    selectedCountry,
    setCountry,
    countries,
    currentCountry,
  };
}

export function formatPrice(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
