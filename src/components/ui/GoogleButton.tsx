// src/components/GoogleButton.tsx (or inside your Auth page)
import { supabase, isSupabaseConfigured, forceAuthReset } from "@/integrations/supabase/client";
import { useState } from "react";

export function GoogleButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    if (!isSupabaseConfigured) {
      alert("Authentication not configured. Check env variables.");
      return;
    }
    setLoading(true);
    try {
      // Hard reset any lingering session so Google always prompts
      await forceAuthReset();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
            include_granted_scopes: "true",
          },
        },
      });
      if (error) {
        console.error("[Google OAuth] signIn error", error);
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
