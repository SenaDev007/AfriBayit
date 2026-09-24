'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useEscrowList } from '@/hooks/useEscrow';
import { useAuthStore } from '@/stores/authStore';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, ArrowRight } from 'lucide-react';

const EscrowDashboard = dynamic(() => import('@/components/afribayit/EscrowDashboard'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full" />
    </div>
  ),
});

const EscrowFlow = dynamic(() => import('@/components/afribayit/EscrowFlow'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full" />
    </div>
  ),
});

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function EscrowPage() {
  const { onNavigate } = useAfriBayitNav();
  const searchParams = useSearchParams();
  const urlTransactionId = searchParams.get('transactionId');
  const { user } = useAuthStore();
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(urlTransactionId);

  const { data: escrowData, isLoading } = useEscrowList(1, 20);
  const escrowAccounts: any[] = (escrowData?.escrowAccounts as unknown[]) || [];

  // If URL has transactionId, show the dashboard for that transaction
  const activeTransactionId = selectedTransactionId || urlTransactionId || (escrowAccounts.length > 0 ? escrowAccounts[0]?.transaction?.id || escrowAccounts[0]?.id : null);

  // Show EscrowDashboard (with 2FA + conditions checklist) when a transaction is selected
  if (activeTransactionId) {
    return (
      <TransactionPageShell
        activeTab="acheter"
        hero={{
          badge: 'Escrow Sécurisé',
          title: 'Transactions immobilières 100% sécurisées',
          subtitle: 'Fonds protégés sur compte séquestre jusqu\'à signature notariale. Zéro risque de fraude, libération conditionnelle, traçabilité complète.',
          backgroundImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&h=900&fit=crop',
          stats: [
            { value: 0, suffix: '+', label: 'Transactions' },
            { value: 0, suffix: '%', label: 'Sécurité' },
            { value: 0, suffix: '', label: 'Pays couverts' },
            { value: 0, suffix: '+', label: 'Libérations' },
          ],
          ctaLabel: 'Voir mes transactions',
          ctaHref: '#escrow',
        }}
      >
        <div id="escrow" className="py-6">
          {/* Transaction picker */}
          {escrowAccounts.length > 1 && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <h3 className="text-sm font-bold text-primary-deep mb-3">Mes transactions</h3>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {escrowAccounts.map((escrow) => {
                  const txn = escrow.transaction || {};
                  const isActive = (txn.id || escrow.id) === activeTransactionId;
                  return (
                    <button
                      key={escrow.id}
                      onClick={() => setSelectedTransactionId(txn.id || escrow.id)}
                      className={`shrink-0 px-4 py-3 rounded-3xl border-2 transition-all text-left ${
                        isActive ? 'border-primary-deep bg-primary-pale/60 shadow-md' : 'border-primary-pale/60 bg-white hover:border-primary-green/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          escrow.status === 'FUNDED' ? 'bg-green-500' :
                          escrow.status === 'RELEASED' ? 'bg-primary-green' :
                          escrow.status === 'DISPUTED' ? 'bg-red-500' :
                          'bg-gray-300'
                        }`} />
                        <span className="text-xs font-bold text-primary-deep">{txn.property?.title || 'Transaction'}</span>
                      </div>
                      <p className="text-[10px] text-gray-text">
                        {new Intl.NumberFormat('fr-FR').format(txn.amount || 0)} {txn.currency || 'XOF'}
                      </p>
                      <p className="text-[10px] text-gray-text/60">{escrow.status}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EscrowDashboard with 2FA + conditions checklist */}
          <SafeModule>
            <EscrowDashboard
              transactionId={activeTransactionId}
              userRole="buyer"
              onNavigate={onNavigate}
            />
          </SafeModule>

          {/* Also render EscrowFlow for payment steps (when CREATED) */}
          <div className="mt-6">
            <SafeModule>
              <EscrowFlow onNavigate={onNavigate} />
            </SafeModule>
          </div>
        </div>
      </TransactionPageShell>
    );
  }

  // No transaction — show EscrowFlow (which shows empty state or payment init)
  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Escrow Sécurisé',
        title: 'Transactions immobilières 100% sécurisées',
        subtitle: 'Fonds protégés sur compte séquestre jusqu\'à signature notariale. Zéro risque de fraude, libération conditionnelle, traçabilité complète.',
        backgroundImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Transactions' },
          { value: 0, suffix: '%', label: 'Sécurité' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Libérations' },
        ],
        ctaLabel: 'Voir les transactions',
        ctaHref: '#escrow',
      }}
    >
      <div id="escrow">
        {/* Empty state */}
        {!isLoading && escrowAccounts.length === 0 && (
          <div className="max-w-2xl mx-auto py-16 px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary-pale">
                <Shield className="w-10 h-10 text-primary-deep" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-primary-deep mb-3">
                Aucune transaction en cours
              </h2>
              <p className="text-gray-text mb-8 max-w-md mx-auto">
                Vous n'avez pas encore de transaction escrow. Trouvez un bien immobilier et cliquez sur "Acheter ce bien" pour démarrer une transaction sécurisée.
              </p>
              <a
                href="/acheter"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-[1.03] bg-primary-green hover:bg-primary-deep shadow-lg"
              >
                Parcourir les biens
                <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
              {[
                { icon: CheckCircle, title: '1. Achetez', desc: 'Trouvez un bien et cliquez "Acheter". La transaction est créée.' },
                { icon: Shield, title: '2. Payez en sécurité', desc: 'Vos fonds sont en escrow chez FedaPay (agréé BCEAO). Personne ne peut les toucher.' },
                { icon: Clock, title: '3. Finalisez', desc: 'Notaire signe l\'acte → fonds libérés au vendeur automatiquement.' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                  className="p-6 rounded-3xl bg-primary-pale/30 border border-primary-pale text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-primary-pale">
                    <step.icon className="w-5 h-5 text-primary-deep" />
                  </div>
                  <h3 className="font-bold text-primary-deep mb-1 text-sm">{step.title}</h3>
                  <p className="text-xs text-gray-text">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <SafeModule>
          <EscrowFlow onNavigate={onNavigate} />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
