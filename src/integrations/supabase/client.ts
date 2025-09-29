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
  console.warn("[Supabase] Using stub client (missing/invalid env).", {
    url,
    keyPresent: !!key,
    keyLength: key.length,
  });
  return stub;
}

let supabaseImpl: ReturnType<typeof createClient> | ReturnType<typeof createStub>;

if (isSupabaseConfigured) {
  try {
    supabaseImpl = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
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
// Optional debug (remove after): console.log("[Supabase] Initialized", url);
