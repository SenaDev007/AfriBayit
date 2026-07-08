import { redirect } from 'next/navigation';

// /guesthouse is now merged into /sejours (unified search page)
// Property management moved to /hotel-dashboard (PMS)
export default function GuesthouseRedirect() {
  redirect('/sejours');
}
