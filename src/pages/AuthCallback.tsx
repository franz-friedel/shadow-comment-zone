import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing Google sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Simple error boundary - catch any errors immediately
        console.log("AuthCallback: Starting callback handling");
        
        // Get URL parameters first
        let url;
        try {
          url = new URL(window.location.href);
        } catch (urlError) {
          console.error("Invalid URL:", urlError);
          setError("Invalid callback URL");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }
        
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        
        console.log("OAuth params:", { 
          hasCode: !!code, 
          error: errorParam, 
          description: errorDescription 
        });
        
        // Handle OAuth errors first
        if (errorParam) {
          console.error("OAuth error detected:", errorParam, errorDescription);
          setError(`OAuth error: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`);
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }

        // Check environment variables
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("Missing environment variables");
          setError("Authentication service not configured");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Try to load Supabase client with better error handling
        let supabase;
        try {
          // Use a more robust import approach
          const module = await import("@/integrations/supabase/client");
          if (!module.supabase) {
            throw new Error("Supabase client not exported");
          }
          supabase = module.supabase;
          console.log("Supabase client loaded successfully");
        } catch (importError) {
          console.error("Failed to import Supabase:", importError);
          setError("Authentication service unavailable");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        setStatus("Completing sign-in...");
        
        // Try to get session
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Session error:", sessionError);
            setError(`Session error: ${sessionError.message}`);
            setTimeout(() => navigate("/auth"), 3000);
            return;
          }
          
          if (sessionData.session) {
            console.log("Session found, redirecting");
            setStatus("Sign-in successful! Redirecting...");
            setTimeout(() => navigate("/"), 1000);
            return;
          }
        } catch (sessionError) {
          console.error("Session check failed:", sessionError);
          setError("Failed to verify session");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Try code exchange if no session
        if (code) {
          try {
            console.log("Attempting code exchange");
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error("Code exchange error:", exchangeError);
              setError(`Code exchange failed: ${exchangeError.message}`);
              setTimeout(() => navigate("/auth"), 3000);
              return;
            }
            
            if (exchangeData.session) {
              console.log("Code exchange successful");
              setStatus("Sign-in successful! Redirecting...");
              setTimeout(() => navigate("/"), 1000);
              return;
            }
          } catch (exchangeError) {
            console.error("Code exchange failed:", exchangeError);
            setError("Failed to exchange authorization code");
            setTimeout(() => navigate("/auth"), 3000);
            return;
          }
        }

        // If we get here, something went wrong
        console.error("No session found and no code to exchange");
        setError("Sign-in incomplete - no session or code found");
        setTimeout(() => navigate("/auth"), 3000);
        
      } catch (err) {
        console.error("AuthCallback: Critical error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Critical error: ${errorMessage}`);
        setTimeout(() => navigate("/auth"), 5000);
      }
    };

    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="text-lg font-medium">{status}</div>
        
        {error && (
          <div className="text-red-500 space-y-2">
            <div className="font-medium">Error:</div>
            <div className="text-sm break-words">{error}</div>
            
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
      </div>
    </div>
  );
}