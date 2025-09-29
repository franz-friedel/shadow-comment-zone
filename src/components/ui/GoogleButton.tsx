// src/components/GoogleButton.tsx (or inside your Auth page)
import { supabase } from "@/integrations/supabase/client"; // correct path

export function GoogleButton() {
  return (
    <button
      type="button" // important: not "submit"
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            // Optional, but recommended to force production domain after login:
            redirectTo: "https://shadowcomment.com",
          },
        })
      }
      className="w-full rounded-md py-3 font-medium border flex items-center justify-center gap-2"
    >
      Continue with Google
    </button>
  );
}
