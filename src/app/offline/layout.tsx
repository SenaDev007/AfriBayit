import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hors ligne — AfriBayit",
  description: "Vous êtes hors ligne.",
  keywords: ["hors ligne", "offline", "PWA"],
  openGraph: {
    title: "Hors ligne — AfriBayit",
    description: "Vous êtes hors ligne.",
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
