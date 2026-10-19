'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DevelopmentBoard from './DevelopmentBoard';
import {
  getAuthorMeta,
  resolveDevAuthor,
  setDevAuthor,
  type DevAuthorId,
} from '@/lib/devAuthor';

export default function DevelopmentPage() {
  const [author, setAuthor] = useState<DevAuthorId>('MK');

  useEffect(() => {
    setAuthor(resolveDevAuthor());
  }, []);

  return (
    <AppShell
      title="Development"
      backHref="/"
      wrap={false}
      actions={
        <Link href="/panel" className="volt-btn volt-btn--ghost volt-btn--sm">
          Panel
        </Link>
      }
    >
      <div
        className="flex min-h-[calc(100vh-7rem)] flex-col gap-3 px-4 pb-6 pt-2 sm:px-6"
        data-page="development"
        style={{ width: '100%', maxWidth: '100%' }}
      >
        <div className="flex items-center justify-between gap-3">
          <h1
            style={{
              fontSize: 'clamp(24px, 3vw, 32px)',
              letterSpacing: '-0.03em',
              margin: 0,
              fontWeight: 800,
            }}
          >
            Development
          </h1>
          <div
            className="flex shrink-0 items-center gap-2"
            title="Autor nowych zadań w tej przeglądarce"
          >
            {(['MK', 'PM'] as DevAuthorId[]).map((id) => {
              const meta = getAuthorMeta(id);
              const active = author === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setDevAuthor(id);
                    setAuthor(id);
                  }}
                  className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs transition"
                  style={{
                    borderColor: active ? meta.bg : 'var(--volt-line)',
                    opacity: active ? 1 : 0.55,
                  }}
                  aria-pressed={active}
                  aria-label={meta.name}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
                    style={{
                      width: 18,
                      height: 18,
                      backgroundColor: meta.bg,
                      color: meta.color,
                    }}
                  >
                    {id}
                  </span>
                  <span>{id}</span>
                </button>
              );
            })}
          </div>
        </div>
        <DevelopmentBoard />
      </div>
    </AppShell>
  );
}
