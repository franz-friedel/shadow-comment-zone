import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: any | null }>;
  authReset: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  authReset: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps { children: ReactNode }

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Purge any legacy mock artifacts once
  useEffect(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('session');
    } catch {}
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setAuthError('Supabase auth not configured.');
      return;
    }
    const sub = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => sub.data.subscription.unsubscribe();
  }, []);

  const authReset = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') || k.includes('supabase'))
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
    setUser(null);
    setSession(null);
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      setAuthError('Auth not configured.');
      return;
    }
    setAuthError(null);
    setLoading(true);
    try {
      await supabase.auth.signOut().catch(() => {});
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            include_granted_scopes: 'true',
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        setLoading(false);
      }
    } catch (e: any) {
      setAuthError(e?.message || 'Google sign-in failed.');
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setAuthError(error.message);
    } finally {
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: new Error('Auth not configured.') };
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) return { error: new Error('Auth not configured.') };
    setAuthError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) setAuthError(error.message);
    if (data?.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    return { error };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    authError,
    signInWithGoogle,
    signOut,
    signInWithEmail,
    signUpWithEmail,
    authReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};