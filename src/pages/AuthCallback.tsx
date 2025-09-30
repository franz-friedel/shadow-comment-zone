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

      const { data } = await supabase.auth.getSession();
      console.log("Session after exchange:", !!data.session);
      navigate("/", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
      <div className="space-y-2 text-center">
        <div className="animate-pulse">Signing you in…</div>
        <div className="text-xs opacity-70">If this stalls, refresh.</div>
      </div>
    </div>
  );
}
