'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import SafeModule from '@/components/safe/SafeModule';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Portefeuille — AfriBayit",
  description: "Gérez votre portefeuille AfriBayit : solde, transactions, payouts, AfriPoints.",
  keywords: ["portefeuille", "wallet", "solde", "transactions"],
  openGraph: {
    title: "Portefeuille — AfriBayit",
    description: "Gérez votre portefeuille AfriBayit : solde, transactions, payouts, AfriPoints.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portefeuille — AfriBayit",
    description: "Gérez votre portefeuille AfriBayit : solde, transactions, payouts, AfriPoints.",
  },
};

const WalletModule = dynamic(() => import('@/components/afribayit/WalletModule'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-48 bg-gray-100 rounded-3xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function WalletPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <WalletModule onNavigate={onNavigate} />
      </SafeModule>
    </div>
  );
}
