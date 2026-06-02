import { redirect } from 'next/navigation';

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  redirect(`/admin/${country}/dashboard`);
}
