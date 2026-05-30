'use client';

import ProfessionalProfileModule from '@/components/afribayit/ProfessionalProfileModule';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function ProfilePage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <ProfessionalProfileModule onNavigate={onNavigate} />
    </div>
  );
}
