-- Sokozia admin dashboard (/admin): settings, audit log and read/aggregate functions.
-- Everything here is server-only: tables and functions are not reachable by anon/authenticated;
-- the Next.js server calls them with the admin key after checking the admin allow-list.

CREATE TABLE IF NOT EXISTS public.ms_admin_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_by  text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ms_admin_audit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email text NOT NULL,
  action      text NOT NULL,                 -- e.g. credits.adjust, plan.update, job.refund, config.update
  target_type text NOT NULL,
  target_id   text,
  before      jsonb,
  after       jsonb,
  reason      text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ms_admin_audit_created_idx ON public.ms_admin_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS ms_admin_audit_target_idx ON public.ms_admin_audit (target_type, target_id);
CREATE INDEX IF NOT EXISTS ms_jobs_created_idx ON public.ms_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS ms_ledger_created_idx ON public.ms_credit_ledger (created_at DESC);

ALTER TABLE public.ms_admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ms_admin_audit  ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_admin_config, public.ms_admin_audit FROM anon, authenticated;

-- ---------- Overview: KPIs, breakdowns and daily series in a handful of grouped queries ----------
CREATE OR REPLACE FUNCTION public.ms_admin_overview(p_days integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_days  integer := GREATEST(1, LEAST(COALESCE(p_days, 30), 366));
  v_to    timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' + interval '1 day';
  v_from  timestamptz := v_to - make_interval(days => v_days);
  v_prev  timestamptz := v_from - make_interval(days => v_days);
  r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'from', v_from, 'to', v_to, 'days', v_days,
    'users', jsonb_build_object(
      'total',    (SELECT count(*) FROM ms_accounts),
      'new',      (SELECT count(*) FROM ms_accounts WHERE created_at >= v_from),
      'newPrev',  (SELECT count(*) FROM ms_accounts WHERE created_at >= v_prev AND created_at < v_from),
      'active',   (SELECT count(DISTINCT user_id) FROM ms_jobs WHERE created_at >= v_from),
      'activePrev',(SELECT count(DISTINCT user_id) FROM ms_jobs WHERE created_at >= v_prev AND created_at < v_from),
      'byPlan',   (SELECT coalesce(jsonb_object_agg(plan, n), '{}'::jsonb) FROM (SELECT plan, count(*) n FROM ms_accounts GROUP BY plan) t)
    ),
    'credits', jsonb_build_object(
      'outstanding', (SELECT coalesce(sum(credits), 0) FROM ms_accounts),
      'spent',       (SELECT coalesce(sum(cost), 0) FROM ms_jobs WHERE NOT refunded AND created_at >= v_from),
      'spentPrev',   (SELECT coalesce(sum(cost), 0) FROM ms_jobs WHERE NOT refunded AND created_at >= v_prev AND created_at < v_from),
      'spentAll',    (SELECT coalesce(sum(cost), 0) FROM ms_jobs WHERE NOT refunded),
      'refunded',    (SELECT coalesce(sum(amount), 0) FROM ms_credit_ledger WHERE action = 'refund' AND created_at >= v_from),
      'purchased',   (SELECT coalesce(sum(amount), 0) FROM ms_credit_ledger WHERE action = 'purchase' AND created_at >= v_from),
      'purchasedPrev',(SELECT coalesce(sum(amount), 0) FROM ms_credit_ledger WHERE action = 'purchase' AND created_at >= v_prev AND created_at < v_from),
      'gifted',      (SELECT coalesce(sum(amount), 0) FROM ms_credit_ledger WHERE action IN ('bonus', 'admin') AND amount > 0 AND created_at >= v_from)
    ),
    'jobs', jsonb_build_object(
      'total',     (SELECT count(*) FROM ms_jobs WHERE created_at >= v_from),
      'totalPrev', (SELECT count(*) FROM ms_jobs WHERE created_at >= v_prev AND created_at < v_from),
      'failed',    (SELECT count(*) FROM ms_jobs WHERE created_at >= v_from AND status IN ('failed','nsfw','canceled','error')),
      'running',   (SELECT count(*) FROM ms_jobs WHERE status IN ('charged','queued','in_progress')),
      'byStatus',  (SELECT coalesce(jsonb_object_agg(status, n), '{}'::jsonb) FROM (SELECT status, count(*) n FROM ms_jobs WHERE created_at >= v_from GROUP BY status) t),
      'byKind',    (SELECT coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) FROM (SELECT kind, count(*) n FROM ms_jobs WHERE created_at >= v_from GROUP BY kind) t),
      'byModel',   (SELECT coalesce(jsonb_agg(jsonb_build_object('model', model, 'jobs', n, 'credits', c) ORDER BY c DESC), '[]'::jsonb)
                    FROM (SELECT model, count(*) n, sum(CASE WHEN refunded THEN 0 ELSE cost END) c FROM ms_jobs WHERE created_at >= v_from GROUP BY model) t)
    ),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'credits', coalesce(j.credits, 0), 'jobs', coalesce(j.jobs, 0), 'failed', coalesce(j.failed, 0), 'users', coalesce(u.users, 0)) ORDER BY d.day), '[]'::jsonb)
      FROM generate_series(v_from, v_to - interval '1 day', interval '1 day') AS d(day)
      LEFT JOIN (
        SELECT date_trunc('day', created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS day,
               sum(CASE WHEN refunded THEN 0 ELSE cost END) credits, count(*) jobs,
               count(*) FILTER (WHERE status IN ('failed','nsfw','canceled','error')) failed
        FROM ms_jobs WHERE created_at >= v_from GROUP BY 1
      ) j ON j.day = d.day
      LEFT JOIN (
        SELECT date_trunc('day', created_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS day, count(*) users
        FROM ms_accounts WHERE created_at >= v_from GROUP BY 1
      ) u ON u.day = d.day
    )
  ) INTO r;
  RETURN r;
