import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        console.error("OAuth error:", error);
        navigate("/auth", { replace: true });
        return;
      }

      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          console.error("exchangeCodeForSession error:", exErr.message);
          navigate("/auth", { replace: true });
          return;
        }
      }

      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}
// --- Remove the old return and move the advanced logic inside useEffect below ---

useEffect(() => {
  (async () => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const errorParam = url.searchParams.get("error");

    if (errorParam) {
      console.error("OAuth error:", errorParam);
      navigate("/auth");
      return;
    }

    // If using PKCE flow, Supabase should handle the session automatically after redirect.
    // If you need to manually check for a session, do so here.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      console.error("No session found after redirect");
      // Continue to advanced logic below instead of returning
    } else {
      console.log("Session after redirect:", !!data.session);
      navigate("/");
      return;
    }

    // Advanced logic for handling session and code exchange
    const listener = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user && !finished.current) {
        console.log("[AuthCallback] Session arrived via listener.");
        successRedirect();
      }
    });

    // Fallback: manual exchange after short delay if code present
    let manualTimer: number | undefined;
    if (code) {
      manualTimer = window.setTimeout(async () => {
        if (exchanged.current || finished.current) return;
        setStatus("Waiting for session…");
        console.log("[AuthCallback] Manual exchange fallback: checking session again.");
        exchanged.current = true;
        // Check again
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          console.log("[AuthCallback] Session found on manual check.");
          successRedirect();
        } else {
          setError("No session found after waiting.");
          setStatus("Returning to /auth …");
          cleanup();
          setTimeout(() => navigate("/auth", { replace: true }), 2500);
        }
      }, 900); // ~1 second
    }

    // Hard timeout
    const timeout = window.setTimeout(async () => {
      if (finished.current) return;
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        successRedirect();
        return;
      }
      setError("Timeout waiting for session.");
      setStatus("Returning to /auth …");
      cleanup();
      setTimeout(() => navigate("/auth", { replace: true }), 2000);
    }, 7000);

    function successRedirect() {
      if (finished.current) return;
      finished.current = true;
      setStatus("Signed in. Redirecting …");
      cleanup();
      // Clean URL (remove code params)
      window.history.replaceState({}, document.title, window.location.origin + "/");
      setTimeout(() => navigate("/", { replace: true }), 300);
    }

    function cleanup() {
      listener.data.subscription.unsubscribe();
      if (manualTimer) clearTimeout(manualTimer);
      clearTimeout(timeout);
    }
  })();
}, [navigate]);

return (
  <div className="min-h-screen flex items-center justify-center bg-background text-sm">
    <div className="space-y-3 text-center max-w-sm px-4">
      <p className="font-medium">{status}</p>
      {error && (
        <div className="text-red-500 text-xs whitespace-pre-wrap break-words border border-red-500/30 rounded p-2 bg-red-500/5">
          {error}
        </div>
      )}
      {!error && (
        <p className="text-muted-foreground text-xs">
          If this does not finish automatically in a few seconds you may refresh safely.
        </p>
      )}
    </div>
  </div>
);
}
