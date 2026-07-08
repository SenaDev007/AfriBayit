'use client';

/**
 * Page /louer — Louer un bien immobilier en Afrique de l'Ouest
 * Compact hero + conversational AI search + property grid + advanced tools
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid from '@/components/afribayit/PropertyGrid';
import AdvancedFeaturesSection from '@/components/afribayit/AdvancedFeaturesSection';
import ConversationalSearchBar from '@/components/afribayit/ConversationalSearchBar';

export default function LouerPage() {
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
      activeTab="louer"
      hero={{
        badge: 'Location longue durée',
        title: 'Louez votre prochain chez-vous en toute sérénité',
        subtitle: 'Appartements, villas et bureaux à louer avec bail numérique sécurisé. Paiement Mobile Money intégré et dépôt de garantie protégé par Escrow.',
        backgroundImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Biens à louer' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Agents certifiés' },
          { value: 0, suffix: '+', label: 'Bailleurs' },
        ],
        ctaLabel: 'Voir les biens à louer',
        ctaHref: '#properties',
      }}
    >
      {/* Conversational AI search */}
      <section className="py-8 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConversationalSearchBar transaction="location" />
        </div>
      </section>

      {/* Properties */}
      <div id="properties">
        <PropertyGrid
          transaction="location"
          emptyMessage="Aucun bien à louer pour le moment"
          onPropertiesLoaded={handlePropertiesLoaded}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      </div>

      {/* Advanced features: map + comparator (no financing for rental) */}
      <AdvancedFeaturesSection
        transaction="location"
        properties={properties}
        onSelectProperty={handleSelectProperty}
        compareIds={compareIds}
        onToggleCompare={handleToggleCompare}
      />
    </TransactionPageShell>
  );
}
