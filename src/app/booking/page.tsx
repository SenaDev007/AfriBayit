import { redirect } from 'next/navigation';

// /booking is now /sejours (clearer name for travelers)
export default function BookingRedirect() {
  redirect('/sejours');
}
