import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  Landmark,
  RefreshCw,
  ShieldCheck,
  ScrollText,
  User,
} from 'lucide-react';
import {
  BLOG_ARTICLES,
  LEGAL_DISCLAIMER,
  SOURCE_KIND_LABELS,
  getArticleById,
  type ArticleSource,
} from '@/data/blog-articles';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ id: String(article.id) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = getArticleById(Number(id));
  if (!article) return { title: 'Article introuvable | AfriBayit' };
  return {
    title: `${article.title} | Blog AfriBayit`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      images: [{ url: article.image }],
      siteName: 'AfriBayit',
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const SOURCE_KIND_ICONS: Record<ArticleSource['kind'], typeof FileText> = {
  loi: ScrollText,
  institution: Landmark,
  norme: FileText,
  etude: BookOpen,
};

const CATEGORY_LABELS: Record<string, string> = {
  categoryInvestment: 'Investissement',
  categoryLegal: 'Droit foncier',
  categoryFinance: 'Financement',
  categoryGeotrust: 'GeoTrust',
  categoryHospitality: 'Hôtellerie',
  categoryConstruction: 'Construction',
};

export default async function BlogArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = getArticleById(Number(id));
  if (!article) notFound();

  const related = BLOG_ARTICLES.filter((a) => a.id !== article.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero image */}
      <section className="relative h-[46vh] min-h-[320px] overflow-hidden bg-primary-deep">
        <img
          src={article.image}
          alt={article.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#003087] via-[#003087]/70 to-[#003087]/20" />
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-accent-yellow text-primary-deep text-[11px] font-bold rounded-full">
              {CATEGORY_LABELS[article.categoryKey] ?? article.categoryKey}
            </span>
            {article.isLegal && (
              <span className="px-3 py-1 bg-white/15 border border-white/25 backdrop-blur-sm text-white text-[11px] font-bold rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" /> Contenu sourcé &amp; relu
              </span>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-white/75">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {article.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Publié le {formatDate(article.date)}
            </span>
            <span className="flex items-center gap-1.5 text-accent-yellow font-semibold">
              <RefreshCw className="w-3.5 h-3.5" /> Mis à jour le {formatDate(article.updatedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> {article.readTime} min de lecture
            </span>
          </div>
        </div>
      </section>

      {/* Corps */}
      <section className="py-12 sm:py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-primary-deep hover:text-primary-green transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Tous les articles
          </Link>

          <div className="bg-white rounded-3xl shadow-lg border border-primary-pale p-6 sm:p-10">
            <p className="text-base sm:text-lg text-gray-text leading-relaxed border-l-4 border-accent-yellow pl-5 mb-10">
              {article.excerpt}
            </p>

            {article.body.map((section, idx) => (
              <div key={idx} className="mb-8 last:mb-0">
                {section.heading && (
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-primary-deep mb-4">
                    {section.heading}
                  </h2>
                )}
                {section.paragraphs.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-sm sm:text-base text-gray-text leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}

            {/* Relecture */}
            {article.reviewer && (
              <div className="mt-10 flex items-start gap-3 p-4 rounded-2xl bg-primary-pale/40 border border-primary-green/20">
                <ShieldCheck className="w-5 h-5 text-primary-green shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-gray-text leading-relaxed">
                  <span className="font-bold text-primary-deep">Relecture juridique :</span>{' '}
                  {article.reviewer}. Le contenu reflète les textes cités ci-dessous à la date de
                  dernière mise à jour.
                </p>
              </div>
            )}

            {/* Avertissement légal */}
            {article.isLegal && (
              <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <FileText className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-amber-900/80 leading-relaxed">{LEGAL_DISCLAIMER}</p>
              </div>
            )}
          </div>

          {/* Sources — exigence P1 : contenus juridiques sourcés */}
          {article.sources.length > 0 && (
            <div className="mt-6 bg-white rounded-3xl shadow-lg border border-primary-pale p-6 sm:p-8">
              <h2 className="font-serif text-lg font-bold text-primary-deep mb-5 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-primary-green" />
                Sources ({article.sources.length})
              </h2>
              <div className="space-y-3">
                {article.sources.map((source) => {
                  const KindIcon = SOURCE_KIND_ICONS[source.kind];
                  return (
                    <div
                      key={source.label}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-primary-pale bg-primary-pale/20"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                        <KindIcon className="w-5 h-5 text-primary-deep" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-bold text-primary-deep">{source.label}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#003087]/10 text-[#003087]">
                            {SOURCE_KIND_LABELS[source.kind]}
                          </span>
                        </div>
                        {source.detail && (
                          <p className="text-xs text-gray-text mt-1 leading-relaxed">{source.detail}</p>
                        )}
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary-green hover:text-primary-deep transition-colors mt-2"
                          >
                            Consulter la source <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Articles liés */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-lg font-bold text-primary-deep mb-5">À lire ensuite</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.id}`}
                    className="group bg-white rounded-3xl overflow-hidden shadow-md border border-primary-pale hover:shadow-lg transition-all"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-gray-text/70 mb-1">{formatDate(rel.date)}</p>
                      <p className="text-sm font-bold text-primary-deep leading-snug line-clamp-2">{rel.title}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-green mt-2">
                        Lire <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
