import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AfriBayit',
    short_name: 'AfriBayit',
    description: 'La Plateforme Immobilière Africaine — Où l\'Afrique trouve sa maison',
    start_url: '/',
    display: 'standalone',
    theme_color: '#003087',
    background_color: '#ffffff',
    lang: 'fr',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['business', 'lifestyle', 'finance'],
    prefer_related_applications: false,
  };
}
