
-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile or admin can view all"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile (for suspend/ban)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile or admin can update all"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete businesses
CREATE POLICY "Admins can delete businesses"
  ON public.businesses FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete campaigns
CREATE POLICY "Admins can delete campaigns"
  ON public.campaigns FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add is_suspended column to profiles for user suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- Add proposal fields to campaigns for structured proposals
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_problem text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_solution text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_market_size text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_revenue_model text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_traction text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_use_of_funds text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proposal_doc_url text;

-- Add logo_url and valuation fields to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS valuation numeric;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS equity_offered numeric;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS pitch_summary text;
