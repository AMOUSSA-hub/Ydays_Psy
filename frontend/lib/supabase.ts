import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env';

/**
 * Le client Supabase n'est instancié que dans un environnement disposant d'un
 * `WebSocket` global (navigateur, React Native natif).
 *
 * Pendant le rendu statique d'Expo Router pour le web (exécuté dans Node < 22,
 * sans WebSocket natif), le client Realtime de Supabase lève une erreur à la
 * construction. On renvoie alors `null` : la page pré-rendue est une simple
 * coquille HTML, et le vrai client est créé côté navigateur lors de l'hydratation.
 */
const canUseSupabase = HAS_SUPABASE && typeof WebSocket !== 'undefined';

export const supabase = canUseSupabase
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
