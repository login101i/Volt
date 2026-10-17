/**
 * Shared ELGEN / Volt hub navigation tiles.
 */
export type AppNavItem = {
  href: string;
  glyph: string;
  title: string;
  description: string;
  disabled?: boolean;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    href: '/offer/new',
    glyph: '📄+',
    title: 'Nowa Oferta',
    description: 'Utwórz nową ofertę dla klienta',
  },
  {
    href: '/orders',
    glyph: '📚',
    title: 'Lista Ofert',
    description: 'Przeglądaj zapisane oferty',
  },
  {
    href: '/calculation',
    glyph: '🔢',
    title: 'Kalkulacja',
    description: 'Obliczenia obwodów elektrycznych',
  },
  {
    href: '/elequicz',
    glyph: '❓',
    title: 'EleQuicz',
    description: 'Pytania i odpowiedzi o instalacje elektryczne',
  },
  {
    href: '/dobor-kabli',
    glyph: '🔌',
    title: 'Dobór Kabli',
    description: 'Precyzyjny wybór przewodów — przekrój, obciążalność i więcej',
  },
  {
    href: '/migracja',
    glyph: '🚀',
    title: 'Migracja VPS',
    description: 'Kroki wdrożenia elektrykpoznan.online na Hetzner',
  },
];
