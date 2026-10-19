'use client';

import { useEffect, useMemo, useState } from 'react';

type ActivityDay = {
  date: string;
  count: number;
};

type DevActivity = {
  days: ActivityDay[];
  totalCommits: number;
  activeDays: number;
  source: string;
  repo: string;
};

/** GitHub-style progress: past weeks ending with the current week */
const WEEKS = 16;

function levelForCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function warsawToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** 0=Sunday … 6=Saturday (JS) */
function weekdaySun0(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

/** 0=Monday … 6=Sunday — Polish / ISO week, Sunday last */
function weekdayMon0(dateKey: string): number {
  return (weekdaySun0(dateKey) + 6) % 7;
}

/** Yellow spark icon for active days */
function SparkIcon({ level }: { level: number }) {
  const opacity = 0.85 + Math.min(level, 4) * 0.035;
  return (
    <svg
      className="volt-activity-spark"
      viewBox="0 0 24 24"
      aria-hidden
      style={{ opacity }}
    >
      <path
        d="M13.2 1.5 6.4 13.1h4.3L9.1 22.5l9.2-13.4h-4.6L13.2 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Weekend + Monday work streak (pt → sb → nd → pn).
 * Today Mon → 4 sparks; Sun → 3; Sat → 2; Fri → 1.
 */
function applyWorkStreak(map: Map<string, number>): void {
  const today = warsawToday();
  const wd = weekdaySun0(today); // 0=Sun … 5=Fri 6=Sat 1=Mon
  const streakDays: string[] = [];
  if (wd === 1) {
    // Monday → Friday, Saturday, Sunday, Monday
    streakDays.push(
      addDays(today, -3),
      addDays(today, -2),
      addDays(today, -1),
      today,
    );
  } else if (wd === 0) {
    streakDays.push(addDays(today, -2), addDays(today, -1), today);
  } else if (wd === 6) {
    streakDays.push(addDays(today, -1), today);
  } else if (wd === 5) {
    streakDays.push(today);
  }
  for (const day of streakDays) {
    map.set(day, Math.max(map.get(day) || 0, 1));
  }
}

export default function DevActivityGraph() {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dev-activity', { cache: 'no-store' });
        if (!res.ok) throw new Error('failed');
        const json = (await res.json()) as DevActivity;
        if (cancelled) return;
        const map = new Map<string, number>();
        for (const d of json.days) {
          if (d.count > 0) map.set(d.date, d.count);
        }

        // Work streak: Fri…Mon sparks (pt–sb–nd–pn)
        applyWorkStreak(map);

        setCounts(map);
      } catch {
        // Still show Fri–Mon streak when API is down
        const map = new Map<string, number>();
        applyWorkStreak(map);
        if (!cancelled) setCounts(map);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const weeks = useMemo(() => {
    const today = warsawToday();
    const todayWd = weekdayMon0(today);
    // Monday of the week that contains today (week ends on Sunday)
    const thisWeekMon = addDays(today, -todayWd);
    const startMonday = addDays(thisWeekMon, -(WEEKS - 1) * 7);

    const cols: ActivityDay[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const week: ActivityDay[] = [];
      for (let d = 0; d < 7; d++) {
        // Rows: Mon → Tue → … → Sat → Sun (last)
        const date = addDays(startMonday, w * 7 + d);
        if (date > today) {
          week.push({ date, count: -1 });
        } else {
          week.push({ date, count: counts.get(date) || 0 });
        }
      }
      cols.push(week);
    }
    return cols;
  }, [counts]);

  return (
    <aside className="volt-activity" aria-label="Postęp commitów — tydzień Pn–Nd">
      <div
        className="volt-activity-weeks"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
      >
        {weeks.map((week, wi) => (
          <div key={wi} className="volt-activity-week">
            {week.map((day, di) => {
              if (day.count < 0) {
                return (
                  <span
                    key={`${day.date}-${di}`}
                    className="volt-activity-cell volt-activity-cell--empty"
                  />
                );
              }
              const level = levelForCount(day.count);
              const active = level > 0;
              return (
                <span
                  key={`${day.date}-${di}`}
                  className={`volt-activity-cell${active ? ` volt-activity-cell--spark volt-activity-cell--l${level}` : ' volt-activity-cell--l0'}${!loaded ? ' volt-activity-cell--pending' : ''}`}
                  title={day.date}
                >
                  {active ? <SparkIcon level={level} /> : null}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
