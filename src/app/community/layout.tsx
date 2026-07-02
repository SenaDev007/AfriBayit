import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Communauté — AfriBayit Connect",
  description: "Rejoignez la communauté AfriBayit.",
  keywords: ["communauté", "forum", "networking"],
  openGraph: {
    title: "Communauté — AfriBayit Connect",
    description: "Rejoignez la communauté AfriBayit.",
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
