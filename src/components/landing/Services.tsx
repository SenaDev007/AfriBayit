'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, Info, ArrowRight } from 'lucide-react';

/**
 * Section Services — portage fidèle du design Win-Agro Services.tsx :
 * 3 cartes « hook / problème / programme / disponibilité / CTA »,
 * carte centrale premium (fond navy + bordure or + badge couronne +
 * CTA or pulsé), reveal en cascade, lift + shimmer au survol.
 * Contenu AfriBayit : Acheter & Investir (premium), Louer, Séjours.
 */

interface ServiceItem {
  key: string;
  title: string;
  hook: string;
  problem: string;
  bullets: string[];
  availability: string;
  cta: string;
  href: string;
  isPremium: boolean;
}

const servicesList: ServiceItem[] = [
  {
    key: 'louer',
    title: 'Louer un bien',
    hook: 'La plupart des plateformes te laissent seul face au propriétaire. Nous sécurisons chaque bail.',
    problem:
      "Tu trouves des annonces partout, mais dépôt de garantie disparu, baux non conformes et litiges sans recours restent monnaie courante. Ici, chaque location est encadrée et chaque litige peut être médié.",
    bullets: [
      'Baux digitalisés et conformes au droit local de chaque pays',
      'Dépôts de garantie protégés sous séquestre AfriBayit',
      'Vérification KYC des propriétaires avant publication',
      'Maintenance et diagnostics via artisans ProMatch certifiés',
    ],
    availability: 'Disponible au Bénin, en Côte d\u2019Ivoire, au Burkina Faso et au Togo',
    cta: 'Trouver une location →',
    href: '/louer',
    isPremium: false,
  },
  {
    key: 'acheter',
    title: 'Acheter & Investir',
    hook: 'Tu arrives avec un rêve d\u2019adresse. Tu repars avec un titre de propriété incontestable.',
    problem:
      "Acheter un terrain ou une villa en Afrique sans vérification, c\u2019est jouer ta vieillesse aux dés. Fraudes documentaires, terrains déjà vendus, notaires douteux — AfriBayit verrouille chaque étape pour que ton investissement reste ton patrimoine.",
    bullets: [
      'Fonds bloqués en séquestre (escrow) jusqu\u2019à la signature de l\u2019acte',
      'Notaires accrédités et vérification GeoTrust des titres fonciers',
      'Escorte juridique complète : du compromis à l\u2019enregistrement',
      'Analyse de rendement et simulations d\u2019investissement sur mesure',
    ],
    availability: 'Accompagnement clé en main de A à Z par nos experts agréés',
    cta: 'Voir les biens à vendre →',
    href: '/acheter',
    isPremium: true,
  },
  {
    key: 'sejours',
    title: 'Séjours & Hôtellerie',
    hook: 'Ta villa idéale existe aussi pour un week-end — vérifiée, réservable, annulable.',
    problem:
      "Trop de voyageurs se retrouvent dans des adresses qui n\u2019existent pas sur les photos. Hôtels, guesthouses et locations courte durée AfriBayit sont inspectés, notés par la communauté et bookables en quelques clics.",
    bullets: [
      'Hôtels, guesthouses et maisons d\u2019hôtes inspectés et certifiés',
      'Réservation instantanée avec annulation transparente',
      'Avis authentifiés de voyageurs réels (KYC obligatoire)',
      'Check-in QR et conciergerie Rebecca IA 24h/24',
    ],
    availability: 'Réponse instantanée · Prix affichés en FCFA · Sans frais cachés',
    cta: 'Réserver un séjour →',
    href: '/sejours',
    isPremium: false,
  },
];

