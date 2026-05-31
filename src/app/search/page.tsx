'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SafeModule from '@/components/safe/SafeModule';

const EnhancedSearchResults = dynamic(() => import('@/components/afribayit/EnhancedSearchResults'), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

function SearchContent() {
  const { onSelectProperty } = useAfriBayitNav();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'achat';

  return (
    <div className="min-h-screen">
      <SafeModule>
        <EnhancedSearchResults
          initialTab={tab}
          onSelectProperty={onSelectProperty}
        />
      </SafeModule>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-20 min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
