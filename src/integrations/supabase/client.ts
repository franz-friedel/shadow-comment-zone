// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// Debug environment variables
console.log("Environment check:", {
  NODE_ENV: import.meta.env.MODE,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? "SET" : "MISSING",
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? "SET" : "MISSING",
});

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

function mask(v?: string) {
  if (!v) return "(empty)";
  if (v.length <= 8) return "***";
  return v.slice(0, 4) + "..." + v.slice(-4);
}

// Create a safer client that doesn't throw in production
let supabase: ReturnType<typeof createClient> | null = null;

if (!url || !anon) {
  const msg = [
    "[Supabase] Missing environment variables!",
    `VITE_SUPABASE_URL=${mask(url as string)}`,
    `VITE_SUPABASE_ANON_KEY=${mask(anon as string)}`,
    "Please check your environment configuration."
  ].join("\n");
  
  console.error(msg);
  
  // Create a mock client that throws helpful errors instead of crashing
  supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error("Supabase not configured") }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      signUp: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
      signOut: () => Promise.resolve({ error: new Error("Supabase not configured") }),
    },
  } as any;
} else {
  try {
    console.log("Creating Supabase client with URL:", url);
    supabase = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    console.log("Supabase client created successfully");
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    // Fallback to mock client
    supabase = {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error("Supabase client creation failed") }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: null, error: new Error("Supabase client creation failed") }),
        signUp: () => Promise.resolve({ data: null, error: new Error("Supabase client creation failed") }),
        signOut: () => Promise.resolve({ error: new Error("Supabase client creation failed") }),
      },
    } as any;
  }
}

export { supabase };
