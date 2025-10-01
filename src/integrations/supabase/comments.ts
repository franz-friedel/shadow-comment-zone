import { supabase } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  const query = (supabase as SupabaseClient)
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
  const { data: userResult, error: authError } = await supabase.auth.getUser();
  if (authError) {
    lastError = authError.message;
    return { data: null, error: authError };
  }
  if (!userResult?.user) {
    const err = new Error("Not authenticated");
    lastError = err.message;
    return { data: null, error: err };
  }

  const { videoId, body, parentId = null, timestampSeconds = null } = params;

  const insertPayload = {
    video_id: videoId,
    user_id: userResult.user.id,
    body,
    parent_id: parentId,
    timestamp_seconds: timestampSeconds,
  };
  const { data, error } = await (supabase as SupabaseClient)
  const { data, error } = await (supabase as SupabaseClient)
    .from("shadow_comments")
    .insert(insertPayload)
    .select()
    .single();
  if (error) {
    lastError = error.message;
  }

  return { data: (data as ShadowComment) ?? null, error };
}
