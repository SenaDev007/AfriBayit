'use client';

import { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLease, useGenerateContract, useSignLease, useCreateInventory, useSignInventory, useRecordDamages, useRentPayments, usePayRent } from '@/hooks/useLeases';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import {
  ChevronRight, FileText, Home, KeyRound, Calendar, Coins, User, Phone, MapPin,
  Download, PenLine, CheckCircle2, Clock, AlertTriangle, ClipboardList, Plus, X,
  CreditCard, Smartphone,
} from 'lucide-react';
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

const ROOM_CONDITIONS: Record<string, { label: string; color: string }> = {
  excellent: { label: 'Excellent', color: '#00A651' },
  good: { label: 'Bon', color: '#009CDE' },
  fair: { label: 'Correct', color: '#D4AF37' },
  damaged: { label: 'Endommagé', color: '#ef4444' },
};

export default function LeaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const leaseId = params.id;
  const { user } = useAuthStore();
  const { data, isLoading } = useLease(leaseId);

  const generateContract = useGenerateContract();
  const signLease = useSignLease();
  const createInventory = useCreateInventory();
  const signInventory = useSignInventory();
  const recordDamages = useRecordDamages();
  const payRent = usePayRent();
  // Note: `lease` is derived from `data` below — we use `data?.status` here
  // because the hook must be called unconditionally (React rules of hooks),
  // and `lease` isn't defined yet at this point.
  const { data: rentPaymentsData } = useRentPayments(data?.status === 'ACTIVE' || data?.status === 'PENDING_CHECKOUT' ? leaseId : null);

  const [signaturePad, setSignaturePad] = useState<string | null>(null);
  const [signingTarget, setSigningTarget] = useState<{ type: 'contract' | 'inventory'; inventoryId?: string } | null>(null);
  const [showInventoryForm, setShowInventoryForm] = useState<'in' | 'out' | null>(null);
  const [inventoryItems, setInventoryItems] = useState<Array<{ room: string; condition: string; observations?: string }>>([]);
  const [showDamagesForm, setShowDamagesForm] = useState<string | null>(null);
  const [damages, setDamages] = useState<Array<{ room: string; description: string; estimatedCost: number }>>([]);
  const [payingRentId, setPayingRentId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('orange_money');

  const lease = data;

  const isTenant = useMemo(() => lease?.tenantId === user?.id, [lease, user]);
  const isOwner = useMemo(() => lease?.ownerId === user?.id, [lease, user]);

  const contractDoc = lease?.documents?.find((d: any) => d.documentType === 'lease_contract');
  const inventoryIn = lease?.inventories?.find((inv: any) => inv.type === 'in');
  const inventoryOut = lease?.inventories?.find((inv: any) => inv.type === 'out');

  const handleGenerate = useCallback(async () => {
    if (!leaseId) return;
    try {
      await generateContract.mutateAsync(leaseId);
    } catch (err) {
      console.error('Contract generation error:', err);
      alert('Erreur lors de la génération du contrat.');
    }
  }, [leaseId, generateContract]);

  const handleDownload = useCallback(() => {
    window.open(`/api/leases/${leaseId}/contract-pdf`, '_blank');
  }, [leaseId]);

  const handleSignClick = useCallback((target: { type: 'contract' | 'inventory'; inventoryId?: string }) => {
    setSigningTarget(target);
    setSignaturePad('');
  }, []);

  const handleConfirmSign = useCallback(async () => {
    if (!leaseId || !signingTarget || !signaturePad) return;
    try {
      if (signingTarget.type === 'contract') {
        await signLease.mutateAsync({
          leaseId,
          signatureData: signaturePad,
        });
      } else if (signingTarget.type === 'inventory' && signingTarget.inventoryId) {
        await signInventory.mutateAsync({
          leaseId,
          inventoryId: signingTarget.inventoryId,
          signatureData: signaturePad,
        });
      }
      setSigningTarget(null);
      setSignaturePad(null);
    } catch (err) {
      console.error('Signature error:', err);
      alert('Erreur lors de la signature.');
    }
  }, [leaseId, signingTarget, signaturePad, signLease, signInventory]);

  const handleCreateInventory = useCallback(async (type: 'in' | 'out') => {
    if (!leaseId) return;
    try {
      await createInventory.mutateAsync({
        leaseId,
        type,
        items: inventoryItems,
      });
      setShowInventoryForm(null);
      setInventoryItems([]);
    } catch (err) {
      console.error('Inventory creation error:', err);
      alert('Erreur lors de la création de l\'état des lieux.');
    }
  }, [leaseId, createInventory, inventoryItems]);

  const handleRecordDamages = useCallback(async (inventoryId: string) => {
    if (!leaseId) return;
    try {
      await recordDamages.mutateAsync({
        leaseId,
        inventoryId,
        damages,
      });
      setShowDamagesForm(null);
      setDamages([]);
    } catch (err) {
      console.error('Damages recording error:', err);
      alert('Erreur lors de l\'enregistrement des dégradations.');
    }
  }, [leaseId, recordDamages, damages]);

  const handlePayRent = useCallback(async (paymentId: string) => {
    if (!leaseId) return;
    try {
      const result = await payRent.mutateAsync({
        leaseId,
        paymentId,
        method: selectedPaymentMethod,
      });
      // Redirect to the provider's payment page (FedaPay redirect URL or Stripe)
      const redirectUrl = result?.providerResponse?.redirectUrl || result?.providerResponse?.url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        alert('Paiement initié. Vous serez redirigé vers le provider.');
      }
      setPayingRentId(null);
    } catch (err) {
      console.error('Rent payment error:', err);
      alert('Erreur lors de l\'initiation du paiement. Veuillez réessayer.');
    }
  }, [leaseId, payRent, selectedPaymentMethod]);

  if (isLoading) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-40 mb-6" />
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </section>
    );
  }

  if (!lease) {
    return (
      <section className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-gray-400">Bail non trouvé</h2>
          <p className="text-sm text-gray-400 mt-2">Ce bail n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Link href="/leases" className="mt-4 inline-block text-[#003087] font-semibold text-sm hover:underline">
            ← Retour aux baux
          </Link>
        </div>
      </section>
    );
  }

  const status = STATUS_LABELS[lease.status] || STATUS_LABELS.DRAFT;
  const property = lease.property;
  const images = (() => {
    try {
      const v = typeof property?.images === 'string' ? JSON.parse(property.images) : property?.images;
      return Array.isArray(v) ? v : [];
    } catch { return []; }
  })();
  const firstImage = images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';

  const fmtMoney = (n: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} ${lease.currency}`;

  return (
    <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:text-[#003087]">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/leases" className="hover:text-[#003087]">Mes baux</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#003087] font-semibold truncate">{lease.leaseRef}</span>
        </div>

        {/* Lease header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border overflow-hidden mb-6"
        >
          <div className="grid md:grid-cols-3 gap-0">
            {/* Property image */}
            <div className="relative aspect-[4/3] md:aspect-auto md:h-48 bg-gray-100">
              <ImageWithFallback
                src={firstImage}
                alt={property?.title || 'Bien'}
                fill
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            {/* Title + status */}
            <div className="md:col-span-2 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h1 className="font-display text-xl font-bold text-[#0a2a5e] mb-1">{property?.title}</h1>
                  <p className="text-xs text-gray-400 mb-1">Réf. {lease.leaseRef}</p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap"
                  style={{ backgroundColor: `${status.color}15`, color: status.color }}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {property?.city}, {lease.country}
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5">Loyer mensuel</p>
                  <p className="font-bold text-[#003087]">{fmtMoney(lease.monthlyRent)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Dépôt garantie</p>
                  <p className="font-bold text-[#D4AF37]">{fmtMoney(lease.securityDeposit)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Durée</p>
                  <p className="font-bold text-[#0a2a5e]">{lease.leaseTermMonths} mois</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Parties info */}
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          <PartyCard label="Bailleur" name={lease.owner?.name} email={lease.owner?.email} phone={lease.owner?.phone} avatar={lease.owner?.avatar} isMe={isOwner} />
          <PartyCard label="Locataire" name={lease.tenant?.name} email={lease.tenant?.email} phone={lease.tenant?.phone} avatar={lease.tenant?.avatar} isMe={isTenant} />
        </div>

        {/* Contract section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Contrat de bail OHADA
            </h2>
            {contractDoc && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 bg-[#003087]/5 text-[#003087] rounded-lg text-xs font-semibold hover:bg-[#003087]/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger PDF
              </button>
            )}
          </div>

          {!contractDoc ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-4">
                Aucun contrat généré. Générez le bail OHADA conforme au droit applicable en {lease.country}.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generateContract.isPending}
                className="px-5 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50"
              >
                {generateContract.isPending ? 'Génération...' : 'Générer le contrat'}
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <SignatureStatus label="Bailleur" signed={contractDoc.ownerSigned} signedAt={contractDoc.ownerSignedAt ? new Date(contractDoc.ownerSignedAt) : null} isMe={isOwner} />
                <SignatureStatus label="Locataire" signed={contractDoc.tenantSigned} signedAt={contractDoc.tenantSignedAt ? new Date(contractDoc.tenantSignedAt) : null} isMe={isTenant} />
              </div>
              {(isTenant || isOwner) && lease.status === 'PENDING_SIGNATURE' && (
                <button
                  onClick={() => handleSignClick({ type: 'contract' })}
                  disabled={signLease.isPending}
                  className="w-full py-3 bg-[#00A651] text-white rounded-lg text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <PenLine className="w-4 h-4" />
                  {signLease.isPending ? 'Signature...' : 'Signer le bail électroniquement'}
                </button>
              )}
              {lease.status === 'ACTIVE' && (
                <div className="flex items-center gap-2 p-3 bg-[#00A651]/5 rounded-2xl text-sm text-[#00A651]">
                  <CheckCircle2 className="w-4 h-4" />
                  Bail signé par les deux parties et actif.
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Inventory section */}
        {lease.status !== 'DRAFT' && lease.status !== 'PENDING_SIGNATURE' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border p-6 mb-6"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5" />
              États des lieux
            </h2>

            <div className="space-y-4">
              <InventoryRow
                label="État des lieux d'entrée"
                inventory={inventoryIn}
                canCreate={isTenant || isOwner}
                onCreate={() => { setShowInventoryForm('in'); setInventoryItems([{ room: 'Salon', condition: 'good' }]); }}
                onSign={(invId) => handleSignClick({ type: 'inventory', inventoryId: invId })}
              />
              <InventoryRow
                label="État des lieux de sortie"
                inventory={inventoryOut}
                canCreate={(isTenant || isOwner) && !!inventoryIn}
                onCreate={() => { setShowInventoryForm('out'); setInventoryItems([{ room: 'Salon', condition: 'good' }]); }}
                onSign={(invId) => handleSignClick({ type: 'inventory', inventoryId: invId })}
                onRecordDamages={isOwner ? (invId) => { setShowDamagesForm(invId); setDamages([{ room: '', description: '', estimatedCost: 0 }]); } : undefined}
              />
            </div>
          </motion.div>
        )}

        {/* Rent payments section — monthly rent tracking + payment */}
        {(lease.status === 'ACTIVE' || lease.status === 'PENDING_CHECKOUT') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl border p-6 mb-6"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5" />
              Loyers mensuels
            </h2>
            <RentPaymentsList
              payments={rentPaymentsData?.rentPayments || lease.rentPayments || []}
              isTenant={isTenant}
              payingRentId={payingRentId}
              setPayingRentId={setPayingRentId}
              selectedPaymentMethod={selectedPaymentMethod}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              onPay={handlePayRent}
              isPaying={payRent.isPending}
              currency={lease.currency}
            />
          </motion.div>
        )}

        {/* Lease terms summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border p-6"
        >
          <h2 className="font-display text-lg font-bold text-[#003087] mb-4">Conditions du bail</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Date d'effet" value={new Date(lease.startDate).toLocaleDateString('fr-FR')} />
            <InfoRow label="Date d'échéance" value={new Date(lease.endDate).toLocaleDateString('fr-FR')} />
            <InfoRow label="Meublé" value={lease.furnished ? 'Oui' : 'Non'} />
            <InfoRow label="Charges" value={lease.chargesIncluded ? 'Comprises (CC)' : 'Hors charges (HC)'} />
            <InfoRow label="Préavis" value={`${lease.noticePeriodDays} jours`} />
            <InfoRow label="Pays" value={lease.country} />
          </div>
        </motion.div>
      </div>

      {/* Signature modal */}
      {signingTarget && (
        <SignatureModal
          title={signingTarget.type === 'contract' ? 'Signer le contrat de bail' : 'Signer l\'état des lieux'}
          signaturePad={signaturePad}
          setSignaturePad={setSignaturePad}
          onConfirm={handleConfirmSign}
          onClose={() => { setSigningTarget(null); setSignaturePad(null); }}
          isPending={signLease.isPending || signInventory.isPending}
        />
      )}

      {/* Inventory form modal */}
      {showInventoryForm && (
        <InventoryFormModal
          type={showInventoryForm}
          items={inventoryItems}
          setItems={setInventoryItems}
          onCreate={() => handleCreateInventory(showInventoryForm)}
          onClose={() => { setShowInventoryForm(null); setInventoryItems([]); }}
          isPending={createInventory.isPending}
        />
      )}

      {/* Damages form modal */}
      {showDamagesForm && (
        <DamagesFormModal
          damages={damages}
          setDamages={setDamages}
          onSave={() => handleRecordDamages(showDamagesForm)}
          onClose={() => { setShowDamagesForm(null); setDamages([]); }}
          isPending={recordDamages.isPending}
        />
      )}
    </section>
  );
}

function PartyCard({ label, name, email, phone, avatar, isMe }: { label: string; name?: string; email?: string; phone?: string; avatar?: string; isMe?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border p-4">
      <p className="text-xs text-gray-400 mb-2">{label}{isMe && ' (vous)'}</p>
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4AF37]/30 relative bg-gray-100">
          <ImageWithFallback
            src={avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
            alt={name || label}
            fill
            fallbackType="avatar"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[#0a2a5e] truncate">{name || 'N/A'}</p>
          {email && <p className="text-xs text-gray-400 truncate">{email}</p>}
          {phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{phone}</p>}
        </div>
      </div>
    </div>
  );
}

function SignatureStatus({ label, signed, signedAt, isMe }: { label: string; signed: boolean; signedAt: Date | null; isMe?: boolean }) {
  return (
    <div className={`p-3 rounded-2xl border ${signed ? 'border-[#00A651]/30 bg-[#00A651]/5' : 'border-gray-100'}`}>
      <div className="flex items-center gap-2 mb-1">
        {signed ? (
          <CheckCircle2 className="w-4 h-4 text-[#00A651]" />
        ) : (
          <Clock className="w-4 h-4 text-[#D4AF37]" />
        )}
        <p className={`text-xs font-semibold ${signed ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>
          {label}{isMe ? ' (vous)' : ''}
        </p>
      </div>
      <p className="text-xs text-gray-500">
        {signed ? `Signé le ${signedAt?.toLocaleDateString('fr-FR')}` : 'En attente de signature'}
      </p>
    </div>
  );
}

