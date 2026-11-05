-- Admin view of credit purchases (pawaPay / Stripe) and Stripe subscriptions.
-- Server-only, like the other ms_admin_* functions.

CREATE OR REPLACE FUNCTION public.ms_admin_payments(p_status text, p_query text, p_limit integer, p_offset integer)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_q text := nullif(trim(coalesce(p_query, '')), '');
  r jsonb;
BEGIN
  WITH base AS (
    SELECT p.id, p.user_id, u.email, p.pack_id, p.credits, p.amount, p.currency, p.country, p.amount_xof,
           p.status, p.provider, p.created_at, p.updated_at
    FROM ms_payments p LEFT JOIN auth.users u ON u.id = p.user_id
    WHERE (nullif(p_status, '') IS NULL OR p.status = p_status)
      AND (v_q IS NULL OR u.email ILIKE '%' || v_q || '%' OR p.pack_id ILIKE '%' || v_q || '%' OR p.id::text = v_q)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM base),
    'items', coalesce((SELECT jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC) FROM (SELECT * FROM base ORDER BY created_at DESC LIMIT LEAST(coalesce(p_limit, 50), 100) OFFSET GREATEST(coalesce(p_offset, 0), 0)) b), '[]'::jsonb),
    'summary', jsonb_build_object(
      'revenueXof30', (SELECT coalesce(sum(amount_xof), 0) FROM ms_payments WHERE status = 'completed' AND created_at > now() - interval '30 days'),
      'revenueXofAll', (SELECT coalesce(sum(amount_xof), 0) FROM ms_payments WHERE status = 'completed'),
      'completed30', (SELECT count(*) FROM ms_payments WHERE status = 'completed' AND created_at > now() - interval '30 days'),
      'pending', (SELECT count(*) FROM ms_payments WHERE status = 'pending'),
      'failed30', (SELECT count(*) FROM ms_payments WHERE status = 'failed' AND created_at > now() - interval '30 days'),
      'buyers', (SELECT count(DISTINCT user_id) FROM ms_payments WHERE status = 'completed'),
      'activeSubs', (SELECT count(*) FROM ms_subscriptions WHERE status IN ('active', 'trialing')),
      'onboarded', (SELECT count(*) FROM ms_accounts WHERE onboarding_done),
      'accounts', (SELECT count(*) FROM ms_accounts)
    )
  ) INTO r;
  RETURN r;
END $$;

REVOKE EXECUTE ON FUNCTION public.ms_admin_payments(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
