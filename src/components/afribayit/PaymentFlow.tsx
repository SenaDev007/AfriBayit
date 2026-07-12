'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Lock, Smartphone, Waves } from 'lucide-react';

// ============ Payment Method Config ============

interface anyOption {
  key: any;
  name: string;
  icon: React.ReactNode;
  provider: any;
  color: string;
  description: string;
  countries: string[];
}

const PAYMENT_METHODS: anyOption[] = [
  {
    key: 'mobile_money_mtn',
    name: 'MTN Mobile Money',
    icon: <Smartphone className="w-4 h-4" />,
    provider: 'fedapay',
    color: '#FFC300',
    description: 'Paiement via MTN MoMo',
    countries: ['BJ', 'CI', 'BF', 'TG'],
  },
  {
    key: 'mobile_money_moov',
    name: 'Moov Money',
    icon: <Smartphone className="w-4 h-4" />,
    provider: 'fedapay',
    color: '#0066CC',
    description: 'Paiement via Moov Money',
    countries: ['BJ', 'CI', 'BF', 'TG'],
  },
  {
    key: 'mobile_money_orange',
    name: 'Orange Money',
    icon: <Smartphone className="w-4 h-4" />,
    provider: 'fedapay',
    color: '#FF6600',
    description: 'Paiement via Orange Money',
    countries: ['BJ', 'CI', 'BF', 'TG'],
  },
  {
    key: 'mobile_money_wave',
    name: 'Wave',
    icon: <Waves className="w-4 h-4" />,
    provider: 'fedapay',
    color: '#1DC7EA',
    description: 'Paiement via Wave',
    countries: ['CI', 'SN'],
  },
  {
    key: 'card_visa',
    name: 'Visa',
    icon: <CreditCard className="w-4 h-4" />,
    provider: 'stripe',
    color: '#1A1F71',
    description: 'Carte Visa internationale',
    countries: [],
  },
  {
    key: 'card_mastercard',
    name: 'Mastercard',
    icon: <CreditCard className="w-4 h-4" />,
    provider: 'fedapay',
    color: '#EB001B',
    description: 'Carte Mastercard',
    countries: [],
  },
];

type PaymentStep = 'method' | 'details' | 'processing' | 'success' | 'failure';

interface PaymentFlowProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  transactionId: string;
  countryCode: string;
  propertyTitle?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess?: (paymentId: string, providerRef: string) => void;
  onFailure?: (error: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
}

