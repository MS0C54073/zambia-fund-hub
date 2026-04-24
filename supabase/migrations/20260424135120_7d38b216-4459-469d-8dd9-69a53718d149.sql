
-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  pending_balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.wallets
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update wallets" ON public.wallets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- WALLET TRANSACTIONS LEDGER
-- ============================================================
CREATE TYPE public.wallet_tx_type AS ENUM (
  'deposit', 'withdrawal', 'investment', 'payout', 'refund', 'fee'
);
CREATE TYPE public.wallet_tx_status AS ENUM (
  'pending', 'completed', 'failed', 'cancelled'
);
CREATE TYPE public.payment_provider AS ENUM (
  'mtn_momo', 'airtel_money', 'zamtel_kwacha', 'bank_transfer', 'wallet', 'flutterwave'
);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type public.wallet_tx_type NOT NULL,
  status public.wallet_tx_status NOT NULL DEFAULT 'pending',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'ZMW',
  provider public.payment_provider,
  provider_reference TEXT,
  phone_number TEXT,
  related_investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  related_campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_wtx_wallet ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_wtx_user ON public.wallet_transactions(user_id, created_at DESC);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet tx" ON public.wallet_transactions
  FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own wallet tx" ON public.wallet_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update wallet tx" ON public.wallet_transactions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SAVED BUSINESSES (for Phase 2)
-- ============================================================
CREATE TABLE public.saved_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

ALTER TABLE public.saved_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved" ON public.saved_businesses
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- AUTO-CREATE WALLET ON PROFILE CREATION
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id) VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_wallet_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_profile();

-- Backfill wallets for existing profiles
INSERT INTO public.wallets (user_id)
SELECT user_id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- ATOMIC WALLET OPERATIONS
-- ============================================================

-- Deposit: simulated mobile money / bank top-up
CREATE OR REPLACE FUNCTION public.wallet_deposit(
  _amount NUMERIC,
  _provider public.payment_provider,
  _phone TEXT DEFAULT NULL,
  _reference TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _wallet_id UUID;
  _tx_id UUID;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT id INTO _wallet_id FROM public.wallets WHERE user_id = _user FOR UPDATE;
  IF _wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id) VALUES (_user) RETURNING id INTO _wallet_id;
  END IF;

  UPDATE public.wallets SET balance = balance + _amount WHERE id = _wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, status, amount, provider,
    phone_number, provider_reference, description, completed_at
  ) VALUES (
    _wallet_id, _user, 'deposit', 'completed', _amount, _provider,
    _phone, _reference, 'Wallet top-up via ' || _provider::text, now()
  ) RETURNING id INTO _tx_id;

  RETURN _tx_id;
END;
$$;

-- Withdraw: simulated payout to mobile money / bank
CREATE OR REPLACE FUNCTION public.wallet_withdraw(
  _amount NUMERIC,
  _provider public.payment_provider,
  _phone TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _wallet_id UUID;
  _balance NUMERIC;
  _tx_id UUID;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT id, balance INTO _wallet_id, _balance
  FROM public.wallets WHERE user_id = _user FOR UPDATE;

  IF _wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF _balance < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  UPDATE public.wallets SET balance = balance - _amount WHERE id = _wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, status, amount, provider,
    phone_number, description, completed_at
  ) VALUES (
    _wallet_id, _user, 'withdrawal', 'completed', _amount, _provider,
    _phone, 'Withdrawal to ' || _provider::text, now()
  ) RETURNING id INTO _tx_id;

  RETURN _tx_id;
END;
$$;

-- Invest: debit wallet, create investment, bump campaign raised_amount
CREATE OR REPLACE FUNCTION public.wallet_invest(
  _campaign_id UUID,
  _amount NUMERIC
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _wallet_id UUID;
  _balance NUMERIC;
  _investment_id UUID;
  _tx_id UUID;
  _campaign_status public.campaign_status;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;

  SELECT status INTO _campaign_status FROM public.campaigns WHERE id = _campaign_id;
  IF _campaign_status IS NULL THEN RAISE EXCEPTION 'Campaign not found'; END IF;
  IF _campaign_status <> 'active' THEN RAISE EXCEPTION 'Campaign is not active'; END IF;

  SELECT id, balance INTO _wallet_id, _balance
  FROM public.wallets WHERE user_id = _user FOR UPDATE;

  IF _wallet_id IS NULL THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF _balance < _amount THEN RAISE EXCEPTION 'Insufficient wallet balance. Please top up first.'; END IF;

  UPDATE public.wallets SET balance = balance - _amount WHERE id = _wallet_id;

  INSERT INTO public.investments (campaign_id, investor_id, amount, status, payment_method)
  VALUES (_campaign_id, _user, _amount, 'confirmed', 'wallet')
  RETURNING id INTO _investment_id;

  UPDATE public.campaigns SET raised_amount = raised_amount + _amount WHERE id = _campaign_id;

  INSERT INTO public.wallet_transactions (
    wallet_id, user_id, type, status, amount, provider,
    related_investment_id, related_campaign_id, description, completed_at
  ) VALUES (
    _wallet_id, _user, 'investment', 'completed', _amount, 'wallet',
    _investment_id, _campaign_id, 'Investment in campaign', now()
  ) RETURNING id INTO _tx_id;

  RETURN _investment_id;
END;
$$;

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
ALTER TABLE public.wallets REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;
