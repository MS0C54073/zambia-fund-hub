-- Performance indexes on hot query paths (RLS filter columns + sort keys)
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business_id ON public.campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created ON public.campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON public.campaigns(end_date) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_investments_investor ON public.investments(investor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investments_campaign ON public.investments(campaign_id);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_approved ON public.businesses(is_approved) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON public.saved_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id, created_at DESC);