import { supabase } from "./client";

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
export function getLastCommentsError() { return lastError; }

export async function fetchComments(videoId: string) {
  lastError = null;
  const query = supabase
    .from("shadow_comments")
    .select("*")
    .eq("video_id", videoId)
    // accept rows where is_deleted is false OR null (in case older rows have null)
    .or("is_deleted.is.null,is_deleted.eq.false")
    .order("created_at", { ascending: true });

  const { data, error } = await query;
  if (error) {
    lastError = `${error.code || ""} ${error.message}`.trim();
  }
  return { data: (data as ShadowComment[] | null) ?? [], error };
}

export async function addComment(params: {
  videoId: string;
  body: string;
  parentId?: string | null;
  timestampSeconds?: number | null;
}) {
  lastError = null;
  const { data: userResult } = await supabase.auth.getUser();
  if (!userResult?.user) {
    const err = new Error("Not authenticated");
    lastError = err.message;
    return { data: null, error: err };
  }

  const { videoId, body, parentId = null, timestampSeconds = null } = params;
  const { data, error } = await supabase
    .from("shadow_comments")
    .insert({
      video_id: videoId,
      "postgres_changes",
      { event: "*", schema: "public", table: "shadow_comments", filter: `video_id=eq.${videoId}` },
      (payload) => {
        cb(payload.new as ShadowComment, payload.eventType);
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
