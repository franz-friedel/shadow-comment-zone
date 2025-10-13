import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      
      // Check if we're using the stub implementation
      const isUsingStub = (window as any).__SUPABASE_STUB__ === true;
      if (isUsingStub) {
        console.log('[useComments] Using Supabase stub - no real database connection');
        setState({
          comments: [],
          loading: false,
          error: 'Database not configured. Please check your Supabase environment variables.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .select('id, video_id, user_id, display_name, body, created_at')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[useComments] Supabase error:', error);
        
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          setState({
            comments: [],
            loading: false,
            error: 'Comments table not found. Please run the database migration.',
          });
          return;
        }
        
        if (error.code === '42501') {
          setState({
            comments: [],
            loading: false,
            error: 'Permission denied. Please check RLS policies.',
          });
          return;
        }

        throw error;
      }

      console.log(`[useComments] Successfully loaded ${data?.length || 0} comments`);
      
      setState({
        comments: data || [],
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
      
      // Check if we're using the stub implementation
      const isUsingStub = (window as any).__SUPABASE_STUB__ === true;
      if (isUsingStub) {
        throw new Error('Database not configured. Cannot add comments.');
      }

      // Get current user
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[useComments] Session error:', sessionError);
        throw new Error('Authentication error');
      }

      const user = sessionData?.session?.user;
      if (!user) {
        throw new Error('You must be logged in to post comments');
      }

      const display_name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

      const { data, error } = await supabase
        .from('comments')
        .insert([{ 
          video_id: videoId, 
          body: body.trim(), 
          user_id: user.id, 
          display_name 
        }])
        .select()
        .single();

      if (error) {
        console.error('[useComments] Error inserting comment:', error);
        throw error;
      }

      console.log('[useComments] Successfully added comment:', data?.id);
      
      // Reload comments to show the new one
      await load();
      
      return { data, error: null };
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
