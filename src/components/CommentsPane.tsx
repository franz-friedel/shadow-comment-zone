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
    add,
    reload,
    lastDetail,
    seededLocally,
    isBot,
  } = useComments(videoId, {
    localSeed: true,
    seedMin: 5,
  });
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
          {seededLocally && comments.length > 0 && (
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Showing sample seed comments. Post to start a real thread.
            </div>
          )}
          {loading && (
            <div className="text-xs text-muted-foreground">Loading…</div>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className="text-sm border-b last:border-b-0 pb-3 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary truncate">
                  {c.is_bot ? "Bot" : c.user_id}
                </span>
                {c.is_bot && (
                  <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                    seed
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
