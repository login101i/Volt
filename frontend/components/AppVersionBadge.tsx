'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { APP_VERSION } from '@/lib/appVersion';
import { useGlobalStyle } from '@/components/GlobalStyleProvider';

/** Persists last-seen version so a bump celebrates once. */
const APP_VERSION_SEEN_KEY = 'volt_seen_app_version';
/** Flight duration (seconds) — bolts gather for ~5s. */
const BOLT_ANIM_S = 5;
const BOLT_GROW_SCALE = 1.7;
const DIGIT_FLIP_MS = 700;

type BoltDef = {
  id: number;
  /** Fraction along the chosen edge (0–1). */
  t: number;
  edge: 'top' | 'right' | 'bottom' | 'left';
  size: number;
  delay: number;
  spin: 1 | -1;
  turns: number;
  color: string;
  glow: string;
};

/** Yellow lightning bolts spawning from all sides of the landing page. */
const BOLT_DEFS: BoltDef[] = [
  { id: 1, edge: 'top', t: 0.15, size: 18, delay: 0, spin: 1, turns: 1.2, color: '#e3b760', glow: 'rgba(227,183,96,0.95)' },
  { id: 2, edge: 'top', t: 0.55, size: 14, delay: 0.35, spin: -1, turns: 1.1, color: '#ffd078', glow: 'rgba(255,208,120,0.95)' },
  { id: 3, edge: 'top', t: 0.88, size: 16, delay: 0.7, spin: 1, turns: 1.3, color: '#f0c56e', glow: 'rgba(240,197,110,0.9)' },
  { id: 4, edge: 'right', t: 0.2, size: 15, delay: 0.2, spin: -1, turns: 1.15, color: '#ffe29a', glow: 'rgba(255,226,154,0.9)' },
  { id: 5, edge: 'right', t: 0.5, size: 20, delay: 0.9, spin: 1, turns: 1.35, color: '#e3b760', glow: 'rgba(227,183,96,0.95)' },
  { id: 6, edge: 'right', t: 0.82, size: 13, delay: 1.4, spin: -1, turns: 1.05, color: '#f0c56e', glow: 'rgba(240,197,110,0.9)' },
  { id: 7, edge: 'bottom', t: 0.12, size: 17, delay: 0.5, spin: 1, turns: 1.25, color: '#ffd078', glow: 'rgba(255,208,120,0.95)' },
  { id: 8, edge: 'bottom', t: 0.48, size: 14, delay: 1.1, spin: -1, turns: 1.2, color: '#e3b760', glow: 'rgba(227,183,96,0.9)' },
  { id: 9, edge: 'bottom', t: 0.78, size: 19, delay: 1.7, spin: 1, turns: 1.4, color: '#ffe29a', glow: 'rgba(255,226,154,0.95)' },
  { id: 10, edge: 'left', t: 0.18, size: 15, delay: 0.15, spin: -1, turns: 1.1, color: '#f0c56e', glow: 'rgba(240,197,110,0.9)' },
  { id: 11, edge: 'left', t: 0.52, size: 18, delay: 0.85, spin: 1, turns: 1.3, color: '#e3b760', glow: 'rgba(227,183,96,0.95)' },
  { id: 12, edge: 'left', t: 0.85, size: 14, delay: 1.55, spin: -1, turns: 1.15, color: '#ffd078', glow: 'rgba(255,208,120,0.9)' },
  { id: 13, edge: 'top', t: 0.35, size: 12, delay: 2.0, spin: 1, turns: 1.0, color: '#ffe29a', glow: 'rgba(255,226,154,0.85)' },
  { id: 14, edge: 'right', t: 0.35, size: 16, delay: 2.2, spin: -1, turns: 1.2, color: '#e3b760', glow: 'rgba(227,183,96,0.9)' },
  { id: 15, edge: 'bottom', t: 0.65, size: 13, delay: 2.4, spin: 1, turns: 1.15, color: '#f0c56e', glow: 'rgba(240,197,110,0.9)' },
  { id: 16, edge: 'left', t: 0.35, size: 17, delay: 2.55, spin: -1, turns: 1.25, color: '#ffd078', glow: 'rgba(255,208,120,0.95)' },
];

const LAST_BOLT_GONE_MS = Math.max(
  ...BOLT_DEFS.map((d) => (d.delay + BOLT_ANIM_S) * 1000),
);
const DIGIT_FLIP_AT_MS = LAST_BOLT_GONE_MS;
const SETTLE_AT_MS = DIGIT_FLIP_AT_MS + DIGIT_FLIP_MS;
const CELEBRATE_MS = SETTLE_AT_MS + 200;
const GROW_MS = DIGIT_FLIP_AT_MS;

function getVersionOdometer(version: string): {
  prefix: string;
  fromDigits: string;
  toDigits: string;
} | null {
  const match = version.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  const head = match[1];
  const digits = match[2];
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  const prev = String(n - 1).padStart(digits.length, '0');
  let same = 0;
  while (same < digits.length && prev[same] === digits[same]) same += 1;
  const flipCount = Math.min(2, Math.max(1, digits.length - same));
  return {
    prefix: head + digits.slice(0, digits.length - flipCount),
    fromDigits: prev.slice(prev.length - flipCount),
    toDigits: digits.slice(digits.length - flipCount),
  };
}

