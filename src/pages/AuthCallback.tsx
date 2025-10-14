import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing Google sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("AuthCallback: Starting callback handling");
        
        // Get the current URL and check for OAuth parameters
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");
        
        console.log("AuthCallback: URL params", { code: !!code, error: errorParam });
        
        if (errorParam) {
          console.error("OAuth error:", errorParam);
          setError(`OAuth error: ${errorParam}`);
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
          console.log("AuthCallback: Session found, redirecting to home");
          setStatus("Sign-in successful! Redirecting...");
          setTimeout(() => navigate("/"), 1000);
        } else {
          console.log("AuthCallback: No session found, trying to exchange code");
          
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
              console.log("AuthCallback: Code exchanged successfully");
              setStatus("Sign-in successful! Redirecting...");
              setTimeout(() => navigate("/"), 1000);
            } else {
              console.error("AuthCallback: No session after code exchange");
              setError("Failed to complete sign-in");
              setTimeout(() => navigate("/auth"), 3000);
            }
          } else {
            console.error("AuthCallback: No code parameter found");
            setError("No authorization code received");
            setTimeout(() => navigate("/auth"), 3000);
          }
        }
      } catch (err) {
        console.error("AuthCallback: Unexpected error:", err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setTimeout(() => navigate("/auth"), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-lg font-medium mb-2">{status}</div>
        {error && (
          <div className="text-red-500 mb-4">
            <div className="font-medium">Error:</div>
            <div className="text-sm">{error}</div>
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          If you're not redirected automatically, <a href="/" className="text-primary underline">click here</a>
        </div>
      </div>
    </div>
  );
}