
-- Helper: can the current user read a business-documents object?
CREATE OR REPLACE FUNCTION public.can_read_business_doc(_object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _owner_segment TEXT;
  _business_segment TEXT;
  _business_id UUID;
  _owner_id UUID;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;

  -- Path is: {owner_id}/{business_id}/{file}
  _owner_segment := (storage.foldername(_object_name))[1];
  _business_segment := (storage.foldername(_object_name))[2];

  -- Owner shortcut (matches folder convention)
  IF _owner_segment = _uid::text THEN RETURN true; END IF;

  -- Admin
  IF public.is_admin(_uid) THEN RETURN true; END IF;

  -- Validate business id and verify owner via DB (don't trust path alone)
  BEGIN
    _business_id := _business_segment::uuid;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;

  SELECT owner_id INTO _owner_id FROM public.businesses WHERE id = _business_id;
  IF _owner_id IS NULL THEN RETURN false; END IF;
  IF _owner_id = _uid THEN RETURN true; END IF;

  -- Approved investor: has a confirmed/completed investment in any campaign of this business
  IF EXISTS (
    SELECT 1
    FROM public.investments i
    JOIN public.campaigns c ON c.id = i.campaign_id
    WHERE c.business_id = _business_id
      AND i.investor_id = _uid
      AND i.status IN ('confirmed','completed')
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.can_read_business_doc(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_business_doc(text) TO authenticated;

-- Replace business-documents SELECT policies with stricter version
DROP POLICY IF EXISTS "Users can view own business documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all business documents" ON storage.objects;

CREATE POLICY "Business docs: owner approved investor or admin can read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'business-documents'
  AND public.can_read_business_doc(name)
);

-- Tighten KYC SELECT to authenticated only (owner or admin)
DROP POLICY IF EXISTS "Users read own kyc files or admin read all" ON storage.objects;
CREATE POLICY "KYC docs: owner or admin can read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR public.is_admin(auth.uid())
  )
);

-- Lightweight RPC to log a storage access denial from the client
CREATE OR REPLACE FUNCTION public.log_storage_denial(
  _bucket text,
  _path text,
  _reason text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.error_logs (user_id, category, source, message, context)
  VALUES (
    auth.uid(),
    'rls',
    'storage',
    COALESCE(_reason, 'Storage access denied'),
    jsonb_build_object('bucket', _bucket, 'path', _path)
  ) RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_storage_denial(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_storage_denial(text, text, text) TO authenticated;

-- Performance indexes supporting the new policy lookups
CREATE INDEX IF NOT EXISTS idx_investments_investor_status ON public.investments(investor_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON public.campaigns(business_id);
