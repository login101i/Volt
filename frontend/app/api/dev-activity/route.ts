import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 900;

const GITHUB_REPO = process.env.DEV_PULSE_GITHUB_REPO || 'login101i/Volt';
const TZ = 'Europe/Warsaw';

export type ActivityDay = {
  date: string; // YYYY-MM-DD in Europe/Warsaw
  count: number;
};

export type DevActivity = {
  days: ActivityDay[];
  totalCommits: number;
  activeDays: number;
  source: 'github-commits' | 'github-stats' | 'empty';
  repo: string;
};

/** Calendar date in Europe/Warsaw */
function warsawDateKey(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d); // YYYY-MM-DD
}

/** 0=Sunday … 6=Saturday for a Warsaw calendar date */
function warsawWeekday(dateKey: string): number {
  // Noon UTC on that civil date is a safe anchor; adjust via formatter
  const probe = new Date(`${dateKey}T12:00:00Z`);
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(probe);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function buildGrid(byDate: Map<string, number>, weeks = 53): ActivityDay[] {
  const today = warsawDateKey(new Date());
  const todayWd = warsawWeekday(today);
  // Start at Sunday of the week that is (weeks-1) weeks before current week
  const start = addDays(today, -todayWd - (weeks - 1) * 7);

  const out: ActivityDay[] = [];
  let cursor = start;
  while (cursor <= today) {
    out.push({ date: cursor, count: byDate.get(cursor) || 0 });
    cursor = addDays(cursor, 1);
  }
  return out;
}

async function fetchCommitsByDay(): Promise<Map<string, number> | null> {
  try {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 53 * 7);
    const byDate = new Map<string, number>();
    let url: string | null =
      `https://api.github.com/repos/${GITHUB_REPO}/commits?since=${since.toISOString()}&per_page=100`;

    for (let page = 0; page < 12 && url; page++) {
      const pageUrl: string = url;
      const res: Response = await fetch(pageUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'volt-dev-activity',
        },
        next: { revalidate: 900 },
      });
      if (!res.ok) break;

      const batch = (await res.json()) as Array<{
        commit?: { author?: { date?: string }; committer?: { date?: string } };
      }>;

      for (const item of batch) {
        const iso = item.commit?.author?.date || item.commit?.committer?.date;
        if (!iso) continue;
        const key = warsawDateKey(iso);
        byDate.set(key, (byDate.get(key) || 0) + 1);
      }

      const link = res.headers.get('link');
      const nextMatch = link?.match(/<([^>]+)>;\s*rel="next"/);
      url = nextMatch?.[1] ?? null;
      if (batch.length < 100) break;
    }

    return byDate.size > 0 ? byDate : null;
  } catch {
    return null;
  }
}

async function fetchStatsByDay(): Promise<Map<string, number> | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/stats/commit_activity`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'volt-dev-activity',
        },
        next: { revalidate: 900 },
      },
    );
    if (res.status === 202 || !res.ok) return null;

    const weeks = (await res.json()) as Array<{
      week: number;
      days: number[];
    }>;
    if (!Array.isArray(weeks) || weeks.length === 0) return null;

    const byDate = new Map<string, number>();
    for (const w of weeks) {
      // GitHub week timestamp = Sunday 00:00 UTC
      for (let i = 0; i < 7; i++) {
        const utc = new Date((w.week + i * 86400) * 1000);
        const key = warsawDateKey(utc);
        byDate.set(key, (byDate.get(key) || 0) + (w.days[i] || 0));
      }
    }
    return byDate;
  } catch {
    return null;
  }
}

export async function GET() {
  let byDate = await fetchCommitsByDay();
  let source: DevActivity['source'] = 'github-commits';

  if (!byDate) {
    byDate = await fetchStatsByDay();
    source = byDate ? 'github-stats' : 'empty';
  }

  const days = buildGrid(byDate ?? new Map(), 53);
  const totalCommits = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  const body: DevActivity = {
    days,
    totalCommits,
    activeDays,
    source: byDate ? source : 'empty',
    repo: GITHUB_REPO,
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    },
  });
}
