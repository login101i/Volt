'use client';

import Link from 'next/link';
import { useGlobalStyle } from './GlobalStyleProvider';

type AppShellProps = {
  children: React.ReactNode;
  /** Show compact app chrome (brand + user + theme). Default true. */
  showHeader?: boolean;
  /** Optional page title next to brand */
  title?: string;
  /** Back link target; omit to hide */
  backHref?: string;
  /** Extra actions on the right side of the header */
  actions?: React.ReactNode;
  /** Constrain content width with .volt-wrap */
  wrap?: boolean;
  className?: string;
};

export default function AppShell({
  children,
  showHeader = true,
  title,
  backHref = '/',
  actions,
  wrap = true,
  className = '',
}: AppShellProps) {
  const { theme, toggleTheme } = useGlobalStyle();

  return (
    <div className={`volt-page ${className}`.trim()}>
      {showHeader && (
        <header className="volt-wrap">
          <div className="volt-header">
            <div className="volt-brand">
              {backHref && (
                <Link
                  href={backHref}
                  className="volt-btn volt-btn--ghost volt-btn--sm"
                  aria-label="Powrót"
                >
                  ←
                </Link>
              )}
              <Link href="/app" className="volt-brand" style={{ gap: 12 }}>
                <span className="volt-brandmark" aria-hidden>
                  ϟ
                </span>
                <span className="volt-brand-text">
                  <strong>{title || 'ELGEN · VOLT'}</strong>
                  <span>Instalacje Elektryczne</span>
                </span>
              </Link>
            </div>

            <div className="volt-header-meta">
              <span className="hidden sm:inline">maciejkruszyniak@gmail.com</span>
              {actions}
              <button
                type="button"
                className="volt-btn volt-btn--ghost volt-btn--sm"
                onClick={toggleTheme}
                aria-label="Przełącz motyw"
              >
                {theme === 'dark' ? '☀ Jasny' : '☾ Ciemny'}
              </button>
              <button type="button" className="volt-btn volt-btn--secondary volt-btn--sm">
                Wyloguj
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={wrap ? 'volt-wrap volt-shell-main' : 'volt-shell-main'}>
        {children}
      </main>
    </div>
  );
}
