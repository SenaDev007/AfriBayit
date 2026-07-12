'use client';

import { motion } from 'framer-motion';
import { Handshake, TrendingUp, Users, Building, Hotel, Wrench, Mail, Phone, ArrowRight } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

const PARTNER_TYPES = [
  { icon: Building, title: "Agences immobilières", desc: "Diffusez vos annonces sur AfriBayit et touchez des milliers d'acheteurs certifiés.", benefits: ["Visibilité multi-pays", "Escrow sécurisé", "Analytics avancés", "Support dédié"] },
  { icon: Hotel, title: "Hôtels & Guesthouses", desc: "Rejoignez le réseau AfriBayit Hospitality avec PMS intégré et distribution OTA.", benefits: ["PMS gratuit Phase 1", "Channel Manager", "Mobile Money", "Commission directe"] },
  { icon: Wrench, title: "Artisans BTP", desc: "Inscrivez-vous comme artisan certifié et recevez des missions près de chez vous.", benefits: ["Badge certifié", "Missions automatiques", "Paiement escrow", "Portfolio en ligne"] },
  { icon: Users, title: "Notaires & Géomètres", desc: "Devenez partenaire officiel AfriBayit pour les transactions et certifications.", benefits: ["Clients qualifiés", "Outils numériques", "Signature électronique", "Réputation en ligne"] },
];

export default function PartnershipPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative py-20 overflow-hidden" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Handshake className="w-12 h-12 mx-auto mb-4" style={{ color: GOLD }} />
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Devenir partenaire</h1>
          <p className="text-white/70 max-w-2xl mx-auto">Rejoignez l'écosystème AfriBayit et développez votre activité en Afrique de l'Ouest. Plus de 18 000 utilisateurs vous attendent.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PARTNER_TYPES.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-xl p-8 shadow-sm border"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${NAVY}10` }}>
                    <p.icon className="w-6 h-6" style={{ color: NAVY }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{p.title}</h3>
                    <p className="text-sm text-gray-500">{p.desc}</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.benefits.map((b, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-[#00A651] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href="mailto:contact@afribayit.com?subject=Partenariat" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105" style={{ background: NAVY }}>
                  Nous contacter <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Une question sur le partenariat ?</h2>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <a href="mailto:contact@afribayit.com" className="flex items-center gap-2 px-6 py-3 bg-white text-[#003087] rounded-lg text-sm font-bold hover:scale-105 transition-transform">
              <Mail className="w-4 h-4" /> Email
            </a>
            <a href="tel:+22997000000" className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white rounded-lg text-sm font-bold hover:scale-105 transition-transform">
              <Phone className="w-4 h-4" /> Appeler
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
