import { redirect } from 'next/navigation';

export default function Home() {
  // Simple redirect to login as this is a personal-use app and has no public landing page
  redirect('/login');
}
