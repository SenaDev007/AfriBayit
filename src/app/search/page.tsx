'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SafeModule from '@/components/safe/SafeModule';


const EnhancedSearchResults = dynamic(() => import('@/components/afribayit/EnhancedSearchResults'), {
  loading: () => (
    <div className="min-h-screen bg-cream flex items-center justify-center pt-20">
      <div className="animate-spin w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full" />
    </div>
  ),
});

function SearchContent() {
  const { onSelectProperty } = useAfriBayitNav();
  const searchParams = useSearchParams();
  // Onglet par défaut : celui de l'URL, sinon 'achat'. Une recherche
  // textuelle/vocale (paramètre q) sans onglet explicite ne restreint PAS
  // la transaction — « villa à louer à Cotonou » doit trouver les locations,
  // pas uniquement le catalogue achat.
  const hasQuery = !!searchParams.get('q');
  const tab = searchParams.get('tab') || (hasQuery ? 'all' : 'achat');
  const initialQuery = (searchParams.get('q') || '').slice(0, 200);
  // voice=1 → arrivée depuis la recherche vocale du Hero : bannière
  // « Recherche vocale » + transcription affichée.
  const isVoiceSearch = searchParams.get('voice') === '1' && hasQuery;

  return (
    <div className="min-h-screen bg-cream">
      <SafeModule>
        <EnhancedSearchResults
          initialTab={tab}
          initialQuery={initialQuery}
          voiceNotice={isVoiceSearch}
          onSelectProperty={onSelectProperty}
        />
      </SafeModule>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="pt-20 min-h-screen bg-cream flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