export default function Services() {
  const router = useRouter();

  return (
    <section id="services" className="py-24 bg-cream relative overflow-hidden">
      {/* Motifs graphiques d'arrière-plan */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-pale/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[300px] h-[300px] bg-accent-pale/30 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3"
          >
            Nos Services
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-deep leading-tight"
          >
            Ce que nous faisons pour toi
          </motion.h2>

          <motion.div
            animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
            className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full"
          />
        </div>

        {/* Cartes de services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {servicesList.map((service, index) => {
            if (service.isPremium) {
              return (
                <motion.div
                  key={service.key}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                  whileHover={{
                    y: -10,
                    scale: 1.03,
                    borderColor: 'rgba(212, 175, 55, 0.4)',
                    boxShadow: '0 20px 25px -5px rgba(212, 175, 55, 0.15), 0 8px 10px -6px rgba(212, 175, 55, 0.15)',
                  }}
                  className="relative rounded-3xl bg-primary-deep text-white border-2 border-accent-yellow shadow-2xl p-8 flex flex-col justify-between transition-all duration-300 card-shimmer"
                >
                  {/* Badge premium */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full bg-accent-yellow text-primary-deep font-sans font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 shrink-0" /> Plus Haute Valeur
                  </div>

                  <div>
                    {/* En-tête */}
                    <div className="mb-6">
                      <h3 className="font-serif text-2xl font-black text-white">{service.title}</h3>
                      <p className="font-sans font-bold text-accent-yellow text-sm mt-3 leading-relaxed italic">
                        &quot;{service.hook}&quot;
                      </p>
                    </div>

                    <div className="w-full h-px bg-white/10 my-4" />

                    {/* Contenu */}
                    <p className="font-sans text-sm text-gray-200 leading-relaxed mb-6">{service.problem}</p>

                    <h4 className="font-sans font-bold text-sm text-accent-yellow uppercase tracking-wider mb-3">
                      Ce que nous prenons en charge :
                    </h4>

                    <ul className="space-y-3 mb-8">
                      {service.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-200 font-sans">
                          <span className="text-accent-yellow mt-0.5">✓</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pied de carte */}
                  <div className="mt-auto">
                    <p className="text-xs text-primary-pale font-sans font-medium mb-4 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-center flex items-center justify-center gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 text-accent-yellow" /> {service.availability}
                    </p>
                    <motion.button
                      onClick={() => router.push(service.href)}
                      whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{ scale: { repeat: Infinity, duration: 2.0, ease: 'easeInOut' } }}
                      className="w-full py-4 rounded-full bg-accent-yellow hover:bg-white text-primary-deep font-sans font-black text-base shadow-xl cursor-pointer btn-shimmer"
                    >
                      {service.cta}
                    </motion.button>
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={service.key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                whileHover={{
                  y: -10,
                  scale: 1.03,
                  borderColor: 'rgba(0, 156, 222, 0.4)',
                  boxShadow: '0 20px 25px -5px rgba(0, 48, 135, 0.1), 0 8px 10px -6px rgba(0, 48, 135, 0.1)',
                }}
                className="rounded-3xl bg-white border border-primary-pale shadow-lg p-8 flex flex-col justify-between transition-all duration-300 card-shimmer"
              >
                <div>
                  {/* En-tête */}
                  <div className="mb-6">
                    <h3 className="font-serif text-2xl font-bold text-primary-deep">{service.title}</h3>
                    <p className="font-sans font-semibold text-primary-green text-sm mt-3 leading-relaxed italic">
                      &quot;{service.hook}&quot;
                    </p>
                  </div>

                  <div className="w-full h-px bg-primary-pale my-4" />

                  {/* Contenu */}
                  <p className="font-sans text-sm text-gray-text leading-relaxed mb-6">{service.problem}</p>

                  <h4 className="font-sans font-bold text-sm text-primary-deep uppercase tracking-wider mb-3">
                    Notre programme comprend :
                  </h4>

                  <ul className="space-y-3 mb-8">
                    {service.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-text font-sans">
                        <span className="text-primary-green mt-0.5">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pied de carte */}
                <div className="mt-auto">
                  <p className="text-xs text-primary-green font-sans font-medium mb-4 py-2 px-3 rounded-lg bg-primary-pale border border-primary-pale/50 text-center flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 text-primary-deep" /> {service.availability}
                  </p>
                  <motion.button
                    onClick={() => router.push(service.href)}
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 20px rgba(0, 156, 222, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md cursor-pointer btn-shimmer"
                  >
                    {service.cta}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Lien secondaire « tout voir » */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <button
            onClick={() => router.push('/search')}
            className="inline-flex items-center gap-2 text-sm font-sans font-bold text-primary-deep hover:text-primary-green transition-colors cursor-pointer group"
          >
            Explorer tout le catalogue immobilier
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
