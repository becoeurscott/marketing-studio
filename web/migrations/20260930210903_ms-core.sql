-- Sokozia marketing studio ("ms_" prefix: this InsForge project is shared with another app;
-- never touch its tables: profiles, styles, settings, conversations, messages, videos, payments, ...).
--
-- Model:
--   ms_accounts       credit balance + plan, one row per user (server-owned)
--   ms_credit_ledger  append-only history of every credit change
--   ms_jobs           every Higgsfield generation, its cost and refund state
--   ms_state          the user's workspace document (projects, assets, brands, campaigns, ...)
-- Users may only READ their own rows. All writes go through server code using the admin key
-- and the SECURITY DEFINER functions below (EXECUTE revoked from anon/authenticated).

CREATE TABLE IF NOT EXISTS public.ms_accounts (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits     integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  plan        text NOT NULL DEFAULT 'starter',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ms_credit_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        integer NOT NULL,              -- negative = spent, positive = added
  balance_after integer NOT NULL,
  action        text NOT NULL,                 -- image | video | ugc | upscale | bonus | refund | purchase
  description   text NOT NULL DEFAULT '',
  job_id        uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ms_credit_ledger_user_idx ON public.ms_credit_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ms_jobs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hf_request_id  text UNIQUE,
  kind           text NOT NULL,                -- image | video
  model          text NOT NULL,
  cost           integer NOT NULL CHECK (cost >= 0),
  status         text NOT NULL DEFAULT 'charged'
                 CHECK (status IN ('charged','queued','in_progress','completed','failed','nsfw','canceled','error')),
  outputs        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{ url, key, type }] after re-hosting in storage
  refunded       boolean NOT NULL DEFAULT false,
  finalized      boolean NOT NULL DEFAULT false,      -- outputs stored or refund done (idempotency guard)
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ms_jobs_user_idx ON public.ms_jobs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ms_state (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ms_state_size CHECK (pg_column_size(state) < 2000000)
);

-- ---------- Access control: own-row reads only, no direct writes ----------
ALTER TABLE public.ms_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_state         ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ms_accounts, public.ms_credit_ledger, public.ms_jobs, public.ms_state FROM anon, authenticated;
GRANT SELECT ON public.ms_accounts, public.ms_credit_ledger, public.ms_jobs, public.ms_state TO authenticated;

DROP POLICY IF EXISTS ms_accounts_own ON public.ms_accounts;
CREATE POLICY ms_accounts_own ON public.ms_accounts FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ms_ledger_own ON public.ms_credit_ledger;
CREATE POLICY ms_ledger_own ON public.ms_credit_ledger FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ms_jobs_own ON public.ms_jobs;
CREATE POLICY ms_jobs_own ON public.ms_jobs FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ms_state_own ON public.ms_state;
CREATE POLICY ms_state_own ON public.ms_state FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- ---------- Credit functions (server-only) ----------

-- Creates the account with welcome credits on first call; returns the balance.
CREATE OR REPLACE FUNCTION public.ms_ensure_account(p_user uuid, p_welcome integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_credits integer;
BEGIN
  INSERT INTO public.ms_accounts (user_id, credits) VALUES (p_user, p_welcome)
  ON CONFLICT (user_id) DO NOTHING;
  IF FOUND AND p_welcome > 0 THEN
    INSERT INTO public.ms_credit_ledger (user_id, amount, balance_after, action, description)
    VALUES (p_user, p_welcome, p_welcome, 'bonus', 'Crédits de bienvenue');
  END IF;
  SELECT credits INTO v_credits FROM public.ms_accounts WHERE user_id = p_user;
  RETURN v_credits;
END $$;

-- Atomically debits credits and opens a job. Raises 'insufficient_credits' when the balance is too low.
CREATE OR REPLACE FUNCTION public.ms_start_job(p_user uuid, p_kind text, p_model text, p_cost integer, p_description text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_balance integer; v_job uuid;
BEGIN
  IF p_cost < 0 THEN RAISE EXCEPTION 'invalid_cost'; END IF;
  UPDATE public.ms_accounts SET credits = credits - p_cost, updated_at = now()
  WHERE user_id = p_user AND credits >= p_cost
  RETURNING credits INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient_credits'; END IF;
  INSERT INTO public.ms_jobs (user_id, kind, model, cost) VALUES (p_user, p_kind, p_model, p_cost)
  RETURNING id INTO v_job;
  INSERT INTO public.ms_credit_ledger (user_id, amount, balance_after, action, description, job_id)
  VALUES (p_user, -p_cost, v_balance, p_kind, p_description, v_job);
  RETURN v_job;
END $$;

-- Gives the credits of a job back once (failed / moderated / canceled / submit error).
CREATE OR REPLACE FUNCTION public.ms_refund_job(p_job uuid, p_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_user uuid; v_cost integer; v_balance integer;
BEGIN
  UPDATE public.ms_jobs SET refunded = true, finalized = true, status = p_status, updated_at = now()
  WHERE id = p_job AND refunded = false AND finalized = false
  RETURNING user_id, cost INTO v_user, v_cost;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.ms_accounts SET credits = credits + v_cost, updated_at = now()
  WHERE user_id = v_user RETURNING credits INTO v_balance;
  INSERT INTO public.ms_credit_ledger (user_id, amount, balance_after, action, description, job_id)
  VALUES (v_user, v_cost, v_balance, 'refund', 'Remboursement — génération non aboutie', p_job);
  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public.ms_ensure_account(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_start_job(uuid, text, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_refund_job(uuid, text) FROM PUBLIC, anon, authenticated;
