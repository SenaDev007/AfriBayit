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
    <main className="min-h-screen flex flex-col items-center justify-center bg-primary-deep text-white px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
      <div className="relative z-10 max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-accent-yellow/15 flex items-center justify-center mb-6 ring-4 ring-accent-yellow/10">
          <WifiOff className="w-8 h-8 text-accent-yellow" aria-hidden="true" />
        </div>
        <h1 className="font-serif text-3xl font-semibold mb-3">
          Vous êtes hors ligne
        </h1>
        <div className="h-1 w-16 bg-accent-yellow mx-auto mt-4 mb-6 rounded-full" />
        <p className="text-white/70 text-sm leading-relaxed mb-8">
          AfriBayit continue de fonctionner en mode dégradé. Les pages déjà consultées restent accessibles.
        </p>
        <Link href="/" className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-accent-yellow text-primary-deep font-bold shadow-md hover:shadow-lg hover:brightness-95 transition-all">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
