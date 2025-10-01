ALTER TABLE public.shadow_comments
  ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false;

-- Optional index for filtering out bot comments later
CREATE INDEX IF NOT EXISTS shadow_comments_video_nonbot_idx
  ON public.shadow_comments (video_id)
  WHERE (is_bot = false OR is_bot IS NULL);
