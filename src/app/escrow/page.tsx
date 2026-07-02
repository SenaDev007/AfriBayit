'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import SafeModule from '@/components/safe/SafeModule';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Escrow — AfriBayit",
  description: "Transactions sécurisées via escrow AfriBayit. Fonds protégés jusqu'à validation notariale.",
  keywords: ["escrow", "sécurité transaction", "fonds protégés"],
  openGraph: {
    title: "Escrow — AfriBayit",
    description: "Transactions sécurisées via escrow AfriBayit. Fonds protégés jusqu'à validation notariale.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Escrow — AfriBayit",
    description: "Transactions sécurisées via escrow AfriBayit. Fonds protégés jusqu'à validation notariale.",
  },
};

const EscrowFlow = dynamic(() => import('@/components/afribayit/EscrowFlow'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded mx-auto" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    </div>
  ),
});

export default function EscrowPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <EscrowFlow onNavigate={onNavigate} />
      </SafeModule>
    </div>
  );
}
