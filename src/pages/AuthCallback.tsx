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

      navigate("/");
    })();
  }, [navigate]);

  return <div className="p-4">Signing you in…</div>;
}
