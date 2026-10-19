/**
 * Autor karty na tablicy Development: MK (Maciej) / PM (Paweł Mrowczyński).
 * Identyfikacja per przeglądarka (localStorage) + heurystyka API/host.
 */

export type DevAuthorId = 'MK' | 'PM';

const STORAGE_KEY = 'volt-dev-author';

const AUTHORS: Record<
  DevAuthorId,
  { id: DevAuthorId; name: string; color: string; bg: string }
> = {
  MK: {
    id: 'MK',
    name: 'Maciej Kruszyniak',
    color: '#1b2828',
    bg: '#e3b760', // złoty Volt
  },
  PM: {
    id: 'PM',
    name: 'Paweł Mrowczyński',
    color: '#ffffff',
    bg: '#3b82f6', // niebieskie kółeczko
  },
};

export function getAuthorMeta(id: DevAuthorId) {
  return AUTHORS[id];
}

/** Zapisuje wybór autora w tej przeglądarce. */
export function setDevAuthor(id: DevAuthorId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/**
 * Który autor dodaje z tej przeglądarki.
 * 1) localStorage (ustawione ręcznie / wcześniej)
 * 2) localhost / 127.0.0.1 / API na :5000 → MK (ten komputer deweloperski)
 * 3) w przeciwnym razie PM
 */
export function resolveDevAuthor(): DevAuthorId {
  if (typeof window === 'undefined') return 'MK';

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'MK' || saved === 'PM') return saved;
  } catch {
    /* ignore */
  }

  const host = window.location.hostname.toLowerCase();
  const apiHint = String(process.env.NEXT_PUBLIC_API_URL || '').toLowerCase();
  const isLocalDev =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.local') ||
    apiHint.includes('localhost') ||
    apiHint.includes('127.0.0.1') ||
    apiHint.includes(':5000');

  const inferred: DevAuthorId = isLocalDev ? 'MK' : 'PM';
  setDevAuthor(inferred);
  return inferred;
}

/** Mapuje createdBy z API na MK/PM. */
export function authorFromCreatedBy(createdBy?: string | null): DevAuthorId | null {
  const raw = String(createdBy || '')
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (
    raw === 'mk' ||
    raw.includes('maciej') ||
    raw.includes('kruszyniak') ||
    raw.startsWith('mk')
  ) {
    return 'MK';
  }
  if (
    raw === 'pm' ||
    raw.includes('paweł') ||
    raw.includes('pawel') ||
    raw.includes('mrowczyn') ||
    raw.includes('mrowczyń') ||
    raw.startsWith('pm')
  ) {
    return 'PM';
  }
  return null;
}
