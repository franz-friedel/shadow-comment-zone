import { useState } from "react";
import { useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  videoId: string | null;
}

  const { user } = useAuth();
  const { comments, loading, error, tableMissing, add, reload } = useComments(videoId);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!videoId) {
    return null;
  }

  if (tableMissing) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Shadow Comments</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>shadow_comments table not found.</p>
          <pre className="text-xs bg-muted p-2 rounded">
CREATE TABLE public.shadow_comments (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  body text not null,
  parent_id uuid references shadow_comments(id) on delete cascade,
  timestamp_seconds int,
  is_deleted boolean default false,
  created_at timestamptz default now()
);
          </pre>
          <pre className="text-xs bg-muted p-2 rounded">
-- RLS
alter table public.shadow_comments enable row level security;
create policy "select all" on public.shadow_comments for select using ( true );
create policy "insert auth" on public.shadow_comments for insert with check ( auth.uid() = user_id );
          </pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          Shadow Comments ({comments.length})
          <Button variant="ghost" size="sm" className="ml-2 text-xs" onClick={reload} disabled={loading}>
            {loading ? "…" : "Reload"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <div className="text-sm text-muted-foreground border rounded p-4 text-center">
            Sign in with Google to join the conversation
          </div>
        )}

        {user && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setSubmitting(true);
              const { error } = await add(draft.trim());
              if (!error) setDraft("");
              setSubmitting(false);
            }}
            className="space-y-2"
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a shadow comment..."
              disabled={submitting}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraft("")}
                disabled={!draft || submitting}
              >
                Clear
              </Button>
              <Button type="submit" size="sm" disabled={!draft.trim() || submitting}>
                {submitting ? "Posting…" : "Post"}
              </Button>
            </div>
          </form>
        )}

        {error && (
            <div className="text-sm text-red-500 border border-red-500/30 rounded p-3">
              Failed to load comments: {error}
            </div>
        )}

        <Separator />

        <div className="space-y-4">
          {comments.length === 0 && !loading && (
            <div className="text-xs text-muted-foreground">No shadow comments yet.</div>
          )}
          {loading && <div className="text-xs text-muted-foreground">Loading…</div>}
          {comments.map((c) => (
            <div key={c.id} className="text-sm border-b last:border-b-0 pb-3">
              <div className="font-medium text-primary truncate">{c.user_id}</div>
              <div className="whitespace-pre-wrap break-words">{c.body}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
