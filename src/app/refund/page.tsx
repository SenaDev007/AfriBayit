'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, XCircle, AlertCircle, RotateCcw } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

const POLICIES = [
  { icon: CheckCircle, color: '#00A651', title: "Transactions immobilières", text: "Remboursement intégral si le bien s'avère non conforme aux documents légaux vérifiés par AfriBayit. Délai : 30 jours après signature." },
  { icon: Clock, color: '#009CDE', title: "Réservations hôtelières", text: "Annulation gratuite jusqu'à 24h avant check-in (politique flexible). Remboursement sous 5-7 jours ouvrés via Mobile Money ou carte." },
  { icon: AlertCircle, color: GOLD, title: "Missions artisans", text: "Si l'artisan ne complète pas la mission, l'escrow est remboursé intégralement au client. Commission AfriBayit non prélevée." },
  { icon: Shield, color: NAVY, title: "Escrow Sécurisé", text: "Tous les fonds en escrow sont protégés. En cas de litage, le Service Arbitrage AfriBayit statue sous 72h avec remboursement si nécessaire." },
];

const STEPS = [
  { step: 1, title: "Soumettre la demande", text: "Contactez le support via le Centre d'aide ou email avec les détails de la transaction." },
  { step: 2, title: "Vérification", text: "Notre équipe vérifie les éléments sous 48h et confirme l'éligibilité au remboursement." },
  { step: 3, title: "Remboursement", text: "Le remboursement est effectué sous 5-7 jours ouvrés via le même canal de paiement." },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative py-20 overflow-hidden" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD }} />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Politique de remboursement</h1>
          <p className="text-white/70 max-w-2xl mx-auto">Votre confiance est notre priorité. AfriBayit garantit des remboursements transparents et rapides pour toutes les transactions sécurisées par escrow.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {POLICIES.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-2xl p-6 shadow-sm border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p.color}15` }}>
                    <p.icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Comment se faire rembourser ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: `${NAVY}10` }}>
                  <span className="text-xl font-bold" style={{ color: NAVY }}>{s.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
