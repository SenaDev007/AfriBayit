import type { MetadataRoute } from 'next';

// Module 4 — PWA manifest.
// Served at `/manifest.webmanifest` (configured via `metadata.manifest` in
// `src/app/layout.tsx`). Uses the official AfriBayit favicon pack uploaded in
// `/public/AfriBayit_favicon/` (RealFaviconGenerator).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfriBayit — La Plateforme Immobilière Africaine',
    short_name: 'AfriBayit',
    description:
      "Où l'Afrique trouve sa maison. Où les rêves deviennent adresses. Plateforme immobilière pan-africaine de nouvelle génération.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#003366',
    orientation: 'portrait-primary',
    categories: ['business', 'finance', 'lifestyle', 'shopping'],
    lang: 'fr',
    dir: 'ltr',
    icons: [
      // PNG icons (required for iOS / Apple Touch Icon + Android install)
      {
        src: '/AfriBayit_favicon/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/AfriBayit_favicon/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/AfriBayit_favicon/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/AfriBayit_favicon/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      // SVG (sharper on high-DPI displays)
      {
        src: '/AfriBayit_favicon/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Acheter',
        short_name: 'Acheter',
        description: 'Parcourir les biens à vendre',
        url: '/acheter?shortcut=buy',
        icons: [{ src: '/AfriBayit_favicon/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Louer',
        short_name: 'Louer',
        description: 'Parcourir les biens à louer',
        url: '/louer?shortcut=rent',
        icons: [{ src: '/AfriBayit_favicon/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Investir',
        short_name: 'Investir',
        description: 'Opportunités d’investissement',
        url: '/investir?shortcut=invest',
        icons: [{ src: '/AfriBayit_favicon/favicon.svg', sizes: 'any' }],
      },
      {
        name: 'Publier une annonce',
        short_name: 'Publier',
        description: 'Mettre en vente ou en location un bien',
        url: '/publish?shortcut=publish',
        icons: [{ src: '/AfriBayit_favicon/favicon.svg', sizes: 'any' }],
      },
    ],
  };
}
