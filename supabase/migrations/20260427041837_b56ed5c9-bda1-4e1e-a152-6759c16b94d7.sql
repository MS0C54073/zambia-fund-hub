-- Unified helper: returns true for admin OR super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- Update payout function to accept super_admin too
CREATE OR REPLACE FUNCTION public.wallet_payout(_investment_id uuid, _amount numeric, _kind text DEFAULT 'payout'::text, _description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller UUID := auth.uid();
  _investor UUID;
  _campaign UUID;
  _wallet_id UUID;
  _tx_id UUID;
  _tx_type public.wallet_tx_type;
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_admin(_caller) THEN
    RAISE EXCEPTION 'Only admins can issue payouts';
  END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  IF _kind NOT IN ('payout', 'refund') THEN RAISE EXCEPTION 'Invalid payout kind'; END IF;

  SELECT investor_id, campaign_id INTO _investor, _campaign
  FROM public.investments WHERE id = _investment_id;
  IF _investor IS NULL THEN RAISE EXCEPTION 'Investment not found'; END IF;

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

  IF _kind = 'refund' THEN
    UPDATE public.investments SET status = 'refunded' WHERE id = _investment_id;
  END IF;

  RETURN _tx_id;
END;
$function$;

-- Update RLS policies to use is_admin (covers admin + super_admin)
DROP POLICY IF EXISTS "Admins can delete businesses" ON public.businesses;
CREATE POLICY "Admins can delete businesses" ON public.businesses
FOR DELETE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view approved businesses" ON public.businesses;
CREATE POLICY "Anyone can view approved businesses" ON public.businesses
FOR SELECT USING ((is_approved = true) OR (owner_id = auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Owners can update own businesses" ON public.businesses;
CREATE POLICY "Owners can update own businesses" ON public.businesses
FOR UPDATE USING ((auth.uid() = owner_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.campaigns;
CREATE POLICY "Admins can delete campaigns" ON public.campaigns
FOR DELETE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.campaigns;
CREATE POLICY "Anyone can view active campaigns" ON public.campaigns
FOR SELECT USING (
  (status = 'active'::campaign_status)
  OR (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = campaigns.business_id AND businesses.owner_id = auth.uid()))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Business owners can update campaigns" ON public.campaigns;
CREATE POLICY "Business owners can update campaigns" ON public.campaigns
FOR UPDATE USING (
  (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = campaigns.business_id AND businesses.owner_id = auth.uid()))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Admins can update investments" ON public.investments;
CREATE POLICY "Admins can update investments" ON public.investments
FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Investors can view own investments" ON public.investments;
CREATE POLICY "Investors can view own investments" ON public.investments
FOR SELECT USING ((investor_id = auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON public.profiles;
CREATE POLICY "Users can update own profile or admin can update all" ON public.profiles
FOR UPDATE USING ((auth.uid() = user_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin can view all" ON public.profiles
FOR SELECT USING ((auth.uid() = user_id) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users update own pending or admin update all" ON public.kyc_submissions;
CREATE POLICY "Users update own pending or admin update all" ON public.kyc_submissions
FOR UPDATE USING (
  ((user_id = auth.uid()) AND (status = ANY (ARRAY['pending'::kyc_status, 'rejected'::kyc_status])))
  OR public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "Users view own kyc or admin view all" ON public.kyc_submissions;
CREATE POLICY "Users view own kyc or admin view all" ON public.kyc_submissions
FOR SELECT USING ((user_id = auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update wallets" ON public.wallets;
CREATE POLICY "Admins update wallets" ON public.wallets
FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet" ON public.wallets
FOR SELECT USING ((user_id = auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update wallet tx" ON public.wallet_transactions;
CREATE POLICY "Admins update wallet tx" ON public.wallet_transactions
FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own wallet tx" ON public.wallet_transactions;
CREATE POLICY "Users view own wallet tx" ON public.wallet_transactions
FOR SELECT USING ((user_id = auth.uid()) OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
FOR SELECT USING ((user_id = auth.uid()) OR public.is_admin(auth.uid()));

-- Only super_admin can manage roles (admins can no longer self-elevate)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));