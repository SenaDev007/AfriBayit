import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Notaire électronique — AfriBayit",
  description: "Services notariaux électroniques.",
  keywords: ["notaire", "acte authentique"],
  openGraph: {
    title: "Notaire électronique — AfriBayit",
    description: "Services notariaux électroniques.",
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
