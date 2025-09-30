import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This listener is the core of Supabase auth.
    // It fires on initial load and whenever the auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This URL must be whitelisted in your Supabase dashboard
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error.message);
      setLoading(false);
    }
    // On success, Supabase redirects to Google, then back to your app.
    // The onAuthStateChange listener will handle the new session.
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // The onAuthStateChange listener will automatically update user/session to null
  };

  const value = { user, session, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};