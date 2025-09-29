import { createClient } from "@supabase/supabase-js";

// Vite provides import.meta.env typing automatically, no need to redeclare ImportMeta

const url = import.meta.env.VITE_SUPABASE_URL!;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
