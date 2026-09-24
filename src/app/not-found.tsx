// AfriBayit — 404 Not Found (P3.3)
// Branded 404 page with link back to home

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-primary-deep flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent-yellow/10 rounded-full blur-[100px]" />
      <div className="relative z-10 text-center max-w-xl">
        {/* Big 404 with gold accent */}
        <div className="mb-8">
          <h1 className="font-serif text-8xl md:text-9xl font-bold text-white leading-none">
            4
            <span className="text-accent-yellow">0</span>
            4
          </h1>
          <div className="h-1 w-24 bg-accent-yellow mx-auto mt-4 rounded-full" />
        </div>

        <h2 className="font-serif text-3xl md:text-4xl text-white font-semibold mb-4">
          Cette adresse n'existe pas
        </h2>

        <p className="text-white/70 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          La page que vous recherchez a peut-être été déplacée, supprimée, ou n'a jamais existé.
          Comme une maison sans fondations, elle ne tient plus debout.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-accent-yellow hover:bg-accent-yellow/90 text-primary-deep font-bold rounded-full shadow-md hover:shadow-lg transition-all">
              <Home className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Button>
          </Link>
          <Link href="/search">
            <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/10 rounded-full">
              <Search className="mr-2 h-5 w-5" />
              Rechercher un bien
            </Button>
          </Link>
        </div>

        {/* Tagline */}
        <p className="text-white/40 text-sm mt-16 italic font-serif">
          « Où l'Afrique trouve sa maison. »
        </p>
      </div>
    </div>
  );
}
