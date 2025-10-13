import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useState } from "react";

interface Props {
  videoId: string | null;
}

export function CommentsPane({ videoId }: Props) {
  const { user } = useAuth();
  const { comments, loading, error, add, reload } = useComments(videoId);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!videoId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        
        {error && (
          <div className="text-sm text-red-500 border border-red-500/30 rounded p-3 bg-red-50">
            <div className="font-medium">Error: {error}</div>
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
        
        {!loading && !error && comments.length === 0 && (
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
