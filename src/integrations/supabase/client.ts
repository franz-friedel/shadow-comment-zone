// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

function mask(v?: string) {
  if (!v) return "(empty)";
  if (v.length <= 8) return "***";
  return v.slice(0, 4) + "..." + v.slice(-4);
}

if (!url || !anon) {
  // Hard fail in dev with a helpful message. In prod, throw a concise error.
  const msg = [
    "[Supabase] Missing env!",
    `VITE_SUPABASE_URL=${mask(url as string)}`,
    `VITE_SUPABASE_ANON_KEY=${mask(anon as string)}`,
    "Add these to .env.local for local dev and to Vercel (Production) env vars."
  ].join("\n");
  if (import.meta.env.DEV) {
    throw new Error(msg);
  } else {
    throw new Error("[Supabase] Missing required env variables.");
  }
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});