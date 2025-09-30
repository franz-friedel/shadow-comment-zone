/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const anon =
  (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

if (!url || !anon) {
  console.error("[Supabase] Missing env vars", { urlPresent: !!url, anonPresent: !!anon });
  throw new Error("Supabase env vars missing.");
}

export const isSupabaseConfigured = true;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Simple debug exposure (optional)
;(window as any).__SUPABASE_INFO__ = {
  url,
  anonKeyPrefix: anon.slice(0, 8),
};
  !!url &&
  !!key &&
  url.startsWith("https://") &&
  url.includes(".supabase.co") &&
  key.length > 20;

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