function InventoryRow({
  label, inventory, canCreate, onCreate, onSign, onRecordDamages,
}: {
  label: string;
  inventory?: any;
  canCreate: boolean;
  onCreate: () => void;
  onSign: (inventoryId: string) => void;
  onRecordDamages?: (inventoryId: string) => void;
}) {
  if (!inventory) {
    return (
      <div className="flex items-center justify-between p-3 border border-dashed border-gray-200 rounded-2xl">
        <div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-400">Non créé</p>
        </div>
        {canCreate && (
          <button onClick={onCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003087]/5 text-[#003087] rounded-lg text-xs font-semibold hover:bg-[#003087]/10 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Créer
          </button>
        )}
      </div>
    );
  }

  const bothSigned = inventory.tenantSigned && inventory.ownerSigned;
  return (
    <div className="p-3 bg-gray-50/50 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-400">
            Conduit le {new Date(inventory.conductedAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bothSigned ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}
        >
          {bothSigned ? 'Signé' : 'En attente'}
        </span>
      </div>
      <div className="flex gap-2">
        {!bothSigned && (
          <button
            onClick={() => onSign(inventory.id)}
            className="flex-1 py-2 bg-[#00A651] text-white rounded-lg text-xs font-semibold hover:bg-[#008f47] transition-colors flex items-center justify-center gap-1.5"
          >
            <PenLine className="w-3.5 h-3.5" />
            Signer
          </button>
        )}
        {onRecordDamages && !bothSigned && (
          <button
            onClick={() => onRecordDamages(inventory.id)}
            className="flex-1 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg text-xs font-semibold hover:bg-[#D4AF37]/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Dégradations
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-[#0a2a5e]">{value}</p>
    </div>
  );
}

function SignatureModal({ title, signaturePad, setSignaturePad, onConfirm, onClose, isPending }: {
  title: string;
  signaturePad: string | null;
  setSignaturePad: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#003087]">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Saisissez votre nom complet comme signature électronique. Cette signature a valeur légale
          conformément à la réglementation OHADA et à la loi nationale applicable.
        </p>
        <input
          type="text"
          value={signaturePad || ''}
          onChange={(e) => setSignaturePad(e.target.value)}
          placeholder="Votre nom complet"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#003087] mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={!signaturePad || isPending}
            className="flex-1 py-2.5 bg-[#00A651] text-white rounded-lg text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Signature...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InventoryFormModal({ type, items, setItems, onCreate, onClose, isPending }: {
  type: 'in' | 'out';
  items: Array<{ room: string; condition: string; observations?: string }>;
  setItems: (v: Array<{ room: string; condition: string; observations?: string }>) => void;
  onCreate: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const addRoom = () => setItems([...items, { room: '', condition: 'good' }]);
  const removeRoom = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateRoom = (i: number, field: 'room' | 'condition' | 'observations', value: string) => {
    const next = [...items];
    next[i] = { ...next[i], [field]: value };
    setItems(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#003087]">
            État des lieux d{type === 'in' ? '\'entrée' : 'e sortie'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Renseignez l&apos;état de chaque pièce du logement. Les deux parties devront signer cet état des lieux.
        </p>
        <div className="space-y-3 mb-4">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-xl">
              <input
                type="text"
                value={item.room}
                onChange={(e) => updateRoom(i, 'room', e.target.value)}
                placeholder="Pièce (Salon, Chambre...)"
                className="col-span-4 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#003087]"
              />
              <select
                value={item.condition}
                onChange={(e) => updateRoom(i, 'condition', e.target.value)}
                className="col-span-3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#003087]"
              >
                {Object.entries(ROOM_CONDITIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={item.observations || ''}
                onChange={(e) => updateRoom(i, 'observations', e.target.value)}
                placeholder="Observations..."
                className="col-span-4 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#003087]"
              />
              <button
                onClick={() => removeRoom(i)}
                className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addRoom} className="flex items-center gap-1.5 px-3 py-1.5 text-[#003087] text-xs font-semibold hover:bg-[#003087]/5 rounded-lg mb-4">
          <Plus className="w-3.5 h-3.5" />
          Ajouter une pièce
        </button>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">
            Annuler
          </button>
          <button
            onClick={onCreate}
            disabled={isPending || items.length === 0}
            className="flex-1 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Création...' : 'Créer l\'état des lieux'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DamagesFormModal({ damages, setDamages, onSave, onClose, isPending }: {
  damages: Array<{ room: string; description: string; estimatedCost: number }>;
  setDamages: (v: Array<{ room: string; description: string; estimatedCost: number }>) => void;
  onSave: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const addDamage = () => setDamages([...damages, { room: '', description: '', estimatedCost: 0 }]);
  const removeDamage = (i: number) => setDamages(damages.filter((_, idx) => idx !== i));
  const updateDamage = (i: number, field: 'room' | 'description' | 'estimatedCost', value: string | number) => {
    const next = [...damages];
    next[i] = { ...next[i], [field]: value };
    setDamages(next);
  };

  const total = damages.reduce((s, d) => s + (Number(d.estimatedCost) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#003087]">Dégradations constatées</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Enregistrez les dégradations constatées lors de l&apos;état des lieux de sortie. Le coût total sera déduit du dépôt de garantie restitué au locataire.
        </p>
        <div className="space-y-3 mb-4">
          {damages.map((d, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-xl">
              <input type="text" value={d.room} onChange={(e) => updateDamage(i, 'room', e.target.value)} placeholder="Pièce" className="col-span-3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#003087]" />
              <input type="text" value={d.description} onChange={(e) => updateDamage(i, 'description', e.target.value)} placeholder="Description de la dégradation" className="col-span-6 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#003087]" />
              <input type="number" value={d.estimatedCost} onChange={(e) => updateDamage(i, 'estimatedCost', Number(e.target.value))} placeholder="Coût (FCFA)" className="col-span-2 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#003087]" />
              <button onClick={() => removeDamage(i)} className="col-span-1 flex items-center justify-center text-gray-400 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={addDamage} className="flex items-center gap-1.5 px-3 py-1.5 text-[#003087] text-xs font-semibold hover:bg-[#003087]/5 rounded-lg mb-4">
          <Plus className="w-3.5 h-3.5" />
          Ajouter une dégradation
        </button>
        <div className="flex items-center justify-between p-3 bg-[#D4AF37]/5 rounded-xl mb-4">
          <span className="text-sm font-semibold text-[#D4AF37]">Total déduit du dépôt</span>
          <span className="font-mono-data font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(total)} FCFA</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold">Annuler</button>
          <button
            onClick={onSave}
            disabled={isPending || damages.length === 0}
            className="flex-1 py-2.5 bg-[#D4AF37] text-white rounded-lg text-sm font-semibold hover:bg-[#b8961f] transition-colors disabled:opacity-50"
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rent Payments List (CDC §7B.5 — recurring monthly rent) ────────────
const RENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'À payer', color: '#D4AF37' },
  PAID: { label: 'Payé', color: '#009CDE' },
  RELEASED: { label: 'Versé au bailleur', color: '#00A651' },
  OVERDUE: { label: 'En retard', color: '#ef4444' },
  FAILED: { label: 'Échec', color: '#ef4444' },
  REFUNDED: { label: 'Remboursé', color: '#6b7280' },
};

const PAYMENT_METHODS = [
  { id: 'orange_money', label: 'Orange Money', color: '#FF7900' },
  { id: 'mtn_momo', label: 'MTN MoMo', color: '#FFCC00' },
  { id: 'moov_money', label: 'Moov Money', color: '#0066B3' },
  { id: 'wave', label: 'Wave', color: '#1DC9FF' },
  { id: 'card', label: 'Carte bancaire', color: '#003087' },
];

function RentPaymentsList({
  payments, isTenant, payingRentId, setPayingRentId,
  selectedPaymentMethod, setSelectedPaymentMethod, onPay, isPaying, currency,
}: {
  payments: any[];
  isTenant: boolean;
  payingRentId: string | null;
  setPayingRentId: (v: string | null) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (v: string) => void;
  onPay: (paymentId: string) => void;
  isPaying: boolean;
  currency: string;
}) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        Aucun loyer généré pour le moment. Les loyers mensuels apparaîtront ici automatiquement.
      </div>
    );
  }

  // Sort by due date descending (most recent first)
  const sorted = [...payments].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  // Stats summary
  const totalPaid = sorted.filter(p => p.status === 'RELEASED' || p.status === 'PAID').reduce((s, p) => s + (p.amountPaid || 0), 0);
  const pendingCount = sorted.filter(p => p.status === 'PENDING' || p.status === 'OVERDUE').length;
  const overdueCount = sorted.filter(p => p.status === 'OVERDUE').length;

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-[#00A651]/5 rounded-2xl">
          <p className="text-xs text-gray-400 mb-0.5">Total versé</p>
          <p className="font-mono-data font-bold text-[#00A651] text-sm">{new Intl.NumberFormat('fr-FR').format(totalPaid)} {currency}</p>
        </div>
        <div className="p-3 bg-[#D4AF37]/5 rounded-2xl">
          <p className="text-xs text-gray-400 mb-0.5">À payer</p>
          <p className="font-mono-data font-bold text-[#D4AF37] text-sm">{pendingCount} mois</p>
        </div>
        <div className={`p-3 rounded-2xl ${overdueCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-400 mb-0.5">En retard</p>
          <p className={`font-mono-data font-bold text-sm ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>{overdueCount} mois</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sorted.map((payment) => {
          const status = RENT_STATUS_LABELS[payment.status] || RENT_STATUS_LABELS.PENDING;
          const dueDate = new Date(payment.dueDate);
          const isPayable = isTenant && (payment.status === 'PENDING' || payment.status === 'OVERDUE');
          const isInitialBadge = payment.isInitial;
          return (
            <div key={payment.id} className={`p-3 rounded-2xl border ${payment.status === 'OVERDUE' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#0a2a5e]">
                      {dueDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </p>
                    {isInitialBadge && (
                      <span className="px-1.5 py-0.5 bg-[#003087]/10 text-[#003087] text-[9px] font-bold rounded-full">1ER MOIS + DÉPÔT</span>
                    )}
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
                      style={{ backgroundColor: `${status.color}15`, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Échéance: {dueDate.toLocaleDateString('fr-FR')}
                    {payment.paidAt && ` · Payé le ${new Date(payment.paidAt).toLocaleDateString('fr-FR')}`}
                    {payment.releasedAt && ` · Versé le ${new Date(payment.releasedAt).toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono-data font-bold text-sm text-[#0a2a5e]">
                    {new Intl.NumberFormat('fr-FR').format(payment.amountDue)} {currency}
                  </p>
                  {isPayable && (
                    <button
                      onClick={() => setPayingRentId(payment.id)}
                      className="mt-1 px-3 py-1 bg-[#00A651] text-white rounded-lg text-xs font-semibold hover:bg-[#008f47] transition-colors flex items-center gap-1.5"
                    >
                      <CreditCard className="w-3 h-3" />
                      Payer
                    </button>
                  )}
                </div>
              </div>

              {/* Payment method selector + confirm (inline) */}
              {payingRentId === payment.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    Choisissez votre méthode de paiement:
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedPaymentMethod(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedPaymentMethod === m.id
                            ? 'border-[#003087] bg-[#003087] text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPayingRentId(null)}
                      className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => onPay(payment.id)}
                      disabled={isPaying}
                      className="flex-1 py-2 bg-[#00A651] text-white rounded-lg text-xs font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isPaying ? 'Redirection...' : `Payer ${new Intl.NumberFormat('fr-FR').format(payment.amountDue)} ${currency}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
