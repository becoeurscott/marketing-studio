-- Stripe monthly passes. One row per user: Stripe customer, current subscription and status.
-- Credits for each paid month go through ms_payments + ms_complete_payment (exactly once per invoice).
CREATE TABLE IF NOT EXISTS public.ms_subscriptions (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id         text NOT NULL UNIQUE,
  subscription_id     text UNIQUE,
  plan                text,
  status              text NOT NULL DEFAULT 'none',
  current_period_end  timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ms_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.ms_subscriptions TO authenticated;
DROP POLICY IF EXISTS ms_subscriptions_own ON public.ms_subscriptions;
CREATE POLICY ms_subscriptions_own ON public.ms_subscriptions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
