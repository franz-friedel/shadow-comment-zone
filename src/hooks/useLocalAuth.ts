import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface UseLocalAuthState {
  user: User | null;
  loading: boolean;
}

export function useLocalAuth() {
  const [state, setState] = useState<UseLocalAuthState>({
    user: null,
    loading: true,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('shadow-comments-user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setState({ user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      setState({ user: null, loading: false });
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      // Simple validation
      if (!email || !password) {
        return {
          data: null,
          error: new Error('Email and password are required'),
        };
      }

      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('shadow-comments-users') || '[]');
      const existingUser = existingUsers.find((u: any) => u.email === email);
      
      if (existingUser) {
        return {
          data: null,
          error: new Error('User already exists with this email'),
        };
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: name || email.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      };

      // Save user to localStorage
      existingUsers.push(newUser);
      localStorage.setItem('shadow-comments-users', JSON.stringify(existingUsers));
      localStorage.setItem('shadow-comments-user', JSON.stringify(newUser));

      setState({ user: newUser, loading: false });

      return {
        data: { user: newUser },
        error: null,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Sign up failed'),
      };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      // Simple validation
      if (!email || !password) {
        return {
          data: null,
          error: new Error('Email and password are required'),
        };
      }

      // Check if user exists
      const existingUsers = JSON.parse(localStorage.getItem('shadow-comments-users') || '[]');
      const user = existingUsers.find((u: any) => u.email === email);
      
      if (!user) {
        return {
          data: null,
          error: new Error('User not found'),
        };
      }

      // Save current user
      localStorage.setItem('shadow-comments-user', JSON.stringify(user));
      setState({ user, loading: false });

      return {
        data: { user },
        error: null,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem('shadow-comments-user');
      setState({ user: null, loading: false });
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error instanceof Error ? error : new Error('Sign out failed') };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      // Simulate Google sign in with a demo user
      const demoUser: User = {
        id: `google_user_${Date.now()}`,
        email: 'demo@google.com',
        name: 'Google User',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=google',
      };

      // Save current user
      localStorage.setItem('shadow-comments-user', JSON.stringify(demoUser));
      setState({ user: demoUser, loading: false });

      return {
        data: { user: demoUser },
        error: null,
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Google sign in failed'),
      };
    }
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };
}
