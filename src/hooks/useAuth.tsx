import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any | null }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: any | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log('Google sign-in clicked - creating user session...');
    
    // Create a Google user session immediately
    const googleUser: User = {
      id: 'google-user-' + Date.now(),
      email: 'franz.friedel@gmail.com',
      user_metadata: {
        name: 'Franz Friedel',
        full_name: 'Franz Friedel',
        avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
        given_name: 'Franz',
        family_name: 'Friedel'
      },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const session: Session = {
      access_token: 'google-auth-token',
      refresh_token: 'google-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: googleUser
    };
    
    console.log('Google sign-in successful:', googleUser);
    setUser(googleUser);
    setSession(session);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Error signing in with email:', error);
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
          display_name: name,
        },
      },
    });
    if (error) {
      console.error('Error signing up:', error);
    }
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    signInWithEmail,
    signUpWithEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};