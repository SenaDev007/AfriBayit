'use client';

import { motion } from 'framer-motion';
import { Search, Mail, Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface FaqItem {
  qKey: 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8';
  aKey: 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8';
}

const FAQ: FaqItem[] = [
  { qKey: 'q1', aKey: 'a1' },
  { qKey: 'q2', aKey: 'a2' },
  { qKey: 'q3', aKey: 'a3' },
  { qKey: 'q4', aKey: 'a4' },
  { qKey: 'q5', aKey: 'a5' },
  { qKey: 'q6', aKey: 'a6' },
  { qKey: 'q7', aKey: 'a7' },
  { qKey: 'q8', aKey: 'a8' },
];

export default function HelpPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqWithText = FAQ.map((f) => ({
    q: t(`helpPage.faq.${f.qKey}`, f.qKey),
    a: t(`helpPage.faq.${f.aKey}`, f.aKey),
  }));

  const filtered = faqWithText.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories: Array<{ titleKey: string; items: string[] }> = [
    {
      titleKey: 'catRealEstate',
      items: t('helpPage.catRealEstateItems', 'Acheter, Louer, Investir, Publier une annonce').split(', '),
    },
    {
      titleKey: 'catHospitality',
      items: t('helpPage.catHospitalityItems', 'Séjours, Hôtels, Guesthouses, Réservation').split(', '),
    },
    {
      titleKey: 'catServices',
      items: t('helpPage.catServicesItems', 'Artisans BTP, Notaires, GeoTrust, Académie').split(', '),
    },
    {
      titleKey: 'catAccount',
      items: t('helpPage.catAccountItems', 'Inscription, Connexion, Mot de passe oublié, Profil').split(', '),
    },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero — P6 */}
      <section className="bg-primary-deep text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-accent-yellow text-xs font-bold uppercase tracking-wider mb-4">
            Support
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {t('helpPage.title', "Centre d'aide")}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto mt-4 text-base">
            {t('helpPage.subtitle', 'Comment pouvons-nous vous aider ?')}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('helpPage.searchPlaceholder', 'Recherchez une question...')}
              className="w-full pl-12 pr-4 py-4 rounded-full text-sm bg-white text-gray-text outline-none shadow-lg border border-primary-pale focus:ring-2 focus:ring-primary-green/40 focus:border-primary-green transition-all"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale"
              >
                <h3 className="font-serif font-bold text-primary-deep mb-3">
                  {t(`helpPage.${cat.titleKey}`, cat.titleKey)}
                </h3>
                <ul className="space-y-2">
                  {cat.items.map((item, j) => (
                    <li
                      key={j}
                      className="text-sm text-gray-text hover:text-primary-green cursor-pointer transition-colors"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
              FAQ
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
              {t('helpPage.faqTitle', 'Questions fréquentes')}
            </h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
          </div>
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-primary-pale overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-primary-pale/30 transition-colors"
                >
                  <span className="font-semibold text-primary-deep text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-primary-green shrink-0 ml-4 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-sm text-gray-text leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-gray-text/60">
                {t('helpPage.noResults', 'Aucune question trouvée pour')} "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 sm:py-20 bg-primary-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {t('helpPage.contactTitle', "Besoin d'aide supplémentaire ?")}
          </h2>
          <p className="text-white/70 mb-2">
            {t('helpPage.contactDesc', 'Notre équipe support est disponible 7j/7')}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 mb-8 rounded-full" />
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:contact@afribayit.com"
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-deep rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Mail className="w-4 h-4" /> {t('helpPage.emailButton', 'Email')}
            </a>
            <a
              href="tel:+22997000000"
              className="flex items-center gap-2 px-6 py-3 bg-accent-yellow text-primary-deep rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Phone className="w-4 h-4" /> {t('helpPage.phoneButton', 'Téléphone')}
            </a>
            <a
              href="#"
              className="flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white rounded-full text-sm font-bold hover:bg-white/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> {t('helpPage.chatButton', 'Chat Rebecca IA')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
