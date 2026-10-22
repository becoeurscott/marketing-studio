-- Community feed: creations a user chose to publish. Written only by the server (service key), read through /api/community.
CREATE TABLE IF NOT EXISTS public.ms_community_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('image', 'video', 'ugc')),
  url         text NOT NULL,
  poster      text,
  prompt      text NOT NULL DEFAULT '',
  model_label text NOT NULL DEFAULT '',
  ratio       text NOT NULL DEFAULT '4:5',
  author      text NOT NULL DEFAULT '',
  hidden      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);
CREATE INDEX IF NOT EXISTS ms_community_posts_feed_idx ON public.ms_community_posts (created_at DESC) WHERE NOT hidden;
ALTER TABLE public.ms_community_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_community_posts FROM anon, authenticated;
