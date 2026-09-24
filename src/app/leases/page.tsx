'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLeases } from '@/hooks/useLeases';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Home, KeyRound, Calendar, Coins, ChevronRight, Download } from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: '#9ca3af' },
  PENDING_SIGNATURE: { label: 'En attente de signature', color: '#D4AF37' },
  ACTIVE: { label: 'Actif', color: '#00A651' },
  PENDING_CHECKOUT: { label: 'Sortie en cours', color: '#009CDE' },
  EXPIRED: { label: 'Expiré', color: '#6b7280' },
  TERMINATED: { label: 'Résilié', color: '#ef4444' },
  RENEWED: { label: 'Renouvelé', color: '#009CDE' },
  CANCELLED: { label: 'Annulé', color: '#ef4444' },
};

interface LeaseListItem {
  id: string;
  leaseRef?: string;
  status: string;
  country?: string;
  monthlyRent: number;
  currency: string;
  startDate: string;
  endDate: string;
  leaseTermMonths: number;
  documents?: Array<unknown>;
  property?: {
    title?: string;
    city?: string;
    images?: string | string[];
  };
}

export default function LeasesPage() {
  const router = useRouter();
  const [role, setRole] = useState<'tenant' | 'owner' | 'all'>('all');
  const { data, isLoading } = useLeases(role);

  const leases: LeaseListItem[] = (data?.leases || []) as LeaseListItem[];

  const handleSelect = useCallback((id: string) => {
    router.push(`/leases/${id}`);
  }, [router]);

  return (
    <section className="min-h-screen pt-24 pb-16 bg-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-text mb-2">
            <Link href="/dashboard" className="hover:text-primary-deep">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-deep font-bold">Mes baux</span>
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
            Contrats de location
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep mb-2">Mes baux de location</h1>
          <div className="h-1 w-16 bg-accent-yellow rounded-full mb-4" />
          <p className="text-sm text-gray-text">
            Gérez vos contrats de location longue durée — génération, signature électronique,
            état des lieux entrée/sortie et libération du dépôt de garantie.
          </p>
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-white rounded-full border border-primary-pale shadow-sm w-fit">
          {(['all', 'tenant', 'owner'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                role === r ? 'bg-primary-green text-white shadow-md' : 'text-gray-text hover:text-primary-deep hover:bg-primary-pale/60'
              }`}
            >
              {r === 'all' ? 'Tous' : r === 'tenant' ? 'Locataire' : 'Bailleur'}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-3xl bg-primary-pale/60" />
            ))}
          </div>
        ) : leases.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-primary-pale shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-primary-pale flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary-green" />
            </div>
            <h3 className="font-serif text-xl font-bold text-primary-deep mb-2">Aucun bail pour le moment</h3>
            <p className="text-sm text-gray-text mb-6 max-w-md mx-auto">
              Lorsque vous initierez une location sur un bien immobilier, le bail apparaîtra ici.
              Vous pourrez le générer, le signer électroniquement et suivre l&apos;état des lieux.
            </p>
            <Link
              href="/louer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-green text-white rounded-full text-sm font-bold hover:bg-primary-deep shadow-md hover:shadow-lg transition-all"
            >
              <Home className="w-4 h-4" />
              Voir les biens à louer
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.map((lease: any, i: number) => (
              <LeaseCard key={lease.id} lease={lease} onSelect={handleSelect} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LeaseCard({ lease, onSelect, index }: { lease: any; onSelect: (id: string) => void; index: number }) {
  const property = lease.property;
  const status = STATUS_LABELS[lease.status] || STATUS_LABELS.DRAFT;
  const hasContract = lease.documents?.length > 0;
  const images = (() => {
    try {
      const v = typeof property?.images === 'string' ? JSON.parse(property.images) : property?.images;
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  })();
  const firstImage = images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop';

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onSelect(lease.id)}
      className="w-full text-left bg-white rounded-3xl border border-primary-pale p-4 hover:shadow-lg hover:border-primary-green/30 transition-all flex gap-4 items-center card-shimmer"
    >
      {/* Property thumbnail */}
      <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden relative bg-primary-pale">
        <ImageWithFallback
          src={firstImage}
          alt={property?.title || 'Bien'}
          fill
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Lease info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-serif font-bold text-primary-deep truncate">
            {property?.title || 'Bien immobilier'}
          </h3>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
            style={{ backgroundColor: `${status.color}15`, color: status.color }}
          >
            {status.label}
          </span>
        </div>
        <p className="text-xs text-gray-text mb-2">
          Réf. {lease.leaseRef} · {property?.city}, {lease.country}
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-gray-text">
          <span className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            {new Intl.NumberFormat('fr-FR').format(lease.monthlyRent)} {lease.currency}/mois
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(lease.startDate).toLocaleDateString('fr-FR')} → {new Date(lease.endDate).toLocaleDateString('fr-FR')}
          </span>
          <span className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5" />
            {lease.leaseTermMonths} mois
          </span>
          {hasContract && (
            <span className="flex items-center gap-1 text-[#00A651]">
              <FileText className="w-3.5 h-3.5" />
              Contrat généré
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-primary-green shrink-0" />
    </motion.button>
  );
}
