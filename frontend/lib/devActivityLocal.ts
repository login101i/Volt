/**
 * Lokalny dziennik aktywności (pioruny na landingu).
 * Zapis w localStorage jako tekst JSON — przetrwa nawet gdy GitHub API nie działa.
 */

export const DEV_ACTIVITY_STORAGE_KEY = 'volt_dev_activity_days_v1';

export type LocalActivityDay = {
  date: string; // YYYY-MM-DD (Europe/Warsaw)
  count: number;
};

type LocalActivityFile = {
  version: 1;
  updatedAt: string;
  days: LocalActivityDay[];
};

function warsawToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Odczyt mapy data → count z localStorage. */
export function loadLocalActivity(): Map<string, number> {
  const map = new Map<string, number>();
  if (typeof window === 'undefined') return map;
  try {
    const raw = localStorage.getItem(DEV_ACTIVITY_STORAGE_KEY);
    if (!raw) return map;
    const parsed = JSON.parse(raw) as LocalActivityFile | LocalActivityDay[];
    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.days)
        ? parsed.days
        : [];
    for (const row of list) {
      const date = String(row?.date || '').slice(0, 10);
      const count = Number(row?.count) || 0;
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && count > 0) {
        map.set(date, Math.max(map.get(date) || 0, count));
      }
    }
  } catch {
    /* ignore corrupt */
  }
  return map;
}

/** Zapis mapy jako czytelny JSON (tekst). */
export function saveLocalActivity(map: Map<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    const days: LocalActivityDay[] = [...map.entries()]
      .filter(([, count]) => count > 0)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const payload: LocalActivityFile = {
      version: 1,
      updatedAt: new Date().toISOString(),
      days,
    };
    localStorage.setItem(DEV_ACTIVITY_STORAGE_KEY, JSON.stringify(payload, null, 2));
  } catch {
    /* quota / private mode */
  }
}

/** Scal dwie mapy — bierze wyższy count na dzień. */
export function mergeActivityMaps(
  ...maps: Array<Map<string, number>>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const map of maps) {
    for (const [date, count] of map) {
      if (count > 0) out.set(date, Math.max(out.get(date) || 0, count));
    }
  }
  return out;
}

/** Oznacz dziś jako dzień pracy (min. 1 piorun) i zapisz. */
export function markTodayActive(
  map: Map<string, number>,
  minCount = 1,
): Map<string, number> {
  const today = warsawToday();
  const next = new Map(map);
  next.set(today, Math.max(next.get(today) || 0, minCount));
  saveLocalActivity(next);
  return next;
}

/**
 * Seed startowy (pt–pn weekend pracy) — tylko gdy lokalnie jeszcze pusto.
 * Daty względne od „dziś” w strefie Warszawy.
 */
export function seedRecentWorkIfEmpty(map: Map<string, number>): Map<string, number> {
  if (map.size > 0) return map;
  const today = warsawToday();
  // Ostatnie 5 dni kalendarzowych jako punkt startu (pt…dziś / ostatni weekend)
  const next = new Map(map);
  for (let i = 4; i >= 0; i -= 1) {
    const [y, m, d] = today.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    next.set(key, 1);
  }
  saveLocalActivity(next);
  return next;
}