const VERSION_ODOMETER = getVersionOdometer(APP_VERSION);

function pointsToCubicPath(pts: { x: number; y: number }[]): string {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function buildVortexPathD(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  spin: 1 | -1,
  turns: number,
): string {
  const startAngle = Math.atan2(sy - ty, sx - tx);
  const startR = Math.max(Math.hypot(sx - tx, sy - ty), 28);
  const samples = 22;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < samples; i++) {
    const u = i / (samples - 1);
    const ease = u * u * (3 - 2 * u);
    const wobble = 1 + 0.14 * Math.sin(ease * Math.PI * 3.2) * (1 - ease);
    const r = startR * (1 - ease) * wobble;
    const angle = startAngle + spin * turns * Math.PI * 2 * ease;
    pts.push({
      x: tx + Math.cos(angle) * r,
      y: ty + Math.sin(angle) * r,
    });
  }
  pts[0] = { x: sx, y: sy };
  pts[pts.length - 1] = { x: tx, y: ty };
  return pointsToCubicPath(pts);
}

function edgeSpawn(
  edge: BoltDef['edge'],
  t: number,
  w: number,
  h: number,
): { x: number; y: number } {
  const pad = 36;
  switch (edge) {
    case 'top':
      return { x: t * w, y: -pad };
    case 'right':
      return { x: w + pad, y: t * h };
    case 'bottom':
      return { x: t * w, y: h + pad };
    case 'left':
    default:
      return { x: -pad, y: t * h };
  }
}

function BoltGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ display: 'block' }}
    >
      <path
        d="M13.2 1.5 6.4 13.1h4.3L9.1 22.5l9.2-13.4h-4.6L13.2 1.5Z"
        fill={color}
      />
    </svg>
  );
}

type FlyingBolt = BoltDef & { pathD: string };

