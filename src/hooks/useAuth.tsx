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
  const [authProcessing, setAuthProcessing] = useState(false);
  const redirectBase = import.meta.env.VITE_SUPABASE_REDIRECT_URL || `${window.location.origin}/`;

  // Purge any legacy mock artifacts once
  useEffect(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('session');
    } catch {}
  }, []);

  // Parse and surface OAuth errors in the callback URL (?error=... or hash)
  useEffect(() => {
    const parseErrorParams = (s: string) => {
      const p = new URLSearchParams(s);
      const error = p.get('error') || p.get('error_code');
      const desc = p.get('error_description');
      return error ? decodeURIComponent(desc || error) : null;
    };

    const searchErr = parseErrorParams(window.location.search);
    const hashErr = window.location.hash.includes('error')
      ? parseErrorParams(window.location.hash.replace(/^#/, ''))
      : null;

    const finalErr = searchErr || hashErr;
    if (finalErr) {
      setAuthError(`OAuth Error: ${finalErr}`);
      // Clean URL (remove sensitive/error params)
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      console.warn('[Auth] OAuth error detected:', finalErr);
    }
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
    setAuthProcessing(false);
  }, []);

  const signInWithGoogle = async () => {
    if (authProcessing) return;
    if (!isSupabaseConfigured) {
      setAuthError('Auth not configured.');
      return;
    }
    setAuthError(null);
    setAuthProcessing(true);
    // Do NOT signOut here – it breaks the PKCE verifier that Supabase stores
    try {
      console.info('[Auth] Starting Google OAuth', { redirectTo: redirectBase });
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectBase,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
            include_granted_scopes: 'true',
          },
        },
      });
      if (error) {
        console.error('[Auth] OAuth init error:', error);
        setAuthError(error.message);
        setAuthProcessing(false);
      }
      // On success browser navigates; listener updates state after redirect.
    } catch (e: any) {
      console.error('[Auth] OAuth exception:', e);
      setAuthError(e?.message || 'Google sign-in failed.');
      setAuthProcessing(false);
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
    if