import {
  BOT_AUTHOR_ID,
  ShadowComment,
  addComment,
  createLocalSeedComments,
  fetchComments,
  getLastCommentsError,
  subscribeComments,
} from "@/integrations/supabase/comments";
import { useCallback, useEffect, useState } from "react";

interface UseCommentsState {
  comments: ShadowComment[];
  loading: boolean;
  error: string | null;
  tableMissing: boolean;
  lastDetail: string | null;
  seededLocally: boolean;
}

export function useComments(videoId: string | null, opts?: { localSeed?: boolean; seedMin?: number }) {
  const [state, setState] = useState<UseCommentsState>({
    comments: [],
    loading: !!videoId,
    error: null,
    tableMissing: false,
    lastDetail: null,
    seededLocally: false,
  });

  const localSeed = opts?.localSeed ?? true;
  const seedMin = opts?.seedMin ?? 5;

  const load = useCallback(async () => {
    if (!videoId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await fetchComments(videoId);
    if (error) {
      const detail = getLastCommentsError();
      const tableMissing =
        !!error.message?.match(/relation .* does not exist/i) || (error as any).code === "42P01";
      setState((s) => ({
        ...s,
        loading: false,
        error: tableMissing ? "Comments table missing" : "Failed to load comments",
        tableMissing,
        lastDetail: detail,
        seededLocally: false,
      }));
      return;
    }
    // Local seeding (no DB writes) if empty and allowed
    if (data.length === 0 && localSeed) {
      const seeds = createLocalSeedComments(videoId, seedMin);
      setState((s) => ({
        ...s,
        loading: false,
        comments: seeds,
        error: null,
        tableMissing: false,
        lastDetail: null,
        seededLocally: true,
      }));
      return;
    }
    setState((s) => ({
      ...s,
      loading: false,
      comments: data,
      error: null,
      tableMissing: false,
      lastDetail: null,
      seededLocally: false,
    }));
  }, [videoId, localSeed, seedMin]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!videoId) return;
    const unsub = subscribeComments(videoId, (c, type) => {
      setState((s) => {
        // If we had local seeds and real data arrives, drop all local seeds first time we see an INSERT
        let comments = s.comments;
        if (s.seededLocally && type === "INSERT") {
          comments = s.comments.filter((x) => x.user_id !== BOT_AUTHOR_ID || !x.is_bot);
        }
        if (type === "INSERT") {
          if (comments.find((x) => x.id === c.id)) return s;
          return { ...s, comments: [...comments, c], seededLocally: false };
        }
        if (type === "UPDATE") {
          return {
            ...s,
            comments: comments.map((x) => (x.id === c.id ? c : x)),
          };
        }
        if (type === "DELETE") {
          return { ...s, comments: comments.filter((x) => x.id !== c.id) };
        }
        return s;
      });
    });
    return unsub;
  }, [videoId]);

  const add = useCallback(
    async (body: string, parentId?: string | null, ts?: number | null) => {
      if (!videoId) return { data: null, error: new Error("No video id") };
      // On first real post while in local seed mode: clear seeds optimistically
      setState((s) =>
        s.seededLocally
          ? {
            ...s,
            comments: s.comments.filter((x) => !(x.is_bot && x.user_id === BOT_AUTHOR_ID)),
            seededLocally: false,
          }
          : s
      );
      const result = await addComment({ videoId, body, parentId, timestampSeconds: ts });
      if (result.error) {
        const detail = getLastCommentsError();
        setState((s) => ({
          ...s,
          error: "Failed to add comment",
          lastDetail: detail,
        }));
      }
      return result;
    },
    [videoId]
  );

  return { ...state, reload: load, add };
}
