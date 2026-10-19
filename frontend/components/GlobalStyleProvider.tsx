'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ThemeMode = 'dark' | 'light';

type GlobalStyleContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  /** Jak F6 Navbar — tryb deweloperski (replay animacji wersji itd.). */
  developMode: boolean;
  setDevelopMode: (on: boolean) => void;
  toggleDevelopMode: () => void;
};

const STORAGE_KEY = 'volt-theme';
const DEVELOP_MODE_KEY = 'volt-develop-mode';

const GlobalStyleContext = createContext<GlobalStyleContextValue | null>(null);

function applyThemeClass(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle('light', mode === 'light');
  root.classList.toggle('dark', mode === 'dark');
}

export function GlobalStyleProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [developMode, setDevelopModeState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode =
      stored === 'light' || stored === 'dark' ? stored : 'dark';
    setThemeState(initial);
    applyThemeClass(initial);
    setDevelopModeState(window.localStorage.getItem(DEVELOP_MODE_KEY) === '1');
    setReady(true);
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyThemeClass(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const setDevelopMode = useCallback((on: boolean) => {
    setDevelopModeState(on);
    try {
      window.localStorage.setItem(DEVELOP_MODE_KEY, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDevelopMode = useCallback(() => {
    setDevelopMode(!developMode);
  }, [developMode, setDevelopMode]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      developMode,
      setDevelopMode,
      toggleDevelopMode,
    }),
    [theme, toggleTheme, setTheme, developMode, setDevelopMode, toggleDevelopMode]
  );

  return (
    <GlobalStyleContext.Provider value={value}>
      <div
        className="volt-page"
        data-theme={theme}
        style={{ opacity: ready ? 1 : undefined }}
      >
        {children}
      </div>
    </GlobalStyleContext.Provider>
  );
}

export function useGlobalStyle() {
  const ctx = useContext(GlobalStyleContext);
  if (!ctx) {
    throw new Error('useGlobalStyle must be used within GlobalStyleProvider');
  }
  return ctx;
}
