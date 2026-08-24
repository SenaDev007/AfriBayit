// AfriBayit — 404 Not Found (P3.3)
// Branded 404 page with link back to home

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] via-[#002452] to-[#001a3d] flex items-center justify-center px-6">
      <div className="text-center max-w-xl">
        {/* Big 404 with gold accent */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-cormorant),Georgia,serif] text-8xl md:text-9xl font-bold text-white leading-none">
            4
            <span className="text-[#FFCC00]">0</span>
            4
          </h1>
          <div className="h-1 w-24 bg-[#FFCC00] mx-auto mt-4 rounded-lg" />
        </div>

        <h2 className="font-[family-name:var(--font-cormorant),Georgia,serif] text-3xl md:text-4xl text-white font-semibold mb-4">
          Cette adresse n'existe pas
        </h2>

        <p className="text-white/70 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          La page que vous recherchez a peut-être été déplacée, supprimée, ou n'a jamais existé.
          Comme une maison sans fondations, elle ne tient plus debout.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-[#FFCC00] hover:bg-[#FFD700] text-[#003366] font-semibold">
              <Home className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Button>
          </Link>
          <Link href="/search">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Search className="mr-2 h-5 w-5" />
              Rechercher un bien
            </Button>
          </Link>
        </div>

        {/* Tagline */}
        <p className="text-white/40 text-sm mt-16 italic font-[family-name:var(--font-cormorant),Georgia,serif]">
          « Où l'Afrique trouve sa maison. »
        </p>
      </div>
    </div>
  );
}
