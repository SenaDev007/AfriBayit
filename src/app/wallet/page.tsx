'use client';

import WalletModule from '@/components/afribayit/WalletModule';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function WalletPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <WalletModule onNavigate={onNavigate} />
    </div>
  );
}
