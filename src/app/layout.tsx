import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Toaster } from 'react-hot-toast'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AfriBayit - Plateforme Immobilière Révolutionnaire',
  description: 'Découvrez la plateforme immobilière la plus avancée d\'Afrique. Recherche intelligente, visites virtuelles, et écosystème complet pour tous vos besoins immobiliers.',
  keywords: 'immobilier, Afrique, propriétés, location, vente, investissement, visites virtuelles, IA',
  authors: [{ name: 'AfriBayit Team' }],
  creator: 'AfriBayit',
  publisher: 'AfriBayit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://afribayit.com'),
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/fr',
      'en-US': '/en',
      'ar-DZ': '/ar',
      'pt-BR': '/pt',
      'es-ES': '/es',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://afribayit.com',
    title: 'AfriBayit - Plateforme Immobilière Révolutionnaire',
    description: 'Découvrez la plateforme immobilière la plus avancée d\'Afrique',
    siteName: 'AfriBayit',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AfriBayit - Plateforme Immobilière',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AfriBayit - Plateforme Immobilière Révolutionnaire',
    description: 'Découvrez la plateforme immobilière la plus avancée d\'Afrique',
    images: ['/og-image.jpg'],
    creator: '@afribayit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    // System theme
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    document.documentElement.classList.add(systemTheme);
                  }
                } catch (e) {
                  // Fallback to light theme if localStorage is not available
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${poppins.className} antialiased bg-neutral-50 text-neutral-900`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
