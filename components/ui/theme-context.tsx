import { palettes, type Palette } from '@/constants/theme';
import Storage from 'expo-sqlite/kv-store';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Scheme = 'light' | 'dark';

const KEY = 'theme-scheme';

const ThemeCtx = createContext<{ scheme: Scheme; setScheme: (s: Scheme) => void }>({
  scheme: 'dark',
  setScheme: () => {},
});

// Read synchronously at startup so the first frame renders in the right scheme.
function initialScheme(): Scheme {
  try {
    const v = Storage.getItemSync(KEY);
    return v === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<Scheme>(initialScheme);
  const setScheme = useCallback((s: Scheme) => {
    setSchemeState(s);
    Storage.setItemAsync(KEY, s).catch(() => {});
  }, []);
  const value = useMemo(() => ({ scheme, setScheme }), [scheme, setScheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useScheme() {
  return useContext(ThemeCtx);
}

export function useColors(): Palette {
  return palettes[useContext(ThemeCtx).scheme];
}

// Themed StyleSheet factory — recomputes only when the scheme flips.
export function useThemedStyles<T>(factory: (c: Palette) => T): T {
  const c = useColors();
  return useMemo(() => factory(c), [c, factory]);
}
