// src/components/GoogleButton.tsx (or inside your Auth page)
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client"; // correct path
import { useState } from "react";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) {
      console.error("[Google OAuth] Supabase not configured.");
      alert("Auth not configured yet. Check env variables.");
      return;
    }
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) {
        console.error("[Google OAuth] error", error);
        alert("Google sign-in failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogle}
      disabled={loading || !isSupabaseConfigured}
      className="w-full rounded-md py-3 font-medium border flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {loading ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
