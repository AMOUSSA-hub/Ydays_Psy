import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Fond principal type Figma : lavande clair en mode jour,
 * lavande profonde (jamais noir pur) en mode nuit.
 */
export function useAppBackgroundClass() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'bg-[#4a4370]' : 'bg-lavender-200';
}
