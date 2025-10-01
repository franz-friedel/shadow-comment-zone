import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useState } from "react";

interface Props {
  videoId: string | null;
}

export function CommentsPane({ videoId }: Props) {
  const { user } = useAuth();
  const {
    comments,
    loading,
    error,
    tableMissing,
    permissionDenied,
    lastDetail,
    add,
    reload,
    seeded,
  } = useComments(videoId, { allowSeeds: true, seedMin: 5 });
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!videoId) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col-reverse">
        <div className="space-y-4">
          {comments.length === 0 && !loading && !error && (
            <div className="text-xs text-muted-foreground">
              No shadow comments yet.
            </div>
          )}
          {seeded && !error && (
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Showing local sample comments (not stored). Post to start a real
              thread.
            </div>
          )}
          {loading && (
            <div className="text-xs text-muted-foreground">Loading…</div>
          )}
          {error && (
            <div className="text-xs space-y-2 text-red-500 border border-red-500/30 rounded p-3">
              <div className="font-medium">{error}</div>
              {lastDetail && (
                <div className="opacity-80 break-words">Detail: {lastDetail}</div>
              )}
              {tableMissing && (
                <pre className="bg-red-500/10 p-2 rounded text-[10px] overflow-auto">
                  {`CREATE TABLE public.shadow_comments (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  parent_id uuid references shadow_comments(id) on delete cascade,
  timestamp_seconds int,
  is_deleted boolean default false,
  is_bot boolean default false,
  created_at timestamptz default now()
);
alter table public.shadow_comments enable row level security;
create policy "select all" on public.shadow_comments for select using (true);
create policy "insert auth" on public.shadow_comments for insert with check (auth.uid() = user_id);`}
                </pre>
              )}
              {permissionDenied && !tableMissing && (
                <pre className="bg-red-500/10 p-2 rounded text-[10px] overflow-auto">
                  {`-- Likely missing RLS policies:
alter table public.shadow_comments enable row level security;
create policy "select all" on public.shadow_comments for select using ( true );
create policy "insert auth" on public.shadow_comments for insert with check ( auth.uid() = user_id );`}
                </pre>
              )}
              <Button size="sm" variant="outline" onClick={reload} disabled={loading}>
                Retry
              </Button>
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="text-sm border-b last:border-b-0 pb-3 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary truncate">
                  {c._local ? "Seed Bot" : c.user_id}
                </span>
                {c._local && (
                  <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                    sample
                  </span>
                )}
              </div>
              <div className="whitespace-pre-wrap break-words">{c.body}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {new Date(c.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
