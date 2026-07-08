'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Target, Eye, Heart, Users, Building2, Globe, Award, TrendingUp } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

const VALUES = [
  { icon: Target, title: 'Mission', text: "Devenir la référence immobilière, hôtelière et artisanale en Afrique de l'Ouest puis sur tout le continent." },
  { icon: Eye, title: 'Vision', text: "Un écosystème digital unifié où chaque Africain peut trouver sa maison, investir, voyager et bâtir en toute confiance." },
  { icon: Heart, title: 'Valeurs', text: "Confiance, transparence, innovation et ancrage local. Nous construisons pour l'Afrique, avec l'Afrique." },
];

const STATS = [
  { icon: Building2, label: 'Biens immobiliers', value: 0, suffix: '+' },
  { icon: Users, label: 'Utilisateurs', value: 0, suffix: '+' },
  { icon: Globe, label: 'Pays couverts', value: 0, suffix: '' },
  { icon: Award, label: 'Professionnels certifiés', value: 0, suffix: '+' },
];

export default function AboutPage() {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => apiFetch<any>('/stats'),
    staleTime: 5 * 60 * 1000,
  });

  const realStats = STATS.map(s => {
    if (s.label.includes('Biens')) return { ...s, value: stats?.properties ?? 0 };
    if (s.label.includes('Utilisateurs')) return { ...s, value: stats?.users ?? 0 };
    if (s.label.includes('Pays')) return { ...s, value: stats?.countries ?? 0 };
    if (s.label.includes('Professionnels')) return { ...s, value: (stats?.agents ?? 0) + (stats?.notaries ?? 0) + (stats?.artisans ?? 0) };
    return s;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&h=900&fit=crop" alt="AfriBayit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,48,135,0.92) 0%, rgba(0,48,135,0.78) 50%, rgba(0,156,222,0.65) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>À propos d'AfriBayit</span>
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              L'Afrique trouve sa maison
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              AfriBayit est la première plateforme immobilière pan-africaine de nouvelle génération. Nous connectons acheteurs, vendeurs, locataires, investisseurs, voyageurs et professionnels du BTP à travers l'Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                className="p-8 rounded-3xl bg-gray-50/50 border border-gray-100"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${NAVY}10` }}>
                  <item.icon className="w-6 h-6" style={{ color: NAVY }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16" style={{ background: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {realStats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: GOLD }} />
                <div className="text-3xl sm:text-4xl font-bold" style={{ color: GOLD, fontFamily: 'var(--font-space-grotesk), monospace' }}>
                  {stat.value}{stat.suffix}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>Notre histoire</h2>
          </motion.div>
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p>
              AfriBayit est né d'un constat simple : l'Afrique de l'Ouest manque d'une plateforme immobilière digne de ce nom. Les transactions se font par téléphone, les biens ne sont pas vérifiés, les documents légaux font défaut, et la confiance est absente. Pendant ce temps, les plateformes internationales ne comprennent pas les réalités locales : Mobile Money, droit foncier coutumier, multilinguisme, certifications artisanales.
            </p>
            <p>
              Nous avons construit AfriBayit pour combler ce vide. Pas un clone de Booking.com ou de Airbnb — une plateforme pensée pour l'Afrique, avec ses spécificités : paiement Mobile Money intégré, escrow sécurisé, géomètres certifiés, notaires partenaires, artisans BTP vérifiés, formations immobilières en français et en langues locales.
            </p>
            <p>
              Aujourd'hui, AfriBayit opère dans 4 pays (Bénin, Côte d'Ivoire, Burkina Faso, Togo) avec des dizaines de biens immobiliers, des hôtels, des guesthouses et des centaines de professionnels certifiés. Demain, nous visons les 25 pays de l'UEMOA et de la CEDEAO.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
