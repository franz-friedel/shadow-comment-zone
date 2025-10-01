/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Helper: check if Supabase is configured
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Stub implementation for Supabase (minimal, extend as needed)
function createStub() {
  return {
    auth: {
      signOut: async () => { },
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
  };
}

let supabaseImpl: ReturnType<typeof createClient> | ReturnType<typeof createStub>;

// Use the env variables directly for url/key
const url = supabaseUrl;
const key = supabaseAnonKey;
const rawUrl = supabaseUrl;
const rawKey = supabaseAnonKey;

if (isSupabaseConfigured) {
  try {
    supabaseImpl = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    console.info("[Supabase] Initialized (resolved env).");
    if (typeof window !== "undefined") (window as any).__SUPABASE_STUB__ = false;
  } catch (e) {
    console.error("[Supabase] Initialization failed; falling back to stub.", e);
    supabaseImpl = createStub();
  }
} else {
  // Only fall back if BOTH missing (not just key fallback)
  if (!rawUrl && !rawKey) {
    supabaseImpl = createStub();
  } else {
    // Force initialization anyway with resolved values (avoid stub)
    console.warn("[Supabase] Proceeding with fallback values.");
    try {
      supabaseImpl = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      });
      if (typeof window !== "undefined") (window as any).__SUPABASE_STUB__ = false;
    } catch (e) {
      console.error("[Supabase] Fallback init failed; using stub.", e);
      supabaseImpl = createStub();
    }
  }
}

// Auto-exchange OAuth code even if /auth/callback was skipped
if (typeof window !== "undefined") {
  (async () => {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const err = url.searchParams.get("error");
      if (code && !err) {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!exErr) {
            // Clean URL
            url.searchParams.delete("code");
            url.searchParams.delete("scope");
            url.searchParams.delete("auth_type");
            window.history.replaceState({}, document.title, url.origin + url.pathname + url.hash);
            window.dispatchEvent(new CustomEvent("supabase-auth-exchanged"));
          } else {
            console.error("[Supabase AutoExchange] Failed:", exErr.message);
          }
        }
      }
    } catch (e) {
      console.error("[Supabase AutoExchange] Exception", e);
    }
  })();
}

// Optional: global listener re-dispatch (if not already done elsewhere)
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((evt, session) => {
    window.dispatchEvent(
      new CustomEvent("supabase-auth", { detail: { event: evt, hasUser: !!session?.user } })
    );
  });
}

export const supabase = supabaseImpl;
export { isSupabaseConfigured };

// Diagnostics (optional)
if (typeof window !== "undefined") {
  (window as any).__SUPABASE_INFO__ = { url: supabaseUrl, anonKeyPrefix: supabaseAnonKey.slice(0, 8), ts: Date.now() };
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("[Supabase AuthState]", event, "user?", !!session?.user);
    (window as any).__LAST_AUTH_EVENT__ = { event, hasUser: !!session?.user, at: Date.now() };
  });
  (window as any).forceSessionCheck = async (): Promise<any | null> => {
    const { data } = await supabase.auth.getSession();
    console.log("[forceSessionCheck] user?", !!data.session?.user);
    return data.session;
  };
}

// Force removal of any cached session (for stuck / always-same-user cases)
export async function forceAuthReset() {
  try {
    await supabase.auth.signOut().catch(() => { });
  } catch { }
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.includes("supabase"))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { }
  try {
    sessionStorage.clear();
  } catch { }
  console.info("[Supabase] Auth reset executed.");
  if (typeof window !== "undefined") (window as any).__SUPABASE_LAST_RESET__ = Date.now();
}

// Expose quick debug helper
if (typeof window !== "undefined") {
  (window as any).forceAuthReset = forceAuthReset;
}

// Ensure we have the latest session (optional helper)
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