END $$;

-- ---------- Users list (Sokozia accounts only; auth.users is shared with another app) ----------
CREATE OR REPLACE FUNCTION public.ms_admin_users(p_query text, p_plan text, p_limit integer, p_offset integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_q text := nullif(trim(coalesce(p_query, '')), '');
  r jsonb;
BEGIN
  WITH base AS (
    SELECT a.user_id, u.email, coalesce(u.profile->>'name', '') AS name, a.credits, a.plan, a.created_at,
           (SELECT count(*) FROM ms_jobs j WHERE j.user_id = a.user_id) AS jobs,
           (SELECT coalesce(sum(cost), 0) FROM ms_jobs j WHERE j.user_id = a.user_id AND NOT refunded) AS spent,
           (SELECT max(created_at) FROM ms_jobs j WHERE j.user_id = a.user_id) AS last_job,
           (SELECT coalesce(sum(amount), 0) FROM ms_credit_ledger l WHERE l.user_id = a.user_id AND l.action = 'purchase') AS purchased
    FROM ms_accounts a JOIN auth.users u ON u.id = a.user_id
    WHERE (v_q IS NULL OR u.email ILIKE '%' || v_q || '%' OR coalesce(u.profile->>'name', '') ILIKE '%' || v_q || '%' OR a.user_id::text = v_q)
      AND (nullif(p_plan, '') IS NULL OR a.plan = p_plan)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'items', coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC) FROM (SELECT * FROM base ORDER BY created_at DESC LIMIT LEAST(coalesce(p_limit, 50), 100) OFFSET GREATEST(coalesce(p_offset, 0), 0)) b), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END $$;

-- One user: account, identity and workspace size.
CREATE OR REPLACE FUNCTION public.ms_admin_user(p_user uuid)
RETURNS jsonb
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'user_id', a.user_id, 'email', u.email, 'name', coalesce(u.profile->>'name', ''), 'credits', a.credits, 'plan', a.plan,
    'created_at', a.created_at, 'email_verified', u.email_verified,
    'jobs', (SELECT count(*) FROM ms_jobs j WHERE j.user_id = a.user_id),
    'spent', (SELECT coalesce(sum(cost), 0) FROM ms_jobs j WHERE j.user_id = a.user_id AND NOT refunded),
    'purchased', (SELECT coalesce(sum(amount), 0) FROM ms_credit_ledger l WHERE l.user_id = a.user_id AND l.action = 'purchase'),
    'projects', (SELECT coalesce(jsonb_array_length(s.state->'projects'), 0) FROM ms_state s WHERE s.user_id = a.user_id),
    'assets', (SELECT coalesce(jsonb_array_length(s.state->'assets'), 0) FROM ms_state s WHERE s.user_id = a.user_id),
    'campaigns', (SELECT coalesce(jsonb_array_length(s.state->'campaigns'), 0) FROM ms_state s WHERE s.user_id = a.user_id),
    'workspace_updated_at', (SELECT updated_at FROM ms_state s WHERE s.user_id = a.user_id),
    'workspace_bytes', (SELECT pg_column_size(state) FROM ms_state s WHERE s.user_id = a.user_id)
  )
  FROM ms_accounts a JOIN auth.users u ON u.id = a.user_id
  WHERE a.user_id = p_user;
