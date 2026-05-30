'use client';

import GuesthouseModule from '@/components/afribayit/GuesthouseModule';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function GuesthousePage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <GuesthouseModule onNavigate={onNavigate} />
    </div>
  );
}
