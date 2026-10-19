/**
 * Autor karty na tablicy Development: MK (Maciej) / PM (Paweł Mrowczyński).
 * Identyfikacja per przeglądarka (localStorage).
 * Tablet / touch → domyślnie MK (Maciej też pracuje z tabletu).
 * PM tylko po świadomym wyborze w UI.
 */

export type DevAuthorId = 'MK' | 'PM';

const STORAGE_KEY = 'volt-dev-author';
const EXPLICIT_KEY = 'volt-dev-author-explicit';

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

/** Tablet / iPad / Android tablet / touch-primary device. */
export function isTabletOrTouchDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return true;
  // iPadOS 13+ często raportuje się jako Macintosh + touch
  if (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua)) return true;
  try {
    if (
      window.matchMedia('(pointer: coarse)').matches &&
      window.matchMedia('(hover: none)').matches
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Zapisuje wybór autora w tej przeglądarce.
 * `explicit: true` (domyślnie) = użytkownik kliknął MK/PM — nie nadpisuj autoheurystyką.
 */
export function setDevAuthor(
  id: DevAuthorId,
  opts?: { explicit?: boolean },
): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    if (opts?.explicit !== false) {
      localStorage.setItem(EXPLICIT_KEY, '1');
    }
  } catch {
    /* ignore */
  }
}

/**
 * Który autor dodaje z tej przeglądarki.
 * 1) Świadomy wybór MK/PM w UI
 * 2) Tablet / touch → MK (Twój tablet = Ty)
 * 3) Wcześniejszy zapis w localStorage
 * 4) Domyślnie MK
 */
export function resolveDevAuthor(): DevAuthorId {
  if (typeof window === 'undefined') return 'MK';

  try {
    const explicit = localStorage.getItem(EXPLICIT_KEY) === '1';
    const saved = localStorage.getItem(STORAGE_KEY);

    if (explicit && (saved === 'MK' || saved === 'PM')) {
      return saved;
    }

    // Tablet bez świadomego wyboru → zawsze MK (naprawia stare auto-PM z hosta)
    if (isTabletOrTouchDevice()) {
      localStorage.setItem(STORAGE_KEY, 'MK');
      return 'MK';
    }

    if (saved === 'MK' || saved === 'PM') return saved;
  } catch {
    /* ignore */
  }

  return 'MK';
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
