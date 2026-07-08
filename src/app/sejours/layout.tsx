import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Séjours Hôtels & Guesthouses — AfriBayit",
  description: "Réservez hôtels, guesthouses et séjours courts en Afrique de l'Ouest. La plateforme hôtelière de référence.",
  keywords: ["séjours", "hôtels", "guesthouses", "réservation", "Afrique", "AfriBayit"],
  openGraph: {
    title: "Séjours Hôtels & Guesthouses — AfriBayit",
    description: "Réservez hôtels, guesthouses et séjours courts en Afrique de l'Ouest.",
    type: "website",
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
