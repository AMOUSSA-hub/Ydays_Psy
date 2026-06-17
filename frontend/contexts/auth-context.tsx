import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, setToken, clearToken, getToken } from '@/lib/api';

export type AppRole = 'patient' | 'professional';

export type AppUser = {
  id: string;
  email: string;
  role: AppRole;
  display_name: string | null;
  /** Conservé pour compatibilité (plus de mode anonyme avec un vrai backend). */
  isAnonymous: boolean;
};

type ServerUser = {
  id: string;
  email: string;
  role: AppRole;
  display_name: string | null;
  invite_code?: string | null;
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

function toAppUser(u: ServerUser): AppUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    display_name: u.display_name ?? null,
    isAnonymous: false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const token = await getToken();
        if (token) {
          const { user: u } = await api<{ user: ServerUser }>('/auth/me');
          setUser(toAppUser(u));
        }
      } catch {
        // Jeton invalide ou serveur injoignable : on repart déconnecté.
        await clearToken();
        setUser(null);
      } finally {
        setInitialized(true);
      }
    }
    void init();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { token, user: u } = await api<{ token: string; user: ServerUser }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      await setToken(token);
      setUser(toAppUser(u));
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Connexion impossible.') };
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      role: AppRole,
      displayName?: string
    ): Promise<AuthResult> => {
      try {
        const { token, user: u } = await api<{ token: string; user: ServerUser }>('/auth/register', {
          method: 'POST',
          body: { email, password, role, display_name: displayName ?? null },
          auth: false,
        });
        await setToken(token);
        setUser(toAppUser(u));
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error('Inscription impossible.') };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user: u } = await api<{ user: ServerUser }>('/auth/me');
      setUser(toAppUser(u));
    } catch {
      // ignore
    }
  }, []);

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
