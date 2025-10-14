import { useCallback, useEffect, useState } from "react";

interface Comment {
  id: string;
  video_id: string;
  user_id: string | null;
  display_name: string | null;
  body: string;
  created_at: string;
}

interface UseSimpleCommentsState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

export function useSimpleComments(videoId: string | null) {
  const [state, setState] = useState<UseSimpleCommentsState>({
    comments: [],
    loading: false,
    error: null,
  });

  const loadComments = useCallback(() => {
    if (!videoId) {
      setState({ comments: [], loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Load comments from localStorage
      const storedComments = localStorage.getItem(`comments_${videoId}`);
      let comments: Comment[] = [];
      
      if (storedComments) {
        try {
          comments = JSON.parse(storedComments);
        } catch (parseError) {
          console.warn('Failed to parse stored comments:', parseError);
          comments = [];
        }
      }

      setState({
        comments: comments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading comments:', error);
      setState({
        comments: [],
        loading: false,
        error: 'Failed to load comments from storage',
      });
    }
  }, [videoId]);

  const addComment = useCallback(async (body: string, userDisplayName: string = 'Anonymous') => {
    if (!videoId) {
      throw new Error("No video id");
    }

    try {
      const newComment: Comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        video_id: videoId,
        user_id: null,
        display_name: userDisplayName,
        body: body.trim(),
        created_at: new Date().toISOString(),
      };

      // Get existing comments
      const storedComments = localStorage.getItem(`comments_${videoId}`);
      let comments: Comment[] = [];
      
      if (storedComments) {
        try {
          comments = JSON.parse(storedComments);
        } catch (parseError) {
          console.warn('Failed to parse existing comments:', parseError);
          comments = [];
        }
      }

      // Add new comment at the beginning
      const updatedComments = [newComment, ...comments];
      
      // Save to localStorage
      localStorage.setItem(`comments_${videoId}`, JSON.stringify(updatedComments));
      
      // Update state
      setState(prev => ({
        ...prev,
        comments: updatedComments,
        error: null,
      }));

      return { data: newComment, error: null };
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      return { data: null, error: new Error(errorMessage) };
    }
  }, [videoId]);


  useEffect(() => {
    loadComments();
  }, [loadComments]);

  return { 
    ...state, 
    reload: loadComments, 
    add: addComment,
  };
}