$$;

-- ---------- Jobs list with the user's email ----------
CREATE OR REPLACE FUNCTION public.ms_admin_jobs(p_status text, p_kind text, p_query text, p_user uuid, p_limit integer, p_offset integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_q text := nullif(trim(coalesce(p_query, '')), '');
  r jsonb;
BEGIN
  WITH base AS (
    SELECT j.id, j.user_id, u.email, j.hf_request_id, j.kind, j.model, j.cost, j.status, j.outputs, j.refunded, j.finalized, j.created_at, j.updated_at
    FROM ms_jobs j LEFT JOIN auth.users u ON u.id = j.user_id
    WHERE (nullif(p_status, '') IS NULL
           OR (p_status = 'failed' AND j.status IN ('failed','nsfw','canceled','error'))
           OR (p_status = 'running' AND j.status IN ('charged','queued','in_progress'))
           OR j.status = p_status)
      AND (nullif(p_kind, '') IS NULL OR j.kind = p_kind)
      AND (p_user IS NULL OR j.user_id = p_user)
      AND (v_q IS NULL OR u.email ILIKE '%' || v_q || '%' OR j.model ILIKE '%' || v_q || '%' OR j.hf_request_id ILIKE '%' || v_q || '%' OR j.id::text = v_q)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'items', coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC) FROM (SELECT * FROM base ORDER BY created_at DESC LIMIT LEAST(coalesce(p_limit, 50), 100) OFFSET GREATEST(coalesce(p_offset, 0), 0)) b), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END $$;

-- ---------- Credit ledger with the user's email ----------
CREATE OR REPLACE FUNCTION public.ms_admin_ledger(p_action text, p_query text, p_user uuid, p_limit integer, p_offset integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_q text := nullif(trim(coalesce(p_query, '')), '');
  r jsonb;
BEGIN
  WITH base AS (
    SELECT l.id, l.user_id, u.email, l.amount, l.balance_after, l.action, l.description, l.job_id, l.created_at
    FROM ms_credit_ledger l LEFT JOIN auth.users u ON u.id = l.user_id
    WHERE (nullif(p_action, '') IS NULL OR l.action = p_action)
      AND (p_user IS NULL OR l.user_id = p_user)
      AND (v_q IS NULL OR u.email ILIKE '%' || v_q || '%' OR l.description ILIKE '%' || v_q || '%')
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'items', coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC) FROM (SELECT * FROM base ORDER BY created_at DESC LIMIT LEAST(coalesce(p_limit, 50), 100) OFFSET GREATEST(coalesce(p_offset, 0), 0)) b), '[]'::jsonb)
  ) INTO r;
  RETURN r;
END $$;

-- ---------- Writes ----------
-- Adds (positive) or removes (negative) credits atomically; never below zero. Returns the new balance.
CREATE OR REPLACE FUNCTION public.ms_admin_adjust_credits(p_user uuid, p_amount integer, p_reason text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_balance integer; v_applied integer;
BEGIN
  IF p_amount = 0 THEN RAISE EXCEPTION 'zero_amount'; END IF;
  SELECT credits INTO v_balance FROM public.ms_accounts WHERE user_id = p_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'unknown_user'; END IF;
  v_applied := GREATEST(p_amount, -v_balance);
  UPDATE public.ms_accounts SET credits = credits + v_applied, updated_at = now() WHERE user_id = p_user
  RETURNING credits INTO v_balance;
  INSERT INTO public.ms_credit_ledger (user_id, amount, balance_after, action, description)
  VALUES (p_user, v_applied, v_balance, 'admin', coalesce(nullif(trim(p_reason), ''), 'Ajustement administrateur'));
  RETURN v_balance;
END $$;

REVOKE EXECUTE ON FUNCTION public.ms_admin_overview(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_admin_users(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_admin_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_admin_jobs(text, text, text, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_admin_ledger(text, text, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ms_admin_adjust_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
