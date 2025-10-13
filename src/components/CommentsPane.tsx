import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";

interface Props {
  videoId: string | null;
}

export function CommentsPane({ videoId }: Props) {
  const { user } = useAuth();
  const { data, error: commentsError } = useComments(videoId);
  const comments = data?.comments || [];
  const loading = data?.loading || false;
  const add = data?.add;
  const reload = data?.reload;
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!videoId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draft.trim() || submitting) return;

    setSubmitting(true);
    try {
      const result = await add(draft.trim());
      if (result.error) {
        console.error('Failed to add comment:', result.error);
        // Could show a toast here if needed
      } else {
        setDraft("");
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add Comment Form */}
      {user && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a shadow comment..."
            rows={3}
            disabled={submitting}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="sm" 
              disabled={!draft.trim() || submitting}
            >
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading comments...</div>
        )}

        {typeof Error === 'string' && (
          <div className="text-sm text-red-500 border border-red-500/30 rounded p-3 bg-red-50">
            <div className="font-medium">❌ Error: {String(Error)}</div>
            <div className="text-xs text-red-600 mt-1">
              {typeof Error === "string" && (Error as string).includes('Database not configured') && (
                <div>
                  <p>To fix this issue:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Set up Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)</li>
                    <li>Run the database migration to create the comments table</li>
                    <li>Ensure RLS policies are properly configured</li>
                  </ol>
                </div>
              )}
              {typeof Error === 'string' && (Error as string).includes('Comments table not found') && (
                <div>
                  <p>Run this SQL in your Supabase SQL editor:</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
{`CREATE TABLE public.comments (`}
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_comments_video_id_created_at 
ON public.comments (video_id, created_at DESC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);`&rbrace;
                  </pre>
                </div>
              )}
              {typeof Error === 'string' && (Error as string).includes('Permission denied') && (
                <div>
                  <p>Check your RLS policies in Supabase. The SELECT policy should allow anonymous access.</p>
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={reload} 
              disabled={loading}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}
        
        {!loading && !Error && comments.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first!
          </div>
        )}
        
        {comments.map((comment) => (
          <div key={comment.id} className="text-sm border-b last:border-b-0 pb-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-primary truncate">
                {comment.display_name || 'Anonymous'}
              </span>
            </div>
            <div className="whitespace-pre-wrap break-words">{comment.body}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
