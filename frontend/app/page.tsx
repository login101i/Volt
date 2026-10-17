import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

/**
 * Trasa `/` — publiczny landing Projekt 2027.
 * Panel narzędzi jest wyłącznie pod `/app` (`app/app/page.tsx`).
 * Nie re-eksportuj tu hubu i nie rób redirect(`/app`).
 */
export const metadata: Metadata = {
  title: 'Projekt 2027 — Elektryka · Automatyka · Software · AI',
  description:
    'Od zapytania klienta przez projekt rozdzielnicy i ofertę Volt — po realizację i dokumentację.',
};

export default function HomePage() {
  return <LandingPageClient />;
}
