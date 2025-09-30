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
      const { data: listener } = supabase.auth.onAuthStateChange((_evt, session) => {
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
            setStatus("Manual code exchange attempt…");
            console.log("[AuthCallback] Manual exchange fallback starting.");
            exchanged.current = true;
            const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
            if (exErr) {
              console.error("[AuthCallback] Manual exchange failed:", exErr.message);
              setError("Manual exchange failed: " + exErr.message);
              setStatus("Returning to /auth …");
              cleanup();
              setTimeout(() => navigate("/auth", { replace: true }), 2500);
              return;
            }
            // Check again
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
              console.log("[AuthCallback] Manual exchange success.");
              successRedirect();
            } else {
              setError("Exchange succeeded but no session persisted.");
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
        listener.subscription.unsubscribe();
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