export default function PaymentFlow({
  open,
  onClose,
  amount,
  currency = 'XOF',
  transactionId,
  countryCode,
  propertyTitle,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure,
}: PaymentFlowProps) {
  const [step, setStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    paymentId: string;
    providerRef: string;
    redirectUrl?: string;
    provider: any;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const escrowFee = Math.round(amount * 0.015);
  const totalAmount = amount + escrowFee;

  // Filter available methods by country
  const availableMethods = PAYMENT_METHODS.filter(
    (m) => m.countries.length === 0 || m.countries.includes(countryCode)
  );

  const selectedMethodConfig = PAYMENT_METHODS.find((m) => m.key === selectedMethod);

  const handleSelectMethod = (method: any) => {
    setSelectedMethod(method);
    setStep('details');
  };

  const handleInitiatePayment = async () => {
    if (!selectedMethod) return;

    setStep('processing');
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const result = await apiPost<{
        success: boolean;
        paymentId: string;
        providerRef: string;
        redirectUrl?: string;
        status: string;
        provider: any;
      }>('/api/payments/initiate', {
        amount: totalAmount,
        currency,
        method: selectedMethod,
        reference: transactionId,
        countryCode,
        customerEmail,
        customerPhone,
        description: `Escrow AfriBayit — ${propertyTitle || transactionId}`,
      });

      if (result.success) {
        setPaymentResult({
          paymentId: result.paymentId,
          providerRef: result.providerRef,
          redirectUrl: result.redirectUrl,
          provider: result.provider,
        });

        // If there's a redirect URL (FedaPay checkout), redirect
        if (result.redirectUrl) {
          window.open(result.redirectUrl, '_blank');
        }

        setStep('success');
        toast.success('Paiement initié avec succès');
        onSuccess?.(result.paymentId, result.providerRef);
      } else {
        setStep('failure');
        setErrorMessage('Le paiement n\'a pas pu être initié');
        toast.error('Erreur lors de l\'initiation du paiement');
        onFailure?.('Payment initiation failed');
      }
    } catch (error) {
      setStep('failure');
      const msg = error instanceof Error ? error.message : 'Erreur de connexion';
      setErrorMessage(msg);
      toast.error('Erreur de paiement', { description: msg });
      onFailure?.(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('method');
    setSelectedMethod(null);
    setPaymentResult(null);
    setErrorMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Paiement Escrow AfriBayit</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#003087]/5 text-[#003087] text-xs font-semibold mb-3">
              <Lock className="w-4 h-4" /> Paiement Sécurisé
            </div>
            <h2 className="text-xl font-bold text-[#0a2a5e] mb-1">
              {propertyTitle || 'Transaction Escrow'}
            </h2>
            <p className="text-sm text-gray-500">
              Vos fonds sont protégés jusqu&apos;à la signature notariale
            </p>
          </div>

          {/* Amount Display */}
          <div className="bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-2xl p-4 text-white mb-6 text-center">
            <p className="text-xs text-white/60 mb-1">Montant total</p>
            <p className="font-mono text-3xl font-bold">{formatFCFA(totalAmount)}</p>
            <div className="flex justify-center gap-4 mt-2 text-[10px] text-white/70">
              <span>Montant: {formatFCFA(amount)}</span>
              <span>Frais (1.5%): {formatFCFA(escrowFee)}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Payment Method Selection */}
            {step === 'method' && (
              <motion.div
                key="method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <h3 className="text-sm font-bold text-[#0a2a5e] mb-3">
                  Choisissez votre moyen de paiement
                </h3>
                <div className="space-y-2">
                  {availableMethods.map((method) => (
                    <motion.button
                      key={method.key}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectMethod(method.key)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-[#003087]/20 hover:bg-[#003087]/5 transition-all text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: `${method.color}15` }}
                      >
                        {method.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0a2a5e]">{method.name}</p>
                        <p className="text-[10px] text-gray-400">{method.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-[9px] shrink-0">
                        {method.provider === 'fedapay' ? 'FedaPay' : 'Stripe'}
                      </Badge>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment Details & Confirmation */}
            {step === 'details' && selectedMethodConfig && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: easeOut }}
              >
                <button
                  onClick={() => setStep('method')}
                  className="text-xs text-gray-400 hover:text-[#003087] mb-3 flex items-center gap-1"
                >
                  ← Retour aux méthodes
                </button>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#003087]/5 border border-[#003087]/10 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${selectedMethodConfig.color}15` }}
                  >
                    {selectedMethodConfig.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0a2a5e]">{selectedMethodConfig.name}</p>
                    <p className="text-xs text-gray-400">{selectedMethodConfig.description}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Montant</span>
                    <span className="font-semibold text-[#0a2a5e]">{formatFCFA(amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Frais escrow (1.5%)</span>
                    <span className="font-semibold text-[#0a2a5e]">{formatFCFA(escrowFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-[#00A651] font-semibold">Total à payer</span>
                    <span className="font-mono text-lg font-bold text-[#00A651]">
                      {formatFCFA(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="bg-[#D4AF37]/5 rounded-xl p-3 mb-4 text-xs text-[#D4AF37]">
                  <span className="font-semibold"><Lock className="w-4 h-4" /> Garantie Escrow :</span>{' '}
                  Vos fonds seront bloqués en escrow sécurisé jusqu&apos;à la signature notariale.
                  En cas de litige, vous serez remboursé intégralement.
                </div>

                <Button
                  onClick={handleInitiatePayment}
                  className="w-full py-6 bg-[#003087] hover:bg-[#0047b3] text-white rounded-2xl text-sm font-bold"
                >
                  Confirmer le paiement — {formatFCFA(totalAmount)}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Processing */}
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#003087]/20 border-t-[#003087] animate-spin" />
                <h3 className="text-lg font-bold text-[#0a2a5e] mb-2">Traitement en cours...</h3>
                <p className="text-sm text-gray-500">
                  Votre paiement est en cours de traitement. Ne fermez pas cette fenêtre.
                </p>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && paymentResult && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-20 h-20 rounded-lg bg-[#00A651] flex items-center justify-center mx-auto mb-4"
                >
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-xl font-bold text-[#0a2a5e] mb-2">Paiement Initié !</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {paymentResult.redirectUrl
                    ? 'Vous avez été redirigé vers la page de paiement. Suivez les instructions pour compléter le paiement.'
                    : 'Vos fonds seront placés en escrow sécurisé.'}
                </p>

                <div className="bg-gray-50 rounded-xl p-3 text-left text-xs space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Référence</span>
                    <span className="font-mono text-[#0a2a5e]">{paymentResult.providerRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fournisseur</span>
                    <span className="text-[#0a2a5e] font-semibold">
                      {paymentResult.provider === 'fedapay' ? 'FedaPay' : 'Stripe'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant</span>
                    <span className="font-mono text-[#00A651] font-bold">
                      {formatFCFA(totalAmount)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full py-5 bg-[#003087] hover:bg-[#0047b3] text-white rounded-2xl text-sm font-bold"
                >
                  Voir la transaction
                </Button>
              </motion.div>
            )}

            {/* Step 5: Failure */}
            {step === 'failure' && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 rounded-lg bg-[#D93025]/10 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-10 h-10 text-[#D93025]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0a2a5e] mb-2">Paiement échoué</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {errorMessage || 'Une erreur est survenue lors du traitement du paiement.'}
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1 py-5 rounded-2xl text-sm font-semibold"
                  >
                    Réessayer
                  </Button>
                  <Button
                    onClick={handleClose}
                    className="flex-1 py-5 bg-[#D93025] hover:bg-[#b3261e] text-white rounded-2xl text-sm font-semibold"
                  >
                    Fermer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
