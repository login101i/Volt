'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import {
  MIGRATION_STEPS,
  STATUS_LABEL,
  type MigrationStep,
} from '@/lib/migrationGuide';
import styles from './migracja.module.css';

const STORAGE_KEY = 'volt_migracja_checks';

export default function MigracjaPage() {
  const [activeId, setActiveId] = useState(MIGRATION_STEPS[0].id);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* checklist zostaje pusta */
    }
  }, []);

  const allTasks = useMemo(
    () => MIGRATION_STEPS.flatMap((step) => step.tasks),
    []
  );
  const doneCount = allTasks.filter((task) => done[task.id]).length;
  const progress = Math.round((doneCount / allTasks.length) * 100);
  const step = MIGRATION_STEPS.find((item) => item.id === activeId) ?? MIGRATION_STEPS[0];

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function copyBlock(title: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(title);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  return (
    <AppShell backHref="/app" title="MIGRACJA VPS">
      <div className={styles.intro}>
        <div>
          <p className="volt-eyebrow">elektrykpoznan.online</p>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              letterSpacing: '-0.045em',
              margin: '8px 0 8px',
              fontWeight: 850,
              lineHeight: 1.05,
            }}
          >
            Volt na VPS, domena na Caddy
          </h1>
          <p className="volt-muted" style={{ maxWidth: 720, margin: 0 }}>
            Ten sam układ co działający opticut.pl: Hetzner, Docker, Caddy, DNS w Cyber Folks,
            deploy z GitHuba. Poniżej jest ścieżka dla Volta — port 5000, API <code>/api</code>,
            baza na razie zostaje na s78.
          </p>
        </div>

        <div className={styles.callout}>
          <strong>Najpierw to.</strong>
          <span className="volt-muted">
            <code>docker-compose.yml</code> i <code>.github/workflows/deploy-hetzner.yml</code> w tym
            repo opisują Opticut (<code>/opt/opticut</code>, port 8000, <code>/api/v1</code>). Dla Volta
            używaj wyłącznie <code>docker-compose.volt.yml</code> i <code>deploy-volt.yml</code>, które
            wdrażają do <code>/opt/volt</code> na osobnych portach.
          </span>
        </div>

        <ul className={styles.flow} aria-label="Ruch na produkcji">
          <li>Przeglądarka</li>
          <li data-arrow>→</li>
          <li>DNS A → IP VPS</li>
          <li data-arrow>→</li>
          <li>Caddy :443</li>
          <li data-arrow>→</li>
          <li>Next :3000</li>
          <li data-arrow>→</li>
          <li>Express :5000</li>
          <li data-arrow>→</li>
          <li>MariaDB Cyber Folks</li>
        </ul>
      </div>

      <div className={styles.progress}>
        <span>
          Checklist {doneCount}/{allTasks.length}
        </span>
        <span>{progress}%</span>
      </div>
      <div className={styles.bar} aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.layout}>
        <nav className={styles.nav} aria-label="Kroki migracji">
          {MIGRATION_STEPS.map((item) => (
            <button
              key={item.id}
              type="button"
              data-active={item.id === step.id}
              onClick={() => setActiveId(item.id)}
            >
              <span className={styles.num}>{item.number}</span>
              <span>
                <span className={styles.badge} data-status={item.status}>
                  {STATUS_LABEL[item.status]}
                </span>
                <span style={{ display: 'block', fontWeight: 750, marginTop: 4 }}>{item.title}</span>
              </span>
            </button>
          ))}
        </nav>

        <StepDetail
          step={step}
          done={done}
          copied={copied}
          onToggle={toggle}
          onCopy={copyBlock}
        />
      </div>
    </AppShell>
  );
}

function StepDetail({
  step,
  done,
  copied,
  onToggle,
  onCopy,
}: {
  step: MigrationStep;
  done: Record<string, boolean>;
  copied: string | null;
  onToggle: (id: string) => void;
  onCopy: (title: string, code: string) => void;
}) {
  return (
    <article className="volt-card">
      <span className={styles.badge} data-status={step.status}>
        Krok {step.number} · {STATUS_LABEL[step.status]}
      </span>
      <div className={styles.detail}>
        <h2>{step.title}</h2>
      </div>
      <div className={styles.prose}>
        <h3>Cel</h3>
        <p>{step.goal}</p>
        <h3>Po co</h3>
        <p>{step.why}</p>
        <h3>Gdy tego nie zrobisz</h3>
        <p>{step.without}</p>
      </div>

      <h3 style={{ margin: '18px 0 8px', fontSize: 16 }}>Checklist</h3>
      <ul className={styles.tasks}>
        {step.tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={Boolean(done[task.id])}
                onChange={() => onToggle(task.id)}
              />
              <span data-done={Boolean(done[task.id])}>{task.label}</span>
            </label>
          </li>
        ))}
      </ul>

      {step.blocks.map((block) => (
        <div key={block.title} className={styles.block}>
          <header>
            <span>{block.title}</span>
            <button
              type="button"
              className="volt-btn volt-btn--ghost volt-btn--sm"
              onClick={() => onCopy(block.title, block.code)}
            >
              {copied === block.title ? 'Skopiowane' : 'Kopiuj'}
            </button>
          </header>
          <pre className={styles.code}>
            <code>{block.code}</code>
          </pre>
        </div>
      ))}
    </article>
  );
}
