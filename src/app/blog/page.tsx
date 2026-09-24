'use client';

import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, RefreshCw, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/use-translate';
import { BLOG_ARTICLES } from '@/data/blog-articles';

const easeOut = [0.16, 1, 0.3, 1] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero — P6 */}
      <section className="bg-primary-deep text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-accent-yellow text-xs font-bold uppercase tracking-wider mb-4">
            {t('blogPage.badge', 'Blog AfriBayit')}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {t('blogPage.title', 'Actualités & Conseils immobiliers')}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto mt-4 text-base">
            {t(
              'blogPage.subtitle',
              'Investissement, droit foncier, construction, hôtellerie — l\'expertise AfriBayit'
            )}
          </p>
          <p className="text-white/50 max-w-xl mx-auto mt-3 text-xs">
            {t(
              'blogPage.sourcedNote',
              'Chaque article juridique est daté, sourcé (textes officiels) et relu par un professionnel.'
            )}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 sm:py-20 bg-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6">
            {BLOG_ARTICLES.map((article, i) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                whileHover={{ y: -4 }}
                className="card-shimmer bg-white rounded-3xl overflow-hidden shadow-lg border border-primary-pale w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex flex-col"
              >
                <Link href={`/blog/${article.id}`} className="flex flex-col flex-1">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2 py-1 bg-primary-pale/95 backdrop-blur-sm text-primary-deep text-[10px] font-bold rounded-full border border-primary-green/20">
                        {t(`blogPage.${article.categoryKey}`, article.categoryKey)}
                      </span>
                      {article.isLegal && (
                        <span className="px-2 py-1 bg-[#003087]/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" /> {t('blogPage.verifiedLegal', 'Sourcé & relu')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-text/80 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(article.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {article.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {article.readTime} min
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-primary-deep mb-2 leading-tight text-lg">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-text mb-3 line-clamp-2">{article.excerpt}</p>
                    <div className="mt-auto pt-2 flex items-center justify-between border-t border-primary-pale/60">
                      <span className="flex items-center gap-1 text-[10px] text-gray-text/70">
                        <RefreshCw className="w-2.5 h-2.5" />
                        {t('blogPage.updatedOn', 'Mis à jour')} {formatDate(article.updatedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-green">
                        {t('blogPage.readArticle', "Lire l'article")} <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
