-- 1. Revoke public EXECUTE on internal SECURITY DEFINER helpers.
-- These should only be callable from within RLS policies / other DB functions,
-- not directly from PostgREST by anon or authenticated users.
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_kyc_approved(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_new_profile() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- Wallet RPCs remain callable by authenticated users (they enforce auth.uid() internally)
GRANT EXECUTE ON FUNCTION public.wallet_deposit(numeric, public.payment_provider, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_withdraw(numeric, public.payment_provider, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_invest(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_payout(uuid, numeric, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.wallet_deposit(numeric, public.payment_provider, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_withdraw(numeric, public.payment_provider, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_invest(uuid, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_payout(uuid, numeric, text, text) FROM PUBLIC, anon;

-- 2. Allow admins to manage non-super-admin roles; super_admin retains full control.
DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage non-super roles" ON public.user_roles;

CREATE POLICY "Super admins manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins manage non-super roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin')
  AND role <> 'super_admin'
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND role <> 'super_admin'
);
