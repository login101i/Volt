'use client';

import Link from 'next/link';
import { useGlobalStyle } from '@/components/GlobalStyleProvider';

/** Publiczna strona główna `/` — nie panel `/app`. */
export default function LandingPageClient() {
  const { theme, toggleTheme } = useGlobalStyle();

  return (
    <div className="volt-page" data-page="landing">
      <header className="volt-wrap">
        <div className="volt-header">
          <div className="volt-brand">
            <span className="volt-brandmark" aria-hidden>
              ϟ
            </span>
            <span className="volt-brand-text">
              <strong>PROJEKT 2027</strong>
              <span>Elektryka · Automatyka · Software · AI</span>
            </span>
          </div>
          <div className="volt-header-meta">
            <Link href="#volt" className="volt-btn volt-btn--secondary volt-btn--sm">
              Volt
            </Link>
            <Link href="/app" className="volt-btn volt-btn--secondary volt-btn--sm">
              Aplikacja
            </Link>
            <button
              type="button"
              className="volt-btn volt-btn--ghost volt-btn--sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? '☀ Jasny' : '☾ Ciemny'}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="volt-wrap" style={{ padding: '72px 0 48px' }}>
          <p className="volt-eyebrow">W trakcie walidacji</p>
          <h1
            style={{
              fontSize: 'clamp(46px, 7vw, 88px)',
              lineHeight: 1.05,
              letterSpacing: '-0.055em',
              maxWidth: 900,
              margin: '16px 0 20px',
              fontWeight: 900,
            }}
          >
            Projekt <span className="volt-gradient-text">2027</span>
          </h1>
          <p
            className="volt-muted"
            style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              maxWidth: 680,
              marginBottom: 28,
            }}
          >
            Od zapytania klienta przez projekt rozdzielnicy i ofertę Volt — po realizację
            i dokumentację. Centrum pracy zespołu elektryka i oprogramowania.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/app" className="volt-btn">
              Otwórz aplikację Volt →
            </Link>
            <a href="#volt" className="volt-btn volt-btn--secondary">
              Dowiedz się więcej
            </a>
          </div>
        </section>

        <section className="volt-wrap" id="volt" style={{ padding: '24px 0 80px' }}>
          <div className="volt-panel">
            <div>
              <div className="volt-eyebrow">Nasz rozdział · w rozwoju</div>
              <h2>
                <span className="volt-bolt">ϟ</span> Volt
              </h2>
              <p>
                Narzędzie do tworzenia czytelnych ofert na rozdzielnice i prace elektryczne.
                Centrum przygotowania wyceny i odpowiedzi klientowi — nie konkurent dla
                Hagercad ani zastępstwo projektu technicznego.
              </p>
              <div className="volt-steps">
                <span>Zapytanie</span>
                <span>→</span>
                <span>Dobór i kalkulacja</span>
                <span>→</span>
                <span>Oferta Volt</span>
                <span>→</span>
                <span>Akceptacja</span>
              </div>
            </div>
            <Link href="/app" className="volt-btn volt-link">
              Wejdź do ELGEN ↗
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
