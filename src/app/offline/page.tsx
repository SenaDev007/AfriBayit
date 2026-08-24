import { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hors ligne — AfriBayit',
  description: 'Vous êtes hors ligne.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#003366] text-white px-6 text-center">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#FFCC00]/15 flex items-center justify-center mb-6 ring-4 ring-[#FFCC00]/10">
          <WifiOff className="w-8 h-8 text-[#FFCC00]" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-display font-semibold mb-3" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
          Vous êtes hors ligne
        </h1>
        <p className="text-white/70 text-sm leading-relaxed mb-8">
          AfriBayit continue de fonctionner en mode dégradé. Les pages déjà consultées restent accessibles.
        </p>
        <Link href="/" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-[#FFCC00] text-[#001A3D] font-semibold hover:bg-[#FFE680] transition-colors">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
