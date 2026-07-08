import { redirect } from 'next/navigation';

// /hospitality is now merged into /sejours (unified search page)
export default function HospitalityRedirect() {
  redirect('/sejours');
}
