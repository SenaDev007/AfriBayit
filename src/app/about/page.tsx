'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Target, Eye, Heart, Users, Building2, Globe, Award, TrendingUp } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

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
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&h=900&fit=crop" alt="AfriBayit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,48,135,0.92) 0%, rgba(0,48,135,0.78) 50%, rgba(0,156,222,0.65) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-accent-yellow" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent-yellow">À propos d'AfriBayit</span>
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
              L'Afrique trouve sa maison
            </h1>
            <div className="h-1 w-16 bg-accent-yellow mt-6 rounded-full" />
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              AfriBayit est la première plateforme immobilière pan-africaine de nouvelle génération. Nous connectons acheteurs, vendeurs, locataires, investisseurs, voyageurs et professionnels du BTP à travers l'Afrique de l'Ouest.
            </p>
          </div>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
              Notre ADN
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
              Ce qui nous anime
            </h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                className="p-8 rounded-3xl bg-white border border-primary-pale shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-primary-pale">
                  <item.icon className="w-6 h-6 text-primary-green" />
                </div>
                <h3 className="font-serif text-xl font-bold text-primary-deep mb-3">{item.title}</h3>
                <p className="text-sm text-gray-text leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-accent-yellow" />
                <div className="text-3xl sm:text-4xl font-bold text-accent-yellow font-mono-data">
                  {stat.value}{stat.suffix}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
              Nos débuts
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">Notre histoire</h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
          </motion.div>
          <div className="space-y-6 text-gray-text leading-relaxed">
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
