import { useAuth } from "@/hooks/useAuth";
import { useComments } from "@/hooks/useComments";
import { useState } from "react";

interface Props {
  videoId: string | null;
}

export function CommentsPane({ videoId }: Props) {
  const { user } = useAuth();
  const { comments, loading, error, tableMissing, add, reload } = useComments(videoId);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!videoId) {
    return null;
  }

}
