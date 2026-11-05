-- Persist onboarding completion server-side so it survives reinstalls / device changes
ALTER TABLE public.ms_accounts
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

-- Mark onboarding complete for a user (idempotent). Server-only, like the other ms_* functions.
CREATE OR REPLACE FUNCTION public.ms_complete_onboarding(p_user uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  UPDATE public.ms_accounts SET onboarding_done = true WHERE user_id = p_user;
$$;

REVOKE EXECUTE ON FUNCTION public.ms_complete_onboarding(uuid) FROM PUBLIC, anon, authenticated;
