/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Fail fast – build/runtime clarity
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// Guard for SSR/build
const storage = typeof window !== "undefined" ? window.localStorage : undefined;

// Re‑enable detectSessionInUrl so Supabase does first attempt automatically
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage,
  },
});

// Diagnostics
if (typeof window !== "undefined") {
  (window as any).__SUPABASE_DEBUG__ = {
    url,
    anonKeyPrefix: key.slice(0, 6),
    ts: Date.now(),
  };
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("[auth:onAuthStateChange]", event, "user?", !!session?.user);
    (window as any).__LAST_AUTH_EVENT__ = { event, hasUser: !!session?.user, at: Date.now() };
  });
  // Utility: call window.forceSessionCheck() in console
  (window as any).forceSessionCheck = async () => {
    const { data } = await supabase.auth.getSession();
    console.log("[forceSessionCheck] session user?", !!data.session?.user, data.session);
    return data.session;
  };
}

// Optional: force an initial session load (non-blocking)
supabase.auth.getSession().catch(() => {});
};

function createStub() {
  const configError = new Error("Supabase not configured.");
  const result = <T = any>(data: T | null = null) => ({ data, error: configError });
  const chain = () => ({
    eq: () => chain(),
    order: () => Promise.resolve(result<any[]>([])),
    maybeSingle: () => Promise.resolve(result(null)),
  });
  const tableApi = {
    select: () => chain(),
    insert: () => Promise.resolve(result()),
    update: () => Promise.resolve(result()),
    delete: () => Promise.resolve(result()),
  };
  const stub = {
    from: () => tableApi,
    auth: {
      signInWithOAuth: async () => ({ data: null, error: configError }),
      signOut: async () => ({ error: configError }),
      getSession: async () => ({ data: { session: null }, error: configError }),
      onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  } as any;
  (window as any).__SUPABASE_STUB__ = true;
  console.warn("[Supabase] Using stub client (both url & key missing).", {
    rawUrl,
    rawKeyPresent: !!rawKey,
  });
  return stub;
}

let supabaseImpl: ReturnType<typeof createClient> | ReturnType<typeof createStub>;

if (isSupabaseConfigured) {
  try {
    supabaseImpl = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    console.info("[Supabase] Initialized (resolved env).");
    (window as any).__SUPABASE_STUB__ = false;
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
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      (window as any).__SUPABASE_STUB__ = false;
    } catch (e) {
      console.error("[Supabase] Fallback init failed; using stub.", e);
      supabaseImpl = createStub();
    }
  }
}

export const supabase = supabaseImpl;
export { isSupabaseConfigured };

// Force removal of any cached session (for stuck / always-same-user cases)
export async function forceAuthReset() {
  try {
    await supabase.auth.signOut().catch(() => {});
  } catch {}
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.includes("supabase"))) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {}
  try {
    sessionStorage.clear();
  } catch {}
  console.info("[Supabase] Auth reset executed.");
  (window as any).__SUPABASE_LAST_RESET__ = Date.now();
}

// Expose quick debug helper
;(window as any).forceAuthReset = forceAuthReset;
// Optional debug (remove after): console.log("[Supabase] Initialized", url);
// Expose quick debug helper
;(window as any).forceAuthReset = forceAuthReset;
// Optional debug (remove after): console.log("[Supabase] Initialized", url);
// Optional debug (remove after): console.log("[Supabase] Initialized", url);
