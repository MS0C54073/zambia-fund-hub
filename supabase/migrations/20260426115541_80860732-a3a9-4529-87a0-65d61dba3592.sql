
-- KYC kind + status enums
CREATE TYPE public.kyc_kind AS ENUM ('individual', 'business');
CREATE TYPE public.kyc_status AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');

-- KYC submissions table
CREATE TABLE public.kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  kind public.kyc_kind NOT NULL,
  status public.kyc_status NOT NULL DEFAULT 'pending',

  -- Individual fields
  full_name TEXT,
  nrc_number TEXT,
  date_of_birth DATE,
  nrc_doc_url TEXT,
  selfie_url TEXT,

  -- Business fields
  legal_name TEXT,
  tpin TEXT,
  pacra_number TEXT,
  pacra_doc_url TEXT,

  -- Review
  reviewer_id UUID,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one individual KYC per user; one KYC per business
CREATE UNIQUE INDEX kyc_unique_individual
  ON public.kyc_submissions (user_id)
  WHERE kind = 'individual';

CREATE UNIQUE INDEX kyc_unique_business
  ON public.kyc_submissions (business_id)
  WHERE kind = 'business' AND business_id IS NOT NULL;

CREATE INDEX kyc_status_idx ON public.kyc_submissions (status);

-- updated_at trigger
CREATE TRIGGER kyc_updated_at
BEFORE UPDATE ON public.kyc_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own kyc or admin view all"
ON public.kyc_submissions FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own kyc"
ON public.kyc_submissions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own pending or admin update all"
ON public.kyc_submissions FOR UPDATE
USING (
  (user_id = auth.uid() AND status IN ('pending', 'rejected'))
  OR public.has_role(auth.uid(), 'admin')
);

-- KYC approved helper
CREATE OR REPLACE FUNCTION public.is_kyc_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.kyc_submissions
    WHERE user_id = _user_id
      AND kind = 'individual'
      AND status = 'approved'
  );
$$;

-- Storage bucket for KYC documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: users folder = their auth.uid()
CREATE POLICY "Users upload own kyc files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users read own kyc files or admin read all"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users update own kyc files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own kyc files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update wallet_invest to require approved KYC
CREATE OR REPLACE FUNCTION public.wallet_invest(_campaign_id uuid, _amount numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  IF NOT public.is_kyc_approved(_user) THEN
    RAISE EXCEPTION 'KYC verification required. Please submit your NRC details before investing.';
  END IF;

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
