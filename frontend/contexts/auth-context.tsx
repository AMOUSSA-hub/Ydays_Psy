import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { HAS_SUPABASE } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { randomUuid } from '@/lib/uuid';

const LOCAL_USER_KEY = 'ydays_auth_local_user_id';
const LOCAL_ACCOUNTS_KEY = 'ydays_auth_local_accounts'; // For simple local "registration"

export type AppUser = {
  id: string;
  email?: string | null;
  isAnonymous: boolean;
};

type AuthContextValue = {
  user: AppUser | null;
  session: Session | null;
  initialized: boolean;
  signInAnonymous: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function getOrCreateLocalUserId(): Promise<string> {
  let id = await AsyncStorage.getItem(LOCAL_USER_KEY);
  if (!id) {
    id = randomUuid();
    await AsyncStorage.setItem(LOCAL_USER_KEY, id);
  }
  return id;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | undefined;

    async function init() {
      if (HAS_SUPABASE && supabase) {
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, next) => {
          setSession(next);
        });
        unsub = subscription;
      } else {
        const id = await AsyncStorage.getItem(LOCAL_USER_KEY);
        setLocalUserId(id);
      }
      setInitialized(true);
    }

    init();
    return () => unsub?.unsubscribe();
  }, []);

  const user: AppUser | null = useMemo(() => {
    if (HAS_SUPABASE && session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        isAnonymous: session.user.is_anonymous === true,
      };
    }
    if (localUserId) {
      return { id: localUserId, isAnonymous: true };
    }
    return null;
  }, [session, localUserId]);

  const signInAnonymous = useCallback(async () => {
    if (HAS_SUPABASE && supabase) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return;
    }
    const id = await getOrCreateLocalUserId();
    setLocalUserId(id);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (HAS_SUPABASE && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ?? null };
    }
    
    // Local fallback
    const accountsRaw = await AsyncStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const accounts = accountsRaw ? JSON.parse(accountsRaw) : {};
    if (accounts[email] && accounts[email].password === password) {
      const id = accounts[email].id;
      await AsyncStorage.setItem(LOCAL_USER_KEY, id);
      setLocalUserId(id);
      return { error: null };
    }
    return { error: new Error('Email ou mot de passe incorrect.') };
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    if (HAS_SUPABASE && supabase) {
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error ?? null };
    }

    // Local fallback
    const accountsRaw = await AsyncStorage.getItem(LOCAL_ACCOUNTS_KEY);
    const accounts = accountsRaw ? JSON.parse(accountsRaw) : {};
    if (accounts[email]) {
      return { error: new Error('Ce compte existe déjà localement.') };
    }
    const newId = randomUuid();
    accounts[email] = { id: newId, password };
    await AsyncStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    
    // Automatically sign in
    await AsyncStorage.setItem(LOCAL_USER_KEY, newId);
    setLocalUserId(newId);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (HAS_SUPABASE && supabase) {
      await supabase.auth.signOut();
      setSession(null);
    }
    await AsyncStorage.removeItem(LOCAL_USER_KEY);
    setLocalUserId(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      initialized,
      signInAnonymous,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [
      user,
      session,
      initialized,
      signInAnonymous,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

