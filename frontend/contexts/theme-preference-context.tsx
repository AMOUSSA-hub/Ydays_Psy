import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { HAS_SUPABASE } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme as useNWColorScheme } from 'nativewind';

const STORAGE_KEY = 'ydays_theme_preference';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  /** Schème effectif après résolution system */
  resolvedScheme: 'light' | 'dark';
  setPreference: (p: ThemePreference) => Promise<void>;
  loaded: boolean;
};

export const ThemePreferenceContext = createContext<
  ThemePreferenceContextValue | undefined
>(undefined);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const system = useRNColorScheme() ?? 'light';
  const { user, initialized: authReady } = useAuth();
  const [preference, setPrefState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
        setPrefState(stored);
      }
      if (HAS_SUPABASE && supabase && authReady && user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .maybeSingle();
        const tp = data?.theme_preference as ThemePreference | undefined;
        if (!cancelled && tp && (tp === 'light' || tp === 'dark' || tp === 'system')) {
          setPrefState(tp);
          await AsyncStorage.setItem(STORAGE_KEY, tp);
        }
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, user?.id, user?.isAnonymous]);

  const { setColorScheme } = useNWColorScheme();

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  useEffect(() => {
    setColorScheme(resolvedScheme);
  }, [resolvedScheme, setColorScheme]);

  const setPreference = useCallback(
    async (p: ThemePreference) => {
      setPrefState(p);
      await AsyncStorage.setItem(STORAGE_KEY, p);
      if (HAS_SUPABASE && supabase && user?.id) {
        await supabase.from('profiles').upsert({ id: user.id, theme_preference: p });
      }
    },
    [user?.id, user?.isAnonymous]
  );

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
      loaded,
    }),
    [preference, resolvedScheme, setPreference, loaded]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return ctx;
}

/** Schème résolu (fonctionne même si le provider n’est pas encore monté). */
export function useResolvedColorScheme(): 'light' | 'dark' {
  const ctx = useContext(ThemePreferenceContext);
  const system = useRNColorScheme() ?? 'light';
  if (!ctx || !ctx.loaded) return system === 'dark' ? 'dark' : 'light';
  return ctx.resolvedScheme;
}
