import { useCallback, useEffect, useState } from "react";
import { addComment, fetchComments, ShadowComment, subscribeComments } from "@/integrations/supabase/comments";

interface UseCommentsState {
  comments: ShadowComment[];
  loading: boolean;
  error: string | null;
  tableMissing: boolean;
}

export function useComments(videoId: string | null) {
  const [state, setState] = useState<UseCommentsState>({
    comments: [],
    loading: !!videoId,
    error: null,
    tableMissing: false,
  });

  const load = useCallback(async () => {
    if (!videoId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await fetchComments(videoId);
    if (error) {
      if (error.message.includes("relation") || error.code === "42P01") {
        setState((s) => ({ ...s, loading: false, tableMissing: true, error: "comments table missing" }));
      } else {
        setState((s) => ({ ...s, loading: false, error: error.message }));
      }
      return;
    }
    setState((s) => ({ ...s, loading: false, comments: data }));
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!videoId) return;
    const unsub = subscribeComments(videoId, (c, type) => {
      setState((s) => {
        if (type === "INSERT") {
          if (s.comments.find((x) => x.id === c.id)) return s;
          return { ...s, comments: [...s.comments, c] };
        }
        if (type === "UPDATE") {
          return { ...s, comments: s.comments.map((x) => (x.id === c.id ? c : x)) };
        }
        if (type === "DELETE") {
          return { ...s, comments: s.comments.filter((x) => x.id !== c.id) };
        }
        return s;
      });
    });
    return unsub;
  }, [videoId]);

  const create = useCallback(
    async (body: string, parentId?: string | null, timestampSeconds?: number | null) => {
      if (!videoId) return { error: new Error("No video id"), data: null };
      return await addComment({ videoId, body, parentId, timestampSeconds });
    },
    [videoId],
  );

  return { ...state, reload: load, add: create };
}
