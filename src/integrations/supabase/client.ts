/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// We'll do the OAuth code exchange ourselves on /auth/callback
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage,
  },
});
    detectSessionInUrl: true, // AUTO strategy
    storage,
  },
});

// Diagnostics (optional)
if (typeof window !== "undefined") {
  (window as any).__SUPABASE_INFO__ = { url, anonKeyPrefix: key.slice(0, 8), ts: Date.now() };
  supabase.auth.onAuthStateChange((event, session) => {
    console.log("[Supabase AuthState]", event, "user?", !!session?.user);
    (window as any).__LAST_AUTH_EVENT__ = { event, hasUser: !!session?.user, at: Date.now() };
  });
  (window as any).forceSessionCheck = async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession();
    console.log("[forceSessionCheck] user?", !!data.session?.user);
    return data.session;
  };
}

export async function forceAuthReset() {
  try { await supabase.auth.signOut(); } catch {}
  if (typeof window !== "undefined") {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith("sb-") || k.includes("supabase"))
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
  }
  console.info("[Supabase] Local auth cleared.");
}

export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
        .forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    }
  } catch {}
  console.info("[Supabase] Local auth cleared.");
}

/**
 * Ensure we have the latest session (optional helper).
 */
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
  return data.session;
}
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
