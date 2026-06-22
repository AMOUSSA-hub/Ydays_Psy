import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { HAS_SUPABASE } from '@/lib/env';

export type AppRole = 'patient' | 'professional';

export type AppUser = {
  id: string;
  email: string;
  role: AppRole;
  display_name: string | null;
  /** Conservé pour compatibilité (plus de mode anonyme). */
  isAnonymous: boolean;
};

type AuthResult = { error: Error | null };

type AuthContextValue = {
  user: AppUser | null;
  role: AppRole | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    email: string,
    password: string,
    role: AppRole,
    displayName?: string
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  /** Construit l'utilisateur applicatif à partir de la session + du profil. */
  const hydrate = useCallback(async (session: Session | null): Promise<void> => {
    if (!session?.user || !supabase) {
      setUser(null);
      return;
    }
    const authUser = session.user;
    const meta = (authUser.user_metadata ?? {}) as { role?: AppRole; display_name?: string | null };
    let role: AppRole = meta.role === 'professional' ? 'professional' : 'patient';
    let displayName: string | null = meta.display_name ?? null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, display_name')
        .eq('id', authUser.id)
        .maybeSingle();
      if (profile?.role) role = profile.role as AppRole;
      if (profile?.display_name) displayName = profile.display_name;
    } catch {
      // profil pas encore disponible : on garde les métadonnées
    }
    setUser({
      id: authUser.id,
      email: authUser.email ?? '',
      role,
      display_name: displayName,
      isAnonymous: false,
    });
  }, []);

  useEffect(() => {
    if (!HAS_SUPABASE || !supabase) {
      setInitialized(true);
      return;
    }
    let unsub: { unsubscribe: () => void } | undefined;
    (async () => {
      const { data } = await supabase.auth.getSession();
      await hydrate(data.session ?? null);
      setInitialized(true);
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        void hydrate(session);
      });
      unsub = sub.subscription;
    })();
    return () => unsub?.unsubscribe();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: new Error('Supabase non configuré.') };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    await hydrate(data.session ?? null);
    return { error: null };
  }, [hydrate]);

  const register = useCallback(
    async (
      email: string,
      password: string,
      role: AppRole,
      displayName?: string
    ): Promise<AuthResult> => {
      if (!supabase) return { error: new Error('Supabase non configuré.') };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, display_name: displayName ?? null } },
      });
      if (error) return { error };

      // Confirmation d'email désactivée → session immédiate. Sinon, on tente la connexion.
      let session = data.session;
      if (!session) {
        const { data: signIn, error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) {
          return { error: new Error('Compte créé. Confirmez votre email puis connectez-vous.') };
        }
        session = signIn.session;
      }
      await hydrate(session ?? null);
      return { error: null };
    },
    [hydrate]
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    await hydrate(data.session ?? null);
  }, [hydrate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      initialized,
      login,
      register,
      signOut,
      refresh,
    }),
    [user, initialized, login, register, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
