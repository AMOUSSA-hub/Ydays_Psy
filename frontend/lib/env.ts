import Constants from 'expo-constants';

function getExtra(key: string): string | undefined {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return extra?.[key];
}

/** URL de base de l'API backend (Node/Express). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? getExtra('apiUrl') ?? 'http://localhost:4000';

/** Supabase project URL */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? getExtra('supabaseUrl') ?? '';

/** Supabase anon (public) key */
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? getExtra('supabaseAnonKey') ?? '';

/** Use only AsyncStorage-backed store (no Supabase sync) */
export const USE_LOCAL_ONLY =
  process.env.EXPO_PUBLIC_USE_LOCAL_ONLY === 'true' ||
  (!SUPABASE_URL || !SUPABASE_ANON_KEY);

export const HAS_SUPABASE =
  !USE_LOCAL_ONLY && Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
