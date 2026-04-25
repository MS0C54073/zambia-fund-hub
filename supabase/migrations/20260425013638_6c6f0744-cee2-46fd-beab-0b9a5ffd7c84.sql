-- Admin-only function: credit a payout (ROI return) or refund to an investor wallet,
-- linked to a specific investment so portfolio ROI updates instantly.
CREATE OR REPLACE FUNCTION public.wallet_payout(
  _investment_id uuid,
  _amount numeric,
  _kind text DEFAULT 'payout',           -- 'payout' or 'refund'
  _description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller UUID := auth.uid();
  _investor UUID;
  _campaign UUID;
  _wallet_id UUID;
  _tx_id UUID;
  _tx_type public.wallet_tx_type;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.has_role(_caller, 'admin') THEN
    RAISE EXCEPTION 'Only admins can issue payouts';
  END IF;
  IF _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF _kind NOT IN ('payout', 'refund') THEN
    RAISE EXCEPTION 'Invalid payout kind';
  END IF;

  SELECT investor_id, campaign_id INTO _investor, _campaign
  FROM public.investments WHERE id = _investment_id;

  IF _investor IS NULL THEN
    RAISE EXCEPTION 'Investment not found';
  END IF;

  -- Ensure the investor has a wallet
  SELECT id INTO _wallet_id FROM public.wallets WHERE user_id = _investor FOR UPDATE;
  IF _wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id) VALUES (_investor) RETURNING id INTO _wallet_id;
  END IF;

  UPDATE public.wallets SET balance = balance + _amount WHERE id = _wallet_id;

  _tx_type := _kind::public.wallet_tx_type;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, status, amount, provider,
    related_investment_id, related_campaign_id, description, completed_at
  ) VALUES (
    _wallet_id, _investor, _tx_type, 'completed', _amount, 'wallet',
    _investment_id, _campaign,
    COALESCE(_description, CASE WHEN _kind = 'refund' THEN 'Investment refund' ELSE 'Investment payout / ROI' END),
    now()
  ) RETURNING id INTO _tx_id;

  -- If refund, also flag the investment status
  IF _kind = 'refund' THEN
    UPDATE public.investments SET status = 'refunded' WHERE id = _investment_id;
  END IF;

  RETURN _tx_id;
END;
$$;