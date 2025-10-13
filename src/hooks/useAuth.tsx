import { createContext, ReactNode, useContext } from "react";
import { useLocalAuth } from "./useLocalAuth";

interface AuthContextShape {
  user: any;
  session: any;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextShape | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const localAuth = useLocalAuth();

  const contextValue: AuthContextShape = {
    user: localAuth.user,
    session: localAuth.user ? { user: localAuth.user } : null,
    loading: localAuth.loading,
    signInWithEmail: localAuth.signIn,
    signUpWithEmail: localAuth.signUp,
    signOut: localAuth.signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}