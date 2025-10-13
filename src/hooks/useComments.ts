import { useCallback, useEffect, useState } from "react";

interface Comment {
  id: string;
  video_id: string;
  user_id: string | null;
  display_name: string | null;
  body: string;
  created_at: string;
}

interface UseCommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export function useComments(videoId: string | null) {
  const [state, setState] = useState<UseCommentsState>({
    comments: [],
    loading: false,
    error: null,
  });

  const load = useCallback(async () => {
    if (!videoId) {
      setState({ comments: [], loading: false, error: null });
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    
    try {
      console.log(`[useComments] Fetching comments for videoId: ${videoId}`);
      
      const response = await fetch(`/api/comments?videoId=${encodeURIComponent(videoId)}&limit=50`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log(`[useComments] Successfully loaded ${result.data?.length || 0} comments`);
      
      setState({
        comments: result.data || [],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[useComments] Error loading comments:', error);
      setState({
        comments: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load comments',
      });
    }
  }, [videoId]);

  const addComment = useCallback(async (body: string) => {
    if (!videoId) {
      throw new Error("No video id");
    }

    try {
      console.log(`[useComments] Adding comment for videoId: ${videoId}`);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          body: body.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[useComments] Successfully added comment:', result.data?.id);
      
      // Reload comments to show the new one
      await load();
      
      return { data: result.data, error: null };
    } catch (error) {
      console.error('[useComments] Error adding comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      return { data: null, error: new Error(errorMessage) };
    }
  }, [videoId, load]);

  useEffect(() => {
    load();
  }, [load]);

  return { 
    ...state, 
    reload: load, 
    add: addComment 
  };
}
