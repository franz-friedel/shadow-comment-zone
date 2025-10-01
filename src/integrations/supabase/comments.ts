import { supabase } from "./client";

/** Last error message set by comment operations (null if none). */
export let lastError: string | null = null;
export function getLastCommentsError() { return lastError; }

export interface ShadowComment {
  id: string;
  video_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at?: string | null;
  is_deleted?: boolean | null;
  is_bot?: boolean | null;
  _local?: boolean;
}

export interface CommentsDiagnostics {
  code?: string;
  message?: string;
  tableMissing: boolean;
  permissionDenied: boolean;
  raw?: any;
}

let lastDiagnostics: CommentsDiagnostics | null = null;
export function getLastCommentsDiagnostics() { return lastDiagnostics; }

// Helper to safely extract PostgREST error info without using `any`
function getErrorMeta(err: unknown): { code?: string; message: string } {
  if (err && typeof err === "object") {
    const maybe = err as { code?: string; message?: string };
    return { code: maybe.code, message: maybe.message ?? "Unknown error" };
  }
  return { message: "Unknown error" };
}

// Bot / seed helpers
const BOT_AUTHOR_ID = "00000000-0000-4000-8000-botshadow000";
const SEED_SNIPPETS = [
  "Seed shadow thread: discuss even if YT hides comments.",
  "Comment moderation on YT too strict? Continue here.",
  "Shadow layer active — add your take.",
  "This space keeps context if the original thread vanishes.",
  "Early seed so page doesn’t look empty. Join in."
];

function buildLocalSeeds(videoId: string, count = 4): ShadowComment[] {
  const pick = [...SEED_SNIPPETS].sort(() => Math.random() - 0.5).slice(0, count);
  const base = Date.now();
  return pick.map((body, i) => ({
    id: `seed-${videoId}-${i}-${Math.random().toString(36).slice(2)}`,
    video_id: videoId,
    user_id: BOT_AUTHOR_ID,
    body,
    parent_id: null,
    timestamp_seconds: null,
    created_at: new Date(base - (count - i) * 500).toISOString(),
    is_deleted: false,
    is_bot: true,
    _local: true
  }));
}

export async function fetchComments(
  videoId: string,
  opts?: { allowSeeds?: boolean; seedMin?: number }
) {
  lastError = null;
  lastDiagnostics = null;

  const { data, error } = await supabase
    .from("shadow_comments")
    .select("*")
    .eq("video_id", videoId)
    .or("is_deleted.is.null,is_deleted.eq.false")
    .order("created_at", { ascending: true });

  if (error) {
    const meta = getErrorMeta(error);
    const msg = meta.message;
    const code = meta.code;
    const tableMissing = /relation .*shadow_comments.* does not exist/i.test(msg) || code === "42P01";
    const permissionDenied =
      /permission denied/i.test(msg) ||
      code === "42501" ||
      msg.toLowerCase().includes("rls") ||
      msg.toLowerCase().includes("not authorized");
    lastError = `[${code || "?"}] ${msg}`;
    lastDiagnostics = {
      code,
      message: msg,
      tableMissing,
      permissionDenied,
      raw: error,
    };

    // Always provide seeds (UI should never be blank)
    if (opts?.allowSeeds !== false) {
      return {
        data: buildLocalSeeds(videoId, opts?.seedMin ?? 4),
        error,
      };
    }
    return { data: [] as ShadowComment[], error };
  }

  if (!data || data.length === 0) {
    if (opts?.allowSeeds !== false) {
      return { data: buildLocalSeeds(videoId, opts?.seedMin ?? 4), error: null };
    }
  }

  return { data: data as ShadowComment[], error: null };
}

export async function addComment(params: {
  videoId: string;
  body: string;
  parentId?: string | null;
  timestampSeconds?: number | null;
}) {
  lastError = null;
  const { data: sessionResult } = await supabase.auth.getSession();
  const user = sessionResult?.session?.user;
  if (!user) {
    const err = new Error("Not authenticated");
    lastError = err.message;
    return { data: null, error: err };
  }
  const { videoId, body, parentId = null, timestampSeconds = null } = params;
  const { data, error } = await supabase
    .from("shadow_comments")
    .insert({
      video_id: videoId,
      user_id: user.id,
      body,
      parent_id: parentId,
      timestamp_seconds: timestampSeconds,
      is_bot: false,
    })
    .select()
    .single();

  if (error) {
    const meta = getErrorMeta(error);
    lastError = `[${meta.code || "?"}] ${meta.message}`;
  }
  return { data: (data as ShadowComment) ?? null, error };
}

export function subscribeComments(
  videoId: string,
  cb: (c: ShadowComment, type: "INSERT" | "UPDATE" | "DELETE") => void
) {
  return supabase
    .channel(`shadow_comments_${videoId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shadow_comments",
        filter: `video_id=eq.${videoId}`,
      },
      (payload) => {
        // Guard types (DELETE payload may have old vs new)
        const eventType = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const row = (payload.new || payload.old) as ShadowComment;
        cb(row, eventType);
      }
    )
    .subscribe();
}
