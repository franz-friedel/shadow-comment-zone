import { useCallback, useEffect, useState } from "react";
import {
  addComment,
  fetchComments,
  subscribeComments,
  ShadowComment,
  getLastCommentsError,
} from "@/integrations/supabase/comments";

interface UseCommentsState {
  comments: ShadowComment[];
  loading: boolean;
  error: string | null;
  tableMissing: boolean;
  lastDetail: string | null;
}

export function useComments(videoId: string | null) {
  const [state, setState] = useState<UseCommentsState>({
    comments: [],
    loading: !!videoId,
    error: null,
    tableMissing: false,
    lastDetail: null,
  });

  const load = useCallback(async () => {
    if (!videoId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await fetchComments(videoId);
    if (error) {
      const detail = getLastCommentsError();
      const tableMissing =
        !!error.message.match(/relation .* does not exist/i) || (error as any).code === "42P01";
      setState((s) => ({
        ...s,
        loading: false,
        error: tableMissing ? "Comments table missing" : "Failed to load comments",
        tableMissing,
        lastDetail: detail,
      }));
      return;
    }
    // Initial successful load
    setState((s) => ({
      ...s,
      loading: false,
      error: null,
      comments: data || [],
    }));
    // Subscribe to live updates
    const unsub = subscribeComments(videoId, (type, c) => {
      setState((s) => {
        if (type === "INSERT") {
          if (s.comments.some((x) => x.id === c.id)) return s;
          return { ...s, comments: [...s.comments, c] };
        }
  useEffect(() => {
    let cleanup: any;
    load().then((unsub) => {
      cleanup = unsub;
    });
    return () => {
      if (cleanup) cleanup();
    };
  }, [load]);

  const create = useCallback(
    async (body: string, parentId?: string | null, timestampSeconds?: number | null) => {
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
