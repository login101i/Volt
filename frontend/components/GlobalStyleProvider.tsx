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
};

const STORAGE_KEY = 'volt-theme';

const GlobalStyleContext = createContext<GlobalStyleContextValue | null>(null);

function applyThemeClass(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle('light', mode === 'light');
  root.classList.toggle('dark', mode === 'dark');
}

export function GlobalStyleProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode =
      stored === 'light' || stored === 'dark' ? stored : 'dark';
    setThemeState(initial);
    applyThemeClass(initial);
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

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme]
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
