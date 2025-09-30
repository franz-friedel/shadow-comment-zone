import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Exchanging authorization code…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const oauthError = url.searchParams.get("error");
      const code = url.searchParams.get("code");

      if (oauthError) {
        setError(`OAuth error: ${oauthError}`);
        setStatus("Redirecting to /auth …");
        setTimeout(() => navigate("/auth", { replace: true }), 1200);
        return;
      }

      if (!code) {
        setError("Missing authorization code.");
        setStatus("Returning to /auth …");
        setTimeout(() => navigate("/auth", { replace: true }), 1500);
        return;
      }

      try {
        setStatus("Performing code exchange …");
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setError(`exchangeCodeForSession failed: ${exErr.message}`);
          setStatus("Returning to /auth …");
          setTimeout(() => navigate("/auth", { replace: true }), 1800);
          return;
        }
      } catch (e: any) {
        setError(`Unexpected exchange failure: ${e?.message || "unknown"}`);
        setStatus("Returning to /auth …");
        setTimeout(() => navigate("/auth", { replace: true }), 1800);
        return;
      }

      // Confirm session with retries (handles slow storage propagation)
      setStatus("Verifying session …");
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setStatus("Session established. Redirecting …");
          setTimeout(() => navigate("/", { replace: true }), 300);
          return;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      setError("Session not established after exchange (timeout).");
      setStatus("Returning to /auth …");
      setTimeout(() => navigate("/auth", { replace: true }), 1800);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-sm">
      <div className="space-y-3 text-center max-w-sm px-4">
        <p className="font-medium">{status}</p>
        {error && (
          <div className="text-red-500 whitespace-pre-wrap break-words text-xs border border-red-500/30 rounded p-2 bg-red-500/5">
            {error}
          </div>
        )}
        {!error && (
          <p className="text-muted-foreground text-xs">
            If this takes longer than a few seconds you can refresh this page safely.
          </p>
        )}
      </div>
    </div>
  );
}
