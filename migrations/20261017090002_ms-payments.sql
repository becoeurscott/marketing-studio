-- Sokozia credit purchases via pawaPay Mobile Money (one-off packs, no subscription).
-- The row id is the pawaPay depositId. Amounts are computed on the server from the pack catalog.
-- Credits are granted only by ms_complete_payment(), once, after re-checking the deposit with pawaPay.

CREATE TABLE IF NOT EXISTS public.ms_payments (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id     text NOT NULL,
  credits     integer NOT NULL CHECK (credits > 0),
  amount      integer NOT NULL CHECK (amount > 0),
  currency    text NOT NULL,
  country     text NOT NULL,
  amount_xof  integer NOT NULL CHECK (amount_xof > 0),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  provider    text,
  raw         jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ms_payments_user_idx ON public.ms_payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ms_payments_status_idx ON public.ms_payments (status, created_at DESC);

ALTER TABLE public.ms_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_payments FROM anon, authenticated;
GRANT SELECT ON public.ms_payments TO authenticated;
DROP POLICY IF EXISTS ms_payments_own ON public.ms_payments;
CREATE POLICY ms_payments_own ON public.ms_payments FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- Marks a pending payment completed and credits the account, exactly once. Returns true when it credited.
CREATE OR REPLACE FUNCTION public.ms_complete_payment(p_payment uuid, p_provider text, p_raw jsonb)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE v_user uuid; v_credits integer; v_pack text; v_balance integer;
BEGIN
  UPDATE public.ms_payments SET status = 'completed', provider = p_provider, raw = p_raw, updated_at = now()
  WHERE id = p_payment AND status = 'pending'
  RETURNING user_id, credits, pack_id INTO v_user, v_credits, v_pack;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.ms_accounts (user_id, credits) VALUES (v_user, 0) ON CONFLICT (user_id) DO NOTHING;
  UPDATE public.ms_accounts SET credits = credits + v_credits, updated_at = now()
  WHERE user_id = v_user RETURNING credits INTO v_balance;
  INSERT INTO public.ms_credit_ledger (user_id, amount, balance_after, action, description)
  VALUES (v_user, v_credits, v_balance, 'purchase', 'Achat Mobile Money — ' || v_pack);
  RETURN true;
END $$;

REVOKE EXECUTE ON FUNCTION public.ms_complete_payment(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
