// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // Langsung lempar user ke halaman login TaskFlow yang benar
  redirect('/login');
}
