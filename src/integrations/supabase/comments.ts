import { supabase } from "./client";

export interface ShadowComment {
  id: string;
  video_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  timestamp_seconds: number | null;
  created_at: string;
  updated_at: string | null;
  is_deleted: boolean | null;
}

export type NewShadowComment = Omit<ShadowComment, "id" | "created_at" | "updated_at" | "is_deleted"> & {
  body: string;
};

export async function fetchComments(videoId: string) {
  const { data, error } = await supabase
    .from("shadow_comments")
    .select("*")
    .eq("video_id", videoId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  return { data: (data as ShadowComment[] | null) ?? [], error };
}

export async function addComment(params: {
  videoId: string;
  body: string;
  parentId?: string | null;
  timestampSeconds?: number | null;
}) {
  const { videoId, body, parentId = null, timestampSeconds = null } = params;
  const { data, error } = await supabase
    .from("shadow_comments")
    .insert({
      video_id: videoId,
      body,
      parent_id: parentId,
      timestamp_seconds: timestampSeconds,
    })
    .select()
    .single();
  return { data: data as ShadowComment | null, error };
}

export function subscribeComments(videoId: string, cb: (c: ShadowComment, type: string) => void) {
  const channel = supabase
    .channel("shadow_comments_stream")
    .on(
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
