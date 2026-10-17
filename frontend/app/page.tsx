import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

/** Trasa `/` = landing. Hub ELGEN = `/panel` (nie `/app` — psuje Docker standalone). */
export const metadata: Metadata = {
  title: 'Projekt 2027 — Elektryka · Automatyka · Software · AI',
  description:
    'Od zapytania klienta przez projekt rozdzielnicy i ofertę Volt — po realizację i dokumentację.',
};

export default function HomePage() {
  return <LandingPageClient />;
}