export default function AppVersionBadge() {
  const { developMode } = useGlobalStyle();
  const labelRef = useRef<HTMLSpanElement>(null);
  const timersRef = useRef<number[]>([]);
  const [celebrate, setCelebrate] = useState(false);
  const [digitFlip, setDigitFlip] = useState(false);
  const [settled, setSettled] = useState(false);
  const [bolts, setBolts] = useState<FlyingBolt[] | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [playId, setPlayId] = useState(0);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const stopCelebration = useCallback(
    (persistSeen: boolean) => {
      clearTimers();
      if (persistSeen) {
        try {
          localStorage.setItem(APP_VERSION_SEEN_KEY, APP_VERSION);
        } catch {
          /* ignore */
        }
      }
      setCelebrate(false);
      setDigitFlip(false);
      setSettled(false);
      setBolts(null);
      setPortalEl(null);
    },
    [clearTimers],
  );

  const startCelebration = useCallback(
    (persistSeenOnEnd: boolean) => {
      const label = labelRef.current;
      if (!label || typeof document === 'undefined') return;

      clearTimers();
      setDigitFlip(false);
      setSettled(false);

      const textEl =
        label.querySelector<HTMLElement>('[data-volt-version-text]') ?? label;
      const lr = textEl.getBoundingClientRect();
      const tx = lr.left + lr.width / 2;
      const ty = lr.top + lr.height / 2;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const built: FlyingBolt[] = BOLT_DEFS.map((def) => {
        const { x: sx, y: sy } = edgeSpawn(def.edge, def.t, w, h);
        return {
          ...def,
          pathD: buildVortexPathD(sx, sy, tx, ty, def.spin, def.turns),
        };
      });

      setPortalEl(document.body);
      setBolts(built);
      setCelebrate(true);
      setPlayId((n) => n + 1);

      timersRef.current = [
        window.setTimeout(() => setDigitFlip(true), DIGIT_FLIP_AT_MS),
        window.setTimeout(() => {
          setDigitFlip(false);
          setSettled(true);
        }, SETTLE_AT_MS),
        window.setTimeout(
          () => stopCelebration(persistSeenOnEnd),
          CELEBRATE_MS,
        ),
      ];
    },
    [clearTimers, stopCelebration],
  );

  useEffect(() => {
    let cancelled = false;
    try {
      const seen = localStorage.getItem(APP_VERSION_SEEN_KEY);
      if (seen == null) {
        // First ever visit — zapamiętaj wersję bez animacji (jak F6).
        localStorage.setItem(APP_VERSION_SEEN_KEY, APP_VERSION);
        return;
      }
      if (seen === APP_VERSION) return;

      // Nowa APP_VERSION — poczekaj na layout headera, potem celebruj.
      const kick = window.setTimeout(() => {
        if (!cancelled) startCelebration(true);
      }, 180);
      return () => {
        cancelled = true;
        window.clearTimeout(kick);
        stopCelebration(false);
      };
    } catch {
      /* private mode */
    }
    return () => {
      cancelled = true;
      stopCelebration(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only version bump
  }, []);

  const onVersionClick = () => {
    if (!developMode) return;
    startCelebration(false);
  };

  const versionBold = celebrate && !settled;
  const odo = VERSION_ODOMETER;

  return (
    <span
      ref={labelRef}
      role={developMode ? 'button' : undefined}
      tabIndex={developMode ? 0 : undefined}
      onClick={developMode ? onVersionClick : undefined}
      onKeyDown={
        developMode
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onVersionClick();
              }
            }
          : undefined
      }
      className={`volt-app-version${celebrate ? ' volt-app-version--celebrate' : ''}${
        developMode ? ' volt-app-version--dev' : ''
      }`}
      title={
        developMode
          ? `Wersja ${APP_VERSION} — kliknij, aby odtworzyć animację`
          : 'Wersja aplikacji'
      }
      style={
        celebrate
          ? {
              transformOrigin: 'left center',
              filter: versionBold
                ? 'drop-shadow(0 0 8px rgba(227,183,96,0.65))'
                : 'none',
              zIndex: 2,
              animation: settled
                ? `volt-ver-shrink 0.4s linear both`
                : `volt-ver-grow ${GROW_MS}ms linear both`,
            }
          : undefined
      }
      aria-label={
        celebrate
          ? `Nowa wersja ${APP_VERSION}`
          : developMode
            ? `Wersja ${APP_VERSION} — kliknij, aby odtworzyć animację`
            : undefined
      }
    >
      {celebrate && (
        <style>{`
          @keyframes volt-ver-grow {
            from { transform: scale(1); }
            to { transform: scale(${BOLT_GROW_SCALE}); }
          }
          @keyframes volt-ver-shrink {
            from { transform: scale(${BOLT_GROW_SCALE}); }
            to { transform: scale(1); }
          }
        `}</style>
      )}

      {celebrate &&
        bolts &&
        portalEl &&
        createPortal(
          <div className="pointer-events-none fixed inset-0 z-[9999] overflow-visible">
            <style>{`
              @keyframes volt-ver-vortex {
                0% {
                  offset-distance: 0%;
                  opacity: 0;
                  transform: translate(-50%, -50%) scale(0) rotate(0deg);
                }
                6% {
                  offset-distance: 3%;
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(1.25) rotate(35deg);
                }
                25% {
                  offset-distance: 22%;
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(1.15) rotate(160deg);
                }
                50% {
                  offset-distance: 50%;
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(1.05) rotate(360deg);
                }
                75% {
                  offset-distance: 78%;
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(0.9) rotate(560deg);
                }
                92% {
                  offset-distance: 95%;
                  opacity: 0.65;
                  transform: translate(-50%, -50%) scale(0.35) rotate(700deg);
                }
                100% {
                  offset-distance: 100%;
                  opacity: 0;
                  transform: translate(-50%, -50%) scale(0) rotate(780deg);
                }
              }
            `}</style>
            {bolts.map((bolt) => {
              const boltStyle = {
                position: 'absolute',
                left: 0,
                top: 0,
                filter: `drop-shadow(0 0 6px ${bolt.glow})`,
                offsetPath: `path('${bolt.pathD}')`,
                offsetRotate: '0deg',
                offsetAnchor: '0 0',
                animation: `volt-ver-vortex ${BOLT_ANIM_S}s linear ${bolt.delay}s both`,
                willChange: 'offset-distance, transform, opacity',
              } as CSSProperties;
              return (
                <span
                  key={`${playId}-${bolt.id}`}
                  style={boltStyle}
                  aria-hidden
                >
                  <BoltGlyph size={bolt.size} color={bolt.color} />
                </span>
              );
            })}
          </div>,
          portalEl,
        )}

      <span
        data-volt-version-text
        className="relative z-[1] inline-flex max-w-full items-center"
      >
        {celebrate && odo ? (
          <>
            <span>{odo.prefix}</span>
            <span
              className="relative inline-block overflow-hidden align-bottom"
              style={{
                height: '1.15em',
                width: `${odo.toDigits.length}ch`,
                verticalAlign: 'bottom',
              }}
              aria-hidden
            >
              <span
                className="absolute left-0 top-0 flex w-full flex-col"
                style={{
                  transform:
                    digitFlip || settled ? 'translateY(-50%)' : 'translateY(0)',
                  transition: digitFlip
                    ? `transform ${DIGIT_FLIP_MS}ms cubic-bezier(0.22, 0.82, 0.28, 1)`
                    : 'none',
                }}
              >
                <span
                  className="flex items-center justify-center leading-none"
                  style={{ height: '1.15em' }}
                >
                  {odo.fromDigits}
                </span>
                <span
                  className="flex items-center justify-center leading-none"
                  style={{ height: '1.15em' }}
                >
                  {odo.toDigits}
                </span>
              </span>
            </span>
          </>
        ) : (
          APP_VERSION
        )}
      </span>
    </span>
  );
}
