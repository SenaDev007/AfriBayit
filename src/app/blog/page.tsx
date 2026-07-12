'use client';

import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

const ARTICLES = [
  { id: 1, title: "Investir dans l'immobilier au Bénin : guide complet 2026", excerpt: "Le marché immobilier béninois connaît une croissance de 12% par an. Découvrez les meilleures zones d'investissement...", category: "Investissement", date: "2026-07-01", author: "Ousmane Ouédraogo", image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop" },
  { id: 2, title: "Droit foncier en Côte d'Ivoire : ce qu'il faut savoir", excerpt: "Comprendre les titres fonciers, les certificats de propriété et les attentes villagioises pour sécuriser votre terrain...", category: "Juridique", date: "2026-06-28", author: "Fatou Koné", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=400&fit=crop" },
  { id: 3, title: "Comment financer son achat immobilier au Togo", excerpt: "Crédit bancaire, épargne personnelle, investissement participatif : quelles solutions pour acheter au Togo ?", category: "Finance", date: "2026-06-25", author: "Kofi Mensah", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop" },
  { id: 4, title: "GeoTrust : pourquoi certifier son terrain", excerpt: "Le bornage et la certification foncière protègent votre investissement. Explications et démarche GeoTrust...", category: "GeoTrust", date: "2026-06-20", author: "Hervé Houénou", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=400&fit=crop" },
  { id: 5, title: "Les guesthouses en Afrique de l'Ouest : une opportunité", excerpt: "Entre Airbnb et hôtel, la guesthouse est un segment en pleine croissance. Comment se lancer ?", category: "Hôtellerie", date: "2026-06-15", author: "Mariam Ouedraogo", image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=400&fit=crop" },
  { id: 6, title: "Artisans BTP : trouver les meilleurs au Burkina Faso", excerpt: "Maçons, électriciens, plombiers : comment identifier et engager des artisans certifiés pour vos projets...", category: "Construction", date: "2026-06-10", author: "Issifou Saka", image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop" },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6" style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)' }}>
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>Blog AfriBayit</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>Actualités & Conseils immobiliers</h1>
          <p className="text-white/70">Investissement, droit foncier, construction, hôtellerie — l'expertise AfriBayit</p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6">
            {ARTICLES.map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl overflow-hidden shadow-sm border cursor-pointer w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={article.image} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-[#003087] text-white text-[10px] font-bold rounded-full">{article.category}</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-2">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {article.date}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {article.author}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 leading-tight" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>{article.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{article.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#003087]">
                    Lire l'article <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
