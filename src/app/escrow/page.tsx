'use client';

import EscrowFlow from '@/components/afribayit/EscrowFlow';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function EscrowPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <EscrowFlow onNavigate={onNavigate} />
    </div>
  );
}
