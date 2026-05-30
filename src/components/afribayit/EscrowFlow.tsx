'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useEscrowList } from '@/hooks/useEscrow';

interface EscrowFlowProps {
  onNavigate: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — payment providers
const paymentProviders = [
  { key: 'mtn', name: 'MTN Mobile Money', icon: '📱', color: '#FFC300' },
  { key: 'orange', name: 'Orange Money', icon: '🍊', color: '#FF6600' },
  { key: 'moov', name: 'Moov Money', icon: '🔵', color: '#0066CC' },
  { key: 'carte', name: 'Carte bancaire', icon: '💳', color: '#003087' },
];

// Static config — escrow state machine
const escrowStates = [
  { key: 'CREATED', label: 'Créé', icon: '📋' },
  { key: 'FUNDED', label: 'Financé', icon: '💰' },
  { key: 'IN_PROGRESS', label: 'En cours', icon: '🔄' },
  { key: 'NOTARY_ASSIGNED', label: 'Notaire assigné', icon: '⚖️' },
  { key: 'DEED_SIGNED', label: 'Acte signé', icon: '📝' },
  { key: 'RELEASED', label: 'Libéré', icon: '✅' },
];

export default function EscrowFlow({ onNavigate }: EscrowFlowProps) {
  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, isLoading } = useEscrowList();

  const steps = [
    { title: 'Choisir le moyen de paiement', desc: 'Sélectionnez votre fournisseur de paiement' },
    { title: 'Montant et détails', desc: 'Vérifiez les informations de la transaction' },
    { title: 'Confirmation', desc: 'Confirmez le paiement en escrow' },
  ];

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
            🔒 Escrow Sécurisé
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
            Transaction Escrow
          </h1>
          <p className="text-gray-500 text-sm">Vos fonds sont protégés jusqu&apos;à la signature notariale</p>
        </motion.div>

        {/* Escrow State Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="bg-white rounded-3xl p-6 shadow-sm border mb-6"
        >
          <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Cycle de vie Escrow</h3>
          {isLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="w-20 h-3 bg-gray-100 rounded mt-1 animate-pulse" />
                  </div>
                  {i < 5 && <div className="w-8 h-0.5 mt-5 bg-gray-200 shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-2 overflow-x-auto pb-2">
              {escrowStates.map((state, i) => (
                <div key={state.key} className="flex items-start shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      i <= 2 ? 'bg-[#00A651]/10' : 'bg-gray-100'
                    }`}>
                      {state.icon}
                    </div>
                    <p className={`text-[10px] font-medium mt-1 text-center w-20 ${
                      i <= 2 ? 'text-[#00A651]' : 'text-gray-400'
                    }`}>
                      {state.label}
                    </p>
                  </div>
                  {i < escrowStates.length - 1 && (
                    <div className={`w-8 h-0.5 mt-5 shrink-0 ${i < 2 ? 'bg-[#00A651]' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payment Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          className="bg-white rounded-3xl p-6 shadow-sm border"
        >
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  i <= step ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-[#003087]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-1">{steps[step].title}</h2>
          <p className="text-sm text-gray-500 mb-6">{steps[step].desc}</p>

          {/* Step 1: Payment Provider */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {paymentProviders.map((provider) => (
                <motion.button
                  key={provider.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProvider(provider.key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedProvider === provider.key
                      ? 'border-[#003087] bg-[#003087]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl block mb-2">{provider.icon}</span>
                  <p className="text-sm font-semibold text-[#2C2E2F]">{provider.name}</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* Step 2: Amount & Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Bien</p>
                <p className="text-sm font-semibold text-[#2C2E2F]">Villa Prestige Les Cocotiers</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Montant</p>
                <p className="font-mono-data text-2xl font-bold text-[#D4AF37]">85 000 000 FCFA</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Frais escrow (1.5%)</p>
                <p className="font-mono-data text-sm font-bold text-[#2C2E2F]">1 275 000 FCFA</p>
              </div>
              <div className="p-4 bg-[#00A651]/5 rounded-2xl">
                <p className="text-xs text-[#00A651] mb-1">Total à payer</p>
                <p className="font-mono-data text-2xl font-bold text-[#00A651]">86 275 000 FCFA</p>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">Confirmer le paiement</h3>
              <p className="text-sm text-gray-500 mb-6">
                En confirmant, vous acceptez de placer les fonds en escrow jusqu&apos;à la signature notariale.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else handleConfirm();
              }}
              disabled={step === 0 && !selectedProvider}
              className="flex-1 py-3 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === steps.length - 1 ? 'Confirmer le paiement' : 'Continuer'}
            </motion.button>
          </div>
        </motion.div>

        {/* Success Overlay */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-[#00A651] flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Paiement Confirmé !</h3>
              <p className="text-sm text-gray-500 mb-4">
                Vos fonds sont maintenant en escrow sécurisé. Vous serez notifié à chaque étape.
              </p>
              <button
                onClick={() => { setShowSuccess(false); onNavigate('dashboard'); }}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold"
              >
                Voir la transaction
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
