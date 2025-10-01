import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

// Force supabase to the full client type (original export is a union with a limited mock shape)
const supabaseClient = supabase as SupabaseClient;

/** Last error message set by comment operations (null if none). */
export let lastError: string | null = null;

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
}

export const BOT_AUTHOR_ID = "00000000-0000-4000-8000-botshadow000";
export const BOT_SIGNATURE = "shadow-bot";

const BOT_COMMENT_TEMPLATES: string[] = [
  "Seed comment 👋 (shadow layer active).",
  "YouTube hides stuff? Discuss it here instead.",
  "Preserving a thread even if YT moderates heavily.",
  "Add thoughts — this is independent of YT filters.",
  "Shadow comments keep discussion visible.",
  "Seen removals on the original page? Mirror it here.",
  "Jump in — these seed comments disappear once real posts arrive.",
];

// Fetch + existing code unchanged...

export async function fetchComments(videoId: string) {
  lastError = null;
  const { data, error } = await supabaseClient
    .from("shadow_comments")
    .select("*")
    .eq("video_id", videoId)
    .or("is_deleted.is.null,is_deleted.eq.false")
    .order("created_at", { ascending: true });

  if (error) {
    lastError = `${error.code || ""} ${error.message}`.trim();
    console.error("[Comments fetch error]", lastError);
  }
  return { data: (data as ShadowComment[] | null) ?? [], error };
}

/** Insert a new comment (requires auth – RLS enforced). */
export async function addComment(params: {
  videoId: string;
  body: string;
  parentId?: string | null;
  timestampSeconds?: number | null;
  isBot?: boolean;
}) {
  lastError = null;
  const { data: sessionResult, error: authError } = await supabaseClient.auth.getSession();
  if (authError) {
    lastError = authError.message;
    return { data: null, error: authError };
  }
  const user = sessionResult?.session?.user;
  const { videoId, body, parentId = null, timestampSeconds = null, isBot = false } = params;
  // For bot comments we use a pseudo user id & skip auth requirement
  let userId = user?.id;
  if (isBot) {
    userId = BOT_AUTHOR_ID;
  }
  if (!userId) {
    const err = new Error("Not authenticated");
    lastError = err.message;
    return { data: null, error: err };
  }
  const { data, error } = await supabaseClient
    .from("shadow_comments")
    .insert({
      video_id: videoId,
      user_id: userId,
      body,
      parent_id: parentId,
      timestamp_seconds: timestampSeconds,
      is_bot: isBot,
    })
    .select()
    .single();
  if (error) {
    lastError = `${error.code || ""} ${error.message}`.trim();
    console.error("[Comments insert error]", lastError);
  }
  return { data: (data as ShadowComment) ?? null, error };
}

export function createLocalSeedComments(videoId: string, min = 5): ShadowComment[] {
  const now = Date.now();
  const picked = [...BOT_COMMENT_TEMPLATES]
    .sort(() => Math.random() - 0.5)
    .slice(0, min);
  return picked.map((body, i) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `${videoId}-seed-${i}-${Math.random()}`,
    video_id: videoId,
    user_id: BOT_AUTHOR_ID,
    body,
    parent_id: null,
    timestamp_seconds: null,
    created_at: new Date(now - (min - i) * 1000).toISOString(),
    is_deleted: false,
    is_bot: true,
  }));
}

export function isBotComment(c: ShadowComment) {
  return !!c.is_bot || c.user_id === BOT_AUTHOR_ID;
}

/** Realtime subscription to changes for a video's comments. */
export function subscribeComments(
  videoId: string,
  cb: (comment: ShadowComment, type: "INSERT" | "UPDATE" | "DELETE") => void
) {
  const channel = supabaseClient
    .channel(`shadow_comments_${videoId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shadow_comments", filter: `video_id=eq.${videoId}` },
      (payload) => {
        const type = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        const record =
          type === "DELETE" ? (payload.old as ShadowComment) : (payload.new as ShadowComment);
        cb(record, type);
      }
    )
    .subscribe();

  return () => {
    supabaseClient.removeChannel(channel);
  };
}
{ event: "*", schema: "public", table: "shadow_comments", filter: `video_id=eq.${videoId}` },
(payload) => {
  const type = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
  const record =
    type === "DELETE" ? (payload.old as ShadowComment) : (payload.new as ShadowComment);
  cb(record, type);
}
    )
    .subscribe();

return () => {
  supabaseClient.removeChannel(channel);
};
}
