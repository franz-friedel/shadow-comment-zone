import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

// Force supabase to the full client type (original export is a union with a limited mock shape)
const supabaseClient = supabase as SupabaseClient;

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
}

let lastError: string | null = null;
export function getLastCommentsError() {
  return lastError;
}

/** Fetch all non-deleted (or legacy null) comments for a video. */
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
}) {
  lastError = null;
  const { data: sessionResult, error: authError } = await supabaseClient.auth.getSession();
  if (authError) {
    lastError = authError.message;
    return { data: null, error: authError };
  }
  const user = sessionResult?.session?.user;
  if (!user) {
    const err = new Error("Not authenticated");
    lastError = err.message;
    return { data: null, error: err };
  }

  const { videoId, body, parentId = null, timestampSeconds = null } = params;
  const { data, error } = await supabaseClient
    .from("shadow_comments")
    .insert({
      video_id: videoId,
      user_id: user.id,
      body,
      parent_id: parentId,
      timestamp_seconds: timestampSeconds,
    })
    .select()
    .single();
  if (error) {
    lastError = `${error.code || ""} ${error.message}`.trim();
    console.error("[Comments insert error]", lastError);
  }
  return { data: (data as ShadowComment) ?? null, error };
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
