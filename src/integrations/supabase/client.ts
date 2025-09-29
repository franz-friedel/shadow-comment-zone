/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

// Gather and normalize env vars
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const url = (rawUrl || "").trim();
const key = (rawKey || "").trim();

// Expose for quick debugging in DevTools
// (Type in console: window.__SUPABASE_ENV__)
;(window as any).__SUPABASE_ENV__ = {
  VITE_SUPABASE_URL: url,
  VITE_SUPABASE_ANON_KEY_SET: !!key && key !== "YOUR_REAL_ANON_PUBLIC_KEY",
  LENGTH_URL: url.length,
  LENGTH_KEY: key.length,
};

// Helper to render an on-screen error (prevents silent black screen)
function renderConfigOverlay(message: string) {
  if (document.getElementById("supabase-config-error")) return;
  const div = document.createElement("div");
  div.id = "supabase-config-error";
  div.style.cssText =
    "position:fixed;inset:0;z-index:99999;background:#120a;color:#fff;font:14px/1.4 system-ui;padding:32px;overflow:auto";
  div.innerHTML = `
    <h1 style="color:#ff4d4f;font-size:20px;margin:0 0 16px;">Supabase Configuration Error</h1>
    <p style="margin:0 0 12px;white-space:pre-wrap;">${message}</p>
    <ol style="margin:0 0 16px 20px;padding:0;">
      <li>Open Supabase Dashboard → Project Settings → API.</li>
      <li>Copy Project URL (ends with .supabase.co).</li>
      <li>Copy anon public API key.</li>
      <li>Edit .env.local (no inline comments, no quotes).</li>
      <li>Restart dev server: Ctrl+C then npm run dev.</li>
      <li>Hard reload browser (Ctrl+Shift+R).</li>
    </ol>
    <code style="display:block;background:#1e1e1e;padding:12px;border:1px solid #333;border-radius:6px;overflow:auto;">
VITE_SUPABASE_URL=${url || "(empty)"}
VITE_SUPABASE_ANON_KEY=${key ? key.slice(0, 8) + "...(len " + key.length + ")" : "(empty)"}
    </code>
  `;
  document.body.appendChild(div);
}

// Validate
const problems: string[] = [];
if (!url) problems.push("VITE_SUPABASE_URL is empty");
if (url && !/^https:\/\/.*\.supabase\.co$/i.test(url) && !url.includes("YOUR_REAL_PROJECT_REF"))
  problems.push("VITE_SUPABASE_URL does not look like a Supabase project URL");
if (!key) problems.push("VITE_SUPABASE_ANON_KEY is empty");
if (key === "YOUR_REAL_ANON_PUBLIC_KEY") problems.push("VITE_SUPABASE_ANON_KEY still placeholder");

// If any problems, throw early & overlay
if (problems.length) {
  const msg = problems.join("; ");
  console.error("[Supabase Config Error]", { url, keyPreview: key ? key.slice(0, 10) : undefined, problems });
  // Try to overlay (may run before DOM ready)
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => renderConfigOverlay(msg));
    } else {
      renderConfigOverlay(msg);
    }
  }
  throw new Error(msg);
}

// Safe creation with try/catch to surface lib-level issues
let client;
try {
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} catch (e) {
  console.error("Failed to initialize Supabase client", e);
  if (typeof document !== "undefined") {
    renderConfigOverlay("Supabase createClient failed: " + (e as Error).message);
  }
  throw e;
}

export const supabase = client;
// Optional debug (remove after): console.log("[Supabase] Initialized", url);
