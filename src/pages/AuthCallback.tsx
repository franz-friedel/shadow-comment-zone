import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    let poll: number;
    let timeout: number;
    const finish = () => {
      if (done.current) return;
      done.current = true;
      navigate('/', { replace: true });
    };

    // Primary listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user) finish();
    });

    // Immediate attempt
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) finish();
    });

    // Poll fallback (handles storage race)
    poll = window.setInterval(async () => {
      if (done.current) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) finish();
    }, 400);

    // Hard timeout (redirect anyway)
    timeout = window.setTimeout(finish, 6000);

    return () => {
      subscription.unsubscribe();
      clearInterval(poll);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
      <div className="space-y-2 text-center">
        <div className="animate-pulse">Finalizing sign-in…</div>
        <div className="text-xs opacity-70">If it stalls, refresh this page.</div>
      </div>
    </div>
  );
};

export default AuthCallback;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");

      if (error) {
        console.error("OAuth error:", error);
        navigate("/auth");
        return;
      }

      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          console.error("exchangeCodeForSession error:", exErr.message);
          navigate("/auth");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      console.log("Session after exchange:", !!data.session);
      navigate("/");
    })();
  }, [navigate]);

  return <div className="p-4">Signing you in…</div>;
}
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [navigate, setUser, setSession]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign-in...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Sign-in Failed</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2">Sign-in Successful!</h2>
        <p className="text-muted-foreground">Redirecting to the app...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
