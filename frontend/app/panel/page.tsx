'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { APP_NAV_ITEMS } from '@/lib/appNav';

/**
 * Panel narzędzi — trasa `/panel`.
 * Nie używaj folderu `app/app` (URL `/app`): Next.js standalone + Docker WORKDIR `/app`
 * wtedy serwuje złą stronę na `/` (vercel/next.js#68690).
 */
export default function AppHubPage() {
  return (
    <AppShell backHref="/" title="ELGEN GENERATOR OFERT">
      <div style={{ marginBottom: 28 }} data-page="app-hub">
        <p className="volt-eyebrow">Aplikacja Volt</p>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 40px)',
            letterSpacing: '-0.035em',
            margin: '8px 0 6px',
            fontWeight: 800,
          }}
        >
          Panel narzędzi
        </h1>
        <p className="volt-muted" style={{ margin: 0, maxWidth: 560 }}>
          Wybierz moduł — oferty, kalkulacja obwodów, dobór kabli i więcej.
        </p>
      </div>

      <nav className="volt-action-grid" aria-label="Moduły aplikacji">
        {APP_NAV_ITEMS.map((item) => {
          const content = (
            <>
              <div>
                <div className="tile-glyph" aria-hidden>
                  {item.glyph === '📄+' ? (
                    <span style={{ position: 'relative', display: 'inline-block' }}>
                      📄
                      <span
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -10,
                          fontSize: 22,
                          fontWeight: 800,
                        }}
                      >
                        +
                      </span>
                    </span>
                  ) : (
                    item.glyph
                  )}
                </div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
              <span className="tile-arrow" aria-hidden>
                →
              </span>
            </>
          );

          if (item.disabled) {
            return (
              <div
                key={item.title}
                className="volt-action-tile"
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
                aria-disabled
                title="Wkrótce"
              >
                {content}
              </div>
            );
          }

          return (
            <Link key={item.title} href={item.href} className="volt-action-tile">
              {content}
            </Link>
          );
        })}
      </nav>
    </AppShell>
  );
}
