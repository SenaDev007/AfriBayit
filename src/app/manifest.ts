import type { MetadataRoute } from 'next';

// Module 4 — PWA manifest.
// Served at `/manifest.webmanifest` (configured via `metadata.manifest` in
// `src/app/layout.tsx`). Uses the existing SVG icons in /public/icons/.
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
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Acheter',
        short_name: 'Acheter',
        description: 'Parcourir les biens à vendre',
        url: '/acheter?shortcut=buy',
        icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }],
      },
      {
        name: 'Louer',
        short_name: 'Louer',
        description: 'Parcourir les biens à louer',
        url: '/louer?shortcut=rent',
        icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }],
      },
      {
        name: 'Investir',
        short_name: 'Investir',
        description: 'Opportunités d’investissement',
        url: '/investir?shortcut=invest',
        icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }],
      },
      {
        name: 'Publier une annonce',
        short_name: 'Publier',
        description: 'Mettre en vente ou en location un bien',
        url: '/publish?shortcut=publish',
        icons: [{ src: '/icons/icon-192x192.svg', sizes: '192x192' }],
      },
    ],
  };
}
