'use client';

/**
 * Page /acheter — Acheter un bien immobilier en Afrique de l'Ouest
 * Compact hero + conversational AI search + property grid + advanced tools
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid from '@/components/afribayit/PropertyGrid';
import AdvancedFeaturesSection from '@/components/afribayit/AdvancedFeaturesSection';
import ConversationalSearchBar from '@/components/afribayit/ConversationalSearchBar';

export default function AcheterPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handlePropertiesLoaded = useCallback((props: any[]) => {
    setProperties(props);
  }, []);

  const handleToggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }, []);

  const handleSelectProperty = useCallback((id: string) => {
    router.push(`/property/${id}`);
  }, [router]);

  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Achat immobilier',
        title: 'Trouvez votre bien à acheter en Afrique de l\'Ouest',
        subtitle: 'Villas, appartements, terrains et bureaux vérifiés avec documents légaux validés. Transactions sécurisées par Escrow et assistance notariale dans 4 pays.',
        backgroundImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Biens à vendre' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Agents certifiés' },
          { value: 0, suffix: '+', label: 'Transactions' },
        ],
        ctaLabel: 'Voir les biens à acheter',
        ctaHref: '#properties',
      }}
    >
      {/* Conversational AI search */}
      <section className="py-12 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConversationalSearchBar transaction="achat" />
        </div>
      </section>

      {/* Properties grid */}
      <div id="properties">
        <PropertyGrid
          transaction="achat"
          emptyMessage="Aucun bien à vendre pour le moment"
          onPropertiesLoaded={handlePropertiesLoaded}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      </div>

      {/* Advanced features: map, comparator, financing simulator */}
      <AdvancedFeaturesSection
        transaction="achat"
        properties={properties}
        onSelectProperty={handleSelectProperty}
        showFinancing
        compareIds={compareIds}
        onToggleCompare={handleToggleCompare}
      />
    </TransactionPageShell>
  );
}
