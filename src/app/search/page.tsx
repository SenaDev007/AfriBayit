'use client';

import EnhancedSearchResults from '@/components/afribayit/EnhancedSearchResults';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SearchContent() {
  const { onSelectProperty } = useAfriBayitNav();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'achat';

  return (
    <div className="pt-20 min-h-screen">
      <EnhancedSearchResults
        initialTab={tab}
        onSelectProperty={onSelectProperty}
      />
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
