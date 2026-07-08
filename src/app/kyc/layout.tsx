import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Vérification KYC — AfriBayit",
  description: "Soumettez vos documents KYC.",
  keywords: ["KYC", "vérification identité"],
  openGraph: {
    title: "Vérification KYC — AfriBayit",
    description: "Soumettez vos documents KYC.",
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
