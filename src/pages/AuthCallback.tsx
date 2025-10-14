import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing Google sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check environment variables first
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        console.log("Environment check:", { 
          url: supabaseUrl ? "present" : "missing", 
          key: supabaseKey ? "present" : "missing" 
        });
        
        if (!supabaseUrl || !supabaseKey) {
          console.error("Missing Supabase environment variables");
          setError("Missing Supabase configuration - check environment variables");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Get the current URL and check for OAuth parameters
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");
        
        console.log("OAuth callback params:", { 
          code: code ? "present" : "missing", 
          error: errorParam || "none",
          description: errorDescription || "none"
        });
        
        if (errorParam) {
          console.error("OAuth error:", errorParam, errorDescription);
          setError(`OAuth error: ${errorParam}${errorDescription ? ` - ${errorDescription}` : ''}`);
          
          setTimeout(() => navigate("/auth"), 5000);
          return;
        }

        // Import Supabase client dynamically to avoid potential build issues
        let supabase;
        try {
          const supabaseModule = await import("@/integrations/supabase/client");
          supabase = supabaseModule.supabase;
          console.log("Supabase client loaded successfully");
        } catch (clientError) {
          console.error("Failed to load Supabase client:", clientError);
          setError("Failed to initialize authentication client");
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Wait a moment for Supabase to process the session
        setStatus("Completing sign-in...");
        
        // Check for session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(`Session error: ${sessionError.message}`);
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }
        
        if (sessionData.session) {
          console.log("Session found, redirecting to home");
          setStatus("Sign-in successful! Redirecting...");
          setTimeout(() => navigate("/"), 1000);
        } else {
          console.log("No session found, trying to exchange code");
          
          if (code) {
            // Try to exchange the code for a session
            const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error("Code exchange error:", exchangeError);
              setError(`Code exchange error: ${exchangeError.message}`);
              setTimeout(() => navigate("/auth"), 3000);
              return;
            }
            
            if (exchangeData.session) {
              console.log("Code exchanged successfully");
              setStatus("Sign-in successful! Redirecting...");
              setTimeout(() => navigate("/"), 1000);
            } else {
              console.error("No session after code exchange");
              setError("Failed to complete sign-in");
              setTimeout(() => navigate("/auth"), 3000);
            }
          } else {
            console.error("No code parameter found");
            setError("No authorization code received");
            setTimeout(() => navigate("/auth"), 3000);
          }
        }
      } catch (err) {
        console.error("AuthCallback: Unexpected error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Unexpected error: ${errorMessage}`);
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
      </div>
    </div>
  );
}