import {
  ShadowComment,
  addComment,
  fetchComments,
  getLastCommentsError,
  subscribeComments
} from "@/integrations/supabase/comments";
import { useCallback, useEffect, useState } from "react";

interface UseCommentsState {
  comments: ShadowComment[];
  loading: boolean;
  error: string | null;
  tableMissing: boolean;
  lastDetail: string | null;
  seeded: boolean;
}

export function useComments(videoId: string | null, opts?: { allowSeeds?: boolean; seedMin?: number }) {
  const [state, setState] = useState<UseCommentsState>({
    comments: [],
    loading: !!videoId,
    error: null,
    tableMissing: false,
    lastDetail: null,
    seeded: false
  });

  const allowSeeds = opts?.allowSeeds ?? true;
  const seedMin = opts?.seedMin ?? 4;

  const load = useCallback(async () => {
    if (!videoId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await fetchComments(videoId, { allowSeeds, seedMin });
    if (error) {
      const detail = getLastCommentsError();
      const tableMissing =
        (error.code === "42P01") ||
        /relation .* does not exist/i.test(error.message || "");
      setState((s) => ({
        ...s,
        loading: false,
        comments: data,
        error: tableMissing ? "Comments table missing" : "Failed to load comments",
        lastDetail: detail,
        tableMissing,
        seeded: data.some((c) => c._local)
      }));
      return;
    }
    setState((s) => ({
      ...s,
      loading: false,
      comments: data,
      error: null,
      lastDetail: null,
      tableMissing: false,
      seeded: data.some((c) => c._local)
    }));
  }, [videoId, allowSeeds, seedMin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!videoId) return;
    const unsub = subscribeComments(videoId, (c, type) => {
      setState((s) => {
        let comments = s.comments;
        // On first real insert replace local seeds
        if (type === "INSERT" && s.seeded) {
          comments = comments.filter((x) => !x._local);
        }
        if (type === "INSERT") {
          if (comments.find((x) => x.id === c.id)) return s;
          return { ...s, comments: [...comments, c], seeded: false };
        }
        if (type === "UPDATE") {
          return { ...s, comments: comments.map((x) => (x.id === c.id ? c : x)) };
        }
        if (type === "DELETE") {
          return { ...s, comments: comments.filter((x) => x.id !== c.id) };
        }
        return s;
      });
    });
    // Wrap async unsubscribe to satisfy React's sync cleanup requirement.
    return () => { void unsub(); };
  }, [videoId]);

  const add = useCallback(
    async (body: string, parentId?: string | null, ts?: number | null) => {
      if (!videoId) return { data: null, error: new Error("No video id") };
      // Remove seeds optimistically
      setState((s) =>
        s.seeded ? { ...s, comments: s.comments.filter((c) => !c._local), seeded: false } : s
      );
      const result = await addComment({ videoId, body, parentId, timestampSeconds: ts });
      if (result.error) {
        const detail = getLastCommentsError();
        setState((s) => ({ ...s, error: "Failed to add comment", lastDetail: detail }));
      }
      return result;
    },
    [videoId]
  );

  return { ...state, reload: load, add };
}
