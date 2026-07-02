import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Profil — AfriBayit",
  description: "Gérez votre profil AfriBayit.",
  keywords: ["profil", "compte"],
  openGraph: {
    title: "Profil — AfriBayit",
    description: "Gérez votre profil AfriBayit.",
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
