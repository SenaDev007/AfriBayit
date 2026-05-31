'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#003087]">
      <div className="text-center text-white px-4">
        <img
          src="/logo.png"
          alt="AfriBayit"
          className="h-16 mx-auto mb-6 brightness-0 invert"
        />
        <h1 className="text-2xl font-bold mb-2">Vous êtes hors ligne</h1>
        <p className="text-white/70 mb-6">
          Vérifiez votre connexion internet et réessayez.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white text-[#003087] rounded-full font-semibold hover:bg-white/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
