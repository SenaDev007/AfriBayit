'use client';

import { motion } from 'framer-motion';
import { Search, LifeBuoy, Mail, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

const FAQ = [
  { q: "Comment acheter un bien sur AfriBayit ?", a: "Rendez-vous sur la page Acheter, filtrez par pays/ville/type, cliquez sur un bien pour voir les détails, puis contactez l'agent. La transaction est sécurisée par escrow." },
  { q: "Comment louer un bien ?", a: "Allez sur la page Louer, sélectionnez vos critères, contactez l'agent pour une visite, puis signez le bail numérique avec dépôt de garantie protégé." },
  { q: "Le paiement Mobile Money est-il disponible ?", a: "Oui, AfriBayit supporte MTN MoMo, Orange Money, Moov Money et Airtel Money dans les 4 pays couverts." },
  { q: "Comment réserver un hôtel ou guesthouse ?", a: "Sur la page Séjours, recherchez par destination et dates, réservez instantanément avec paiement Mobile Money ou carte bancaire." },
  { q: "Qu'est-ce que GeoTrust ?", a: "GeoTrust est notre service de certification foncière. Des géomètres certifiés vérifient et bornent votre terrain avec un certificat de conformité." },
  { q: "Comment devenir artisan partenaire ?", a: "Inscrivez-vous sur la page Artisans, complétez votre profil avec KYB, et après validation, vous recevrez le badge Artisan Certifié AfriBayit." },
  { q: "Les transactions sont-elles sécurisées ?", a: "Oui, toutes les transactions passent par un compte escrow. Les fonds ne sont libérés qu'après validation des deux parties et signature notariale." },
  { q: "Comment contacter le support ?", a: "Par email à contact@afribayit.com, par téléphone au +229 97 00 00 00, ou via le chat Rebecca IA en bas à droite de chaque page." },
];

const CATEGORIES = [
  { title: "Immobilier", items: ["Acheter", "Louer", "Investir", "Publier une annonce"] },
  { title: "Hôtellerie", items: ["Séjours", "Hôtels", "Guesthouses", "Réservation"] },
  { title: "Services", items: ["Artisans BTP", "Notaires", "GeoTrust", "Académie"] },
  { title: "Compte", items: ["Inscription", "Connexion", "Mot de passe oublié", "Profil"] },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filtered = FAQ.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Centre d'aide</h1>
          <p className="text-white/70 mb-8">Comment pouvons-nous vous aider ?</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Recherchez une question..."
              className="w-full pl-12 pr-4 py-4 rounded-full text-sm bg-white text-gray-900 outline-none shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                className="bg-white rounded-2xl p-6 shadow-sm border"
              >
                <h3 className="font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{cat.title}</h3>
                <ul className="space-y-2">
                  {cat.items.map((item, j) => (
                    <li key={j} className="text-sm text-gray-500 hover:text-[#003087] cursor-pointer transition-colors">{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Questions fréquentes</h2>
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-4 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-400">Aucune question trouvée pour "{searchQuery}"</div>
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Besoin d'aide supplémentaire ?</h2>
          <p className="text-white/70 mb-8">Notre équipe support est disponible 7j/7</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:contact@afribayit.com" className="flex items-center gap-2 px-6 py-3 bg-white text-[#003087] rounded-full text-sm font-bold hover:scale-105 transition-transform">
              <Mail className="w-4 h-4" /> Email
            </a>
            <a href="tel:+22997000000" className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-white rounded-full text-sm font-bold hover:scale-105 transition-transform">
              <Phone className="w-4 h-4" /> Téléphone
            </a>
            <a href="#" className="flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-full text-sm font-bold hover:bg-white/10 transition-colors">
              <MessageCircle className="w-4 h-4" /> Chat Rebecca IA
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
