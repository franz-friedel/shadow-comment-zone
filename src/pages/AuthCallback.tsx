import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing Google sign-in...");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`]);
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        addDebugInfo("Starting OAuth callback handling");
        
        // Get the current URL and check for OAuth parameters
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        
        addDebugInfo(`URL params - code: ${!!code}, error: ${errorParam}, description: ${errorDescription}`);
        
        if (errorParam) {
          addDebugInfo(`OAuth error detected: ${errorParam} - ${errorDescription}`);
          setError(`OAuth error: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`);
          
          // Provide specific guidance based on error type
          if (errorParam === 'server_error') {
            addDebugInfo("Server error typically means Supabase OAuth configuration issue");
          }
          
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }

        // Check Supabase configuration
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        addDebugInfo(`Supabase URL present: ${!!supabaseUrl}`);
        addDebugInfo(`Supabase Key present: ${!!supabaseKey}`);
        
        if (!supabaseUrl || !supabaseKey) {
          addDebugInfo("Missing Supabase environment variables");
          setError("Missing Supabase configuration");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Wait a moment for Supabase to process the session
        setStatus("Completing sign-in...");
        addDebugInfo("Checking for existing session");
        
        // Check for session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          addDebugInfo(`Session error: ${sessionError.message}`);
          setError(`Session error: ${sessionError.message}`);
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }
        
        if (sessionData.session) {
          addDebugInfo("Session found, redirecting to home");
          setStatus("Sign-in successful! Redirecting...");
          setTimeout(() => navigate("/"), 1000);
        } else {
          addDebugInfo("No session found, trying to exchange code");
          
          if (code) {
            // Try to exchange the code for a session
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              addDebugInfo(`Code exchange error: ${exchangeError.message}`);
              setError(`Code exchange error: ${exchangeError.message}`);
              setTimeout(() => navigate("/auth"), 3000);
              return;
            }
            
            if (exchangeData.session) {
              addDebugInfo("Code exchanged successfully");
              setStatus("Sign-in successful! Redirecting...");
              setTimeout(() => navigate("/"), 1000);
            } else {
              addDebugInfo("No session after code exchange");
              setError("Failed to complete sign-in");
              setTimeout(() => navigate("/auth"), 3000);
            }
          } else {
            addDebugInfo("No code parameter found");
            setError("No authorization code received");
            setTimeout(() => navigate("/auth"), 3000);
          }
        }
      } catch (err) {
        addDebugInfo(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error("AuthCallback: Unexpected error:", err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTimeout(() => navigate("/auth"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="text-lg font-medium">{status}</div>
        
        {error && (
          <div className="text-red-500 space-y-2">
            <div className="font-medium">Error:</div>
            <div className="text-sm">{error}</div>
            
            {error.includes("server_error") && (
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <strong>Server Error Fix:</strong><br/>
                1. Check Supabase → Authentication → Providers → Google<br/>
                2. Ensure Client ID and Secret are filled<br/>
                3. Verify redirect URL: https://zsfwcfysslyiemzzvwwg.supabase.co/auth/v1/callback
              </div>
            )}
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          If you're not redirected automatically, <a href="/" className="text-primary underline">click here</a>
        </div>
        
        {debugInfo.length > 0 && (
          <details className="text-xs text-muted-foreground text-left">
            <summary className="cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-2 bg-muted rounded max-h-32 overflow-y-auto">
              {debugInfo.map((info, i) => (
                <div key={i} className="font-mono">{info}</div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}