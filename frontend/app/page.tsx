import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';

/** Trasa `/` = landing. Hub ELGEN = `/panel` (nie `/app` — psuje Docker standalone). */
export const metadata: Metadata = {
  title: 'Projekt 2027 — Elektryka · Automatyka · Software · AI',
  description:
    'Jedne drzwi dla klienta: zgłoszenie, projekt w narzędziach branżowych, oferta Volt, realizacja i dokumentacja. Model biznesowy w trakcie walidacji.',
};

export default function HomePage() {
  return <LandingPageClient />;
}
