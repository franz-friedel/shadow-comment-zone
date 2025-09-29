/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

// Normalize env
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const url = (rawUrl || "").trim();
const key = (rawKey || "").trim();

export const isSupabaseConfigured =
  !!url &&
  !!key &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
  key.length > 40;

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
  console.warn("[Supabase] Using stub client (missing/invalid env).", { url, keyPresent: !!key });
  return stub;
}

let supabaseImpl: ReturnType<typeof createClient> | ReturnType<typeof createStub>;

if (isSupabaseConfigured) {
  try {
    supabaseImpl = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    console.info("[Supabase] Initialized.");
  } catch (e) {
    console.error("[Supabase] Initialization failed; falling back to stub.", e);
    supabaseImpl = createStub();
  }
} else {
  supabaseImpl = createStub();
}

export const supabase = supabaseImpl;

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
