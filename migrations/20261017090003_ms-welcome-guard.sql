-- Welcome credits only for verified e-mails, at most 3 bonuses per IP address per 24 h (anti-farming).
-- Accounts are now created with 0 credits; ms_grant_welcome() adds the bonus once, when allowed.

CREATE TABLE IF NOT EXISTS public.ms_welcome_grants (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ip         text NOT NULL DEFAULT '',
  credits    integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ms_welcome_grants_ip_idx ON public.ms_welcome_grants (ip, created_at DESC);
ALTER TABLE public.ms_welcome_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_welcome_grants FROM anon, authenticated;

-- Existing accounts already received their bonus: record them so they are never granted twice.
INSERT INTO public.ms_welcome_grants (user_id, ip, credits, created_at)
SELECT l.user_id, 'legacy', l.amount, min(l.created_at)
FROM public.ms_credit_ledger l
WHERE l.action = 'bonus' AND l.description = 'Crédits de bienvenue'
GROUP BY l.user_id, l.amount
ON CONFLICT (user_id) DO NOTHING;

-- Creates the account (0 credits) on first call; the welcome bonus is no longer granted here.
CREATE OR REPLACE FUNCTION public.ms_ensure_account(p_user uuid, p_welcome integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_credits integer;
BEGIN
  INSERT INTO public.ms_accounts (user_id, credits) VALUES (p_user, 0) ON CONFLICT (user_id) DO NOTHING;
  SELECT credits INTO v_credits FROM public.ms_accounts WHERE user_id = p_user;
  RETURN v_credits;
END $$;

-- Grants the welcome bonus once, only to a verified e-mail and within the per-IP limit.
-- Returns 'granted', 'already', 'unverified' or 'ip_limit'.
CREATE OR REPLACE FUNCTION public.ms_grant_welcome(p_user uuid, p_welcome integer, p_ip text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_verified boolean; v_recent integer; v_balance integer; v_ip text := left(coalesce(p_ip, ''), 64);
BEGIN
  IF p_welcome <= 0 THEN RETURN 'already'; END IF;
  IF EXISTS (SELECT 1 FROM public.ms_welcome_grants WHERE user_id = p_user) THEN RETURN 'already'; END IF;
  SELECT email_verified INTO v_verified FROM auth.users WHERE id = p_user;
  IF NOT coalesce(v_verified, false) THEN RETURN 'unverified'; END IF;
  IF v_ip <> '' THEN
    SELECT count(*) INTO v_recent FROM public.ms_welcome_grants WHERE ip = v_ip AND created_at > now() - interval '24 hours';
    IF v_recent >= 3 THEN RETURN 'ip_limit'; END IF;
  END IF;
  INSERT INTO public.ms_welcome_grants (user_id, ip, credits) VALUES (p_user, v_ip, p_welcome) ON CONFLICT (user_id) DO NOTHING;
  IF NOT FOUND THEN RETURN 'already'; END IF;
  INSERT INTO public.ms_accounts (user_id, credits) VALUES (p_user, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.ms_accounts SET credits = credits + p_welcome, updated_at = now() WHERE user_id = p_user RETURNING credits INTO v_balance;
  INSERT INTO public.ms_credit_ledger (user_id, amount, balance_after, action, description)
  VALUES (p_user, p_welcome, v_balance, 'bonus', 'Crédits de bienvenue');
  RETURN 'granted';
END $$;

REVOKE EXECUTE ON FUNCTION public.ms_ensure_account(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_grant_welcome(uuid, integer, text) FROM PUBLIC, anon, authenticated;
