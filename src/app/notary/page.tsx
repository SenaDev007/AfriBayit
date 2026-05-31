'use client';

import NotaryModule from '@/components/afribayit/NotaryModule';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function NotaryPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <NotaryModule onNavigate={onNavigate} />
    </div>
  );
}
