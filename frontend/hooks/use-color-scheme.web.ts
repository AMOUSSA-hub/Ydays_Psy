import { useResolvedColorScheme } from '@/contexts/theme-preference-context';
import { useEffect, useState } from 'react';

/**
 * Évite le mismatch SSR/hydratation sur web : premier rendu light, puis schème résolu.
 */
export function useColorScheme() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  const scheme = useResolvedColorScheme();
  if (!hydrated) return 'light';
  return scheme;
}
